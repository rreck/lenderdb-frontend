import { API_CONFIG, API_ENDPOINTS, type RequestOptions } from "./config"
import { localStorageService, initializeLocalStorage } from "./localStorage"
import { matchLenders } from "./matcher"
import { MOCK_LENDERS } from "@/data/mockLenders"
import type { Lender, LenderPage, CrawlerStatus, DealProfile, DealMatchResult, LenderFilters, MarketSummary } from "./types"

if (API_CONFIG.isLocalMode) {
  initializeLocalStorage()
  console.log("[LenderDB] Running in LOCAL MODE - using mock data")
} else {
  console.log("[LenderDB] Running in API MODE -", API_CONFIG.baseUrl)
}

async function httpClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options
  const config: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  }
  if (body && method !== "GET") config.body = JSON.stringify(body)
  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, config)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  return response.json()
}

export const apiService = {
  // ==========================================
  // Lenders
  // ==========================================
  async getLenders(filters?: LenderFilters): Promise<LenderPage> {
    if (API_CONFIG.isLocalMode) {
      const lenders = localStorageService.getLenders(filters)
      return { lenders, total: lenders.length, hasMore: false, offset: 0 }
    }
    const params = filters ? `?${new URLSearchParams(filters as Record<string, string>)}` : ""
    // The API answers { success, data: Lender[], total }. It used to wrap the
    // array in an object, so both shapes are accepted here.
    const res = await httpClient<{
      data: Lender[] | { lenders: Lender[]; total: number; hasMore: boolean; offset: number }
      total?: number
    }>(`${API_ENDPOINTS.lenders.list}${params}`)
    const payload = res.data
    const lenders = Array.isArray(payload) ? payload : (payload?.lenders ?? [])
    const total = Array.isArray(payload)
      ? (res.total ?? lenders.length)
      : (payload?.total ?? lenders.length)
    const offset = Number((filters as Record<string, unknown>)?.offset ?? 0)
    const hasMore = Array.isArray(payload)
      ? offset + lenders.length < total
      : (payload?.hasMore ?? false)
    return { lenders, total, hasMore, offset }
  },

  async getLender(id: string): Promise<Lender | null> {
    if (API_CONFIG.isLocalMode) return localStorageService.getLender(id)
    try {
      const res = await httpClient<{ data: Lender }>(API_ENDPOINTS.lenders.get(id))
      return res.data
    } catch {
      return null
    }
  },

  // ==========================================
  // Deal Matcher
  // ==========================================
  async matchDeal(deal: DealProfile): Promise<DealMatchResult> {
    if (API_CONFIG.isLocalMode) {
      const lenders = localStorageService.getLenders()
      return matchLenders(lenders, deal)
    }
    const res = await httpClient<{ data: DealMatchResult }>(API_ENDPOINTS.match.run, {
      method: "POST",
      body: deal,
    })
    return res.data
  },

  // ==========================================

  // ==========================================
  // Market Intelligence
  // ==========================================
  async getMarketSummary(): Promise<MarketSummary> {
    if (API_CONFIG.isLocalMode) return localStorageService.getMarketSummary()
    const res = await httpClient<{ data: MarketSummary }>(API_ENDPOINTS.market.summary)
    return res.data
  },

  // ==========================================
  // Crawler
  // ==========================================
  async getCrawlerStatus(): Promise<CrawlerStatus> {
    if (API_CONFIG.isLocalMode) return { status: "idle" }
    const res = await httpClient<{ data: CrawlerStatus }>("/crawler/status")
    return res.data
  },

  async triggerEnrichment(): Promise<void> {
    if (API_CONFIG.isLocalMode) return
    await httpClient("/batch", { method: "POST" })
  },

  async crawlLender(lenderId: string): Promise<void> {
    if (API_CONFIG.isLocalMode) return
    await httpClient(`${API_ENDPOINTS.lenders.get(lenderId)}/crawl`, { method: "POST" })
  },

  // ==========================================
  // Utility: all lenders (for matcher seed)
  // ==========================================
  getAllLendersLocal(): Lender[] {
    return MOCK_LENDERS
  },
}

export type { ApiResponse } from "./types"
