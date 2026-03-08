export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  isLocalMode: import.meta.env.VITE_LOCAL_MODE === "true",
}

export const API_ENDPOINTS = {
  lenders: {
    list: "/lenders",
    get: (id: string) => `/lenders/${id}`,
    create: "/lenders",
    update: (id: string) => `/lenders/${id}`,
  },
  match: {
    run: "/match",
  },
  watchlist: {
    list: "/watchlist",
    add: "/watchlist",
    remove: (id: string) => `/watchlist/${id}`,
  },
  market: {
    summary: "/market/summary",
    signals: "/market/signals",
  },
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
}
