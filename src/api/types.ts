// ============================================
// Core Enums / Literal Types
// ============================================
export type LenderType =
  | "bank"
  | "credit_union"
  | "leasing_company"
  | "specialty_finance"
  | "private_credit"
  | "captive"
  | "cdfi"

export type LenderTier = 1 | 2 | 3 | 4

export type RiskTolerance = "conservative" | "moderate" | "aggressive"

export type ApprovalSpeed =
  | "same_day"
  | "2_3_days"
  | "1_week"
  | "2_4_weeks"
  | "30_plus_days"

export type LendingProduct =
  | "finance_lease"
  | "operating_lease"
  | "equipment_loan"
  | "sale_leaseback"
  | "trac_lease"
  | "fmv_lease"
  | "line_of_credit"
  | "working_capital"

export type AppetiteSignalType = "positive" | "caution" | "negative"

export type LenderStatus = "active" | "paused" | "inactive"

// ============================================
// Appetite Signal (the dynamic intelligence)
// ============================================
export interface AppetiteSignal {
  id: string
  lenderId: string
  text: string
  type: AppetiteSignalType
  source: string
  detectedAt: string // ISO date
}

// ============================================
// Data Source / Provenance
// ============================================
export interface DataSource {
  id: string
  name: string
  url: string
  sourceType: "association" | "regulatory" | "marketplace" | "vendor" | "conference" | "direct"
  lastCrawledAt: string
}

// ============================================
// Lender (core record)
// ============================================
export interface Lender {
  id: string
  name: string
  shortName?: string
  lenderType: LenderType
  tier: LenderTier
  parentCompany?: string
  website?: string
  hqCountry: string
  hqState?: string
  hqCity?: string

  // Deal parameters
  minDealSize: number  // USD
  maxDealSize: number  // USD
  preferredDealMin?: number
  preferredDealMax?: number

  // Appetite
  industriesFavored: string[]
  industriesAvoided: string[]
  equipmentCategories: string[]
  countriesServed: string[]
  statesServed?: string[]   // for US-focused lenders

  // Underwriting posture
  riskTolerance: RiskTolerance
  minCreditFico?: number
  minTimeInBusinessMonths?: number
  maxLtv?: number  // loan-to-value %

  // Products & speed
  lendingProducts: LendingProduct[]
  approvalSpeed: ApprovalSpeed

  // Dynamic intelligence
  appetiteSignals: AppetiteSignal[]
  appetiteScore: number  // 0-100, how active/hungry this lender is right now

  // Originations contact
  originationsContact?: string
  originationsEmail?: string
  originationsPhone?: string
  brokerFriendly: boolean
  brokerRegistrationRequired: boolean

  // ELFA enrichment
  fundingPrograms?: string[]   // e.g. "Buy Paper from Brokers", "Discount-Nonrecourse"
  creditCriteria?: string[]    // e.g. "Investment Grade", "Middle Market"

  // Data quality
  lastVerifiedDate: string
  confidenceScore: number  // 0-100
  sources: DataSource[]

  status: LenderStatus
  createdAt: string
  updatedAt: string
}

// ============================================
// Deal Profile (for matching)
// ============================================
export type DealUrgency = "immediate" | "this_week" | "this_month" | "flexible"

export interface DealProfile {
  dealSize: number
  industryCategory: string
  equipmentType: string
  borrowerCountry: string
  borrowerState?: string
  creditScore?: number
  timeInBusinessMonths?: number
  lendingProductNeeded: LendingProduct
  urgency: DealUrgency
  additionalNotes?: string
}

// ============================================
// Deal Match Result
// ============================================
export interface LenderMatch {
  lender: Lender
  matchScore: number  // 0-100
  dealSizeFit: number  // 0-30
  industryFit: number  // 0-25
  geographyFit: number  // 0-20
  riskFit: number  // 0-15
  productFit: number  // 0-10
  matchReasons: string[]
  warnings: string[]
  disqualifiers: string[]
}

export interface DealMatchResult {
  dealProfile: DealProfile
  matches: LenderMatch[]
  totalLendersScored: number
  generatedAt: string
}

// ============================================
// Watchlist
// ============================================
export interface WatchlistEntry {
  id: string
  lenderId: string
  lender: Lender
  addedAt: string
  alertsEnabled: boolean
  notes?: string
}

// ============================================
// Market Intelligence
// ============================================
export interface IndustryHeatPoint {
  industry: string
  lenderCount: number
  avgAppetiteScore: number
  trendDirection: "up" | "flat" | "down"
}

export interface MarketSummary {
  totalActiveLenders: number
  avgApprovalDays: number
  hotIndustries: IndustryHeatPoint[]
  recentSignals: AppetiteSignal[]
  lastUpdated: string
}

// ============================================
// Filter / Search
// ============================================
export interface LenderFilters {
  search?: string
  lenderTypes?: LenderType[]
  tiers?: LenderTier[]
  minDealSize?: number
  maxDealSize?: number
  industries?: string[]
  countries?: string[]
  riskTolerances?: RiskTolerance[]
  approvalSpeeds?: ApprovalSpeed[]
  lendingProducts?: LendingProduct[]
  brokerFriendlyOnly?: boolean
  verifiedOnly?: boolean
  minConfidenceScore?: number
  limit?: number
  offset?: number
  updatedAfter?: string
}

export interface LenderPage {
  lenders: Lender[]
  total: number
  hasMore: boolean
  offset: number
}

export interface CrawlerStatus {
  status: "running" | "idle" | "unreachable"
  current_lender?: string
  last_run?: string
  batch_progress?: {
    done: number
    total: number
    errors: number
  }
  error?: string
}

// ============================================
// API Response
// ============================================
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
