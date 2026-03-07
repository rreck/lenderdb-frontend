import { MOCK_LENDERS } from "@/data/mockLenders"
import type { Lender, WatchlistEntry, LenderFilters, MarketSummary } from "./types"

const STORAGE_KEYS = {
  lenders: "lenderdb_lenders",
  watchlist: "lenderdb_watchlist",
}

export function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.lenders)) {
    localStorage.setItem(STORAGE_KEYS.lenders, JSON.stringify(MOCK_LENDERS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.watchlist)) {
    localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify([]))
  }
}

export const localStorageService = {
  getLenders(filters?: LenderFilters): Lender[] {
    const raw = localStorage.getItem(STORAGE_KEYS.lenders)
    let lenders: Lender[] = raw ? JSON.parse(raw) : MOCK_LENDERS

    if (!filters) return lenders

    if (filters.search) {
      const q = filters.search.toLowerCase()
      lenders = lenders.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.shortName?.toLowerCase().includes(q) ||
          l.industriesFavored.some(i => i.includes(q)) ||
          l.equipmentCategories.some(c => c.includes(q))
      )
    }

    if (filters.lenderTypes?.length) {
      lenders = lenders.filter(l => filters.lenderTypes!.includes(l.lenderType))
    }

    if (filters.tiers?.length) {
      lenders = lenders.filter(l => filters.tiers!.includes(l.tier))
    }

    if (filters.minDealSize !== undefined) {
      lenders = lenders.filter(l => l.maxDealSize >= filters.minDealSize!)
    }

    if (filters.maxDealSize !== undefined) {
      lenders = lenders.filter(l => l.minDealSize <= filters.maxDealSize!)
    }

    if (filters.industries?.length) {
      lenders = lenders.filter(l =>
        filters.industries!.some(i => l.industriesFavored.includes(i))
      )
    }

    if (filters.countries?.length) {
      lenders = lenders.filter(l =>
        filters.countries!.some(c => l.countriesServed.includes(c))
      )
    }

    if (filters.riskTolerances?.length) {
      lenders = lenders.filter(l => filters.riskTolerances!.includes(l.riskTolerance))
    }

    if (filters.approvalSpeeds?.length) {
      lenders = lenders.filter(l => filters.approvalSpeeds!.includes(l.approvalSpeed))
    }

    if (filters.lendingProducts?.length) {
      lenders = lenders.filter(l =>
        filters.lendingProducts!.some(p => l.lendingProducts.includes(p))
      )
    }

    if (filters.brokerFriendlyOnly) {
      lenders = lenders.filter(l => l.brokerFriendly)
    }

    if (filters.minConfidenceScore !== undefined) {
      lenders = lenders.filter(l => l.confidenceScore >= filters.minConfidenceScore!)
    }

    return lenders
  },

  getLender(id: string): Lender | null {
    const raw = localStorage.getItem(STORAGE_KEYS.lenders)
    const lenders: Lender[] = raw ? JSON.parse(raw) : MOCK_LENDERS
    return lenders.find(l => l.id === id) ?? null
  },

  getWatchlist(): WatchlistEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.watchlist)
    const entries: WatchlistEntry[] = raw ? JSON.parse(raw) : []
    // hydrate lender objects
    const lendersRaw = localStorage.getItem(STORAGE_KEYS.lenders)
    const lenders: Lender[] = lendersRaw ? JSON.parse(lendersRaw) : MOCK_LENDERS
    return entries.map(e => ({
      ...e,
      lender: lenders.find(l => l.id === e.lenderId) ?? e.lender,
    }))
  },

  addToWatchlist(lenderId: string): WatchlistEntry {
    const entries = this.getWatchlist()
    const existing = entries.find(e => e.lenderId === lenderId)
    if (existing) return existing

    const lender = this.getLender(lenderId)
    if (!lender) throw new Error("Lender not found")

    const entry: WatchlistEntry = {
      id: `wl-${Date.now()}`,
      lenderId,
      lender,
      addedAt: new Date().toISOString(),
      alertsEnabled: true,
    }

    const updated = [...entries, entry]
    localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(updated.map(e => ({ ...e, lender: undefined, lenderId: e.lenderId }))))
    return entry
  },

  removeFromWatchlist(entryId: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.watchlist)
    const entries = raw ? JSON.parse(raw) : []
    const updated = entries.filter((e: WatchlistEntry) => e.id !== entryId)
    localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(updated))
    return true
  },

  getMarketSummary(): MarketSummary {
    const lenders = this.getLenders()
    const active = lenders.filter(l => l.status === "active")

    const allSignals = active.flatMap(l => l.appetiteSignals)
    const recent = allSignals
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .slice(0, 10)

    // Industry heat
    const industryMap: Record<string, { count: number; totalAppetite: number }> = {}
    for (const l of active) {
      for (const ind of l.industriesFavored) {
        if (!industryMap[ind]) industryMap[ind] = { count: 0, totalAppetite: 0 }
        industryMap[ind].count++
        industryMap[ind].totalAppetite += l.appetiteScore
      }
    }

    const hotIndustries = Object.entries(industryMap)
      .map(([industry, data]) => ({
        industry,
        lenderCount: data.count,
        avgAppetiteScore: Math.round(data.totalAppetite / data.count),
        trendDirection: (data.totalAppetite / data.count) > 75 ? "up" as const : (data.totalAppetite / data.count) < 60 ? "down" as const : "flat" as const,
      }))
      .sort((a, b) => b.avgAppetiteScore - a.avgAppetiteScore)
      .slice(0, 8)

    const speedRank: Record<string, number> = {
      same_day: 1, "2_3_days": 2.5, "1_week": 7, "2_4_weeks": 17, "30_plus_days": 35
    }

    const avgApprovalDays = Math.round(
      active.reduce((sum, l) => sum + speedRank[l.approvalSpeed], 0) / active.length
    )

    return {
      totalActiveLenders: active.length,
      avgApprovalDays,
      hotIndustries,
      recentSignals: recent,
      lastUpdated: new Date().toISOString(),
    }
  },
}
