import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Filter, SlidersHorizontal, Loader2, X, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Clock, BadgeCheck, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { canFastTrack } from "@/components/lenders/LenderCard"
import { LenderCard } from "@/components/lenders"
import { apiService } from "@/api"
import type { Lender, LenderFilters, CrawlerStatus, RiskTolerance, ApprovalSpeed } from "@/api/types"

const DEAL_SIZE_PRESETS = [
  { label: "Under $25k", max: 25000 },
  { label: "$25k–$100k", min: 25000, max: 100000 },
  { label: "$100k–$500k", min: 100000, max: 500000 },
  { label: "$500k–$2M", min: 500000, max: 2000000 },
  { label: "$2M+", min: 2000000 },
]

const RISK_OPTIONS: { label: string; value: RiskTolerance }[] = [
  { label: "Conservative", value: "conservative" },
  { label: "Moderate", value: "moderate" },
  { label: "Aggressive", value: "aggressive" },
]

const SPEED_OPTIONS: { label: string; value: ApprovalSpeed }[] = [
  { label: "Same Day", value: "same_day" },
  { label: "2–3 Days", value: "2_3_days" },
  { label: "1 Week", value: "1_week" },
  { label: "2–4 Weeks", value: "2_4_weeks" },
]

const COUNTRY_LABELS: Record<string, string> = {
  US: "US",
  CA: "Canada",
  GB: "UK",
  PR: "Puerto Rico",
}

type SortField = "name" | "appetiteScore" | "confidenceScore" | "minDealSize" | "maxDealSize" | "updatedAt" | "tier"
type SortDir = "asc" | "desc"

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Name", value: "name" },
  { label: "Appetite", value: "appetiteScore" },
  { label: "Confidence", value: "confidenceScore" },
  { label: "Min Deal", value: "minDealSize" },
  { label: "Max Deal", value: "maxDealSize" },
  { label: "Updated", value: "updatedAt" },
  { label: "Tier", value: "tier" },
]

const PAGE_SIZE = 100
const POLL_MS = 30000

function freshAgo(iso: string | null) {
  if (!iso) return "a while ago"
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 2) return "a minute ago"
  if (mins < 60) return mins + " minutes ago"
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return hrs + (hrs === 1 ? " hour ago" : " hours ago")
  return Math.round(hrs / 24) + " days ago"
}

export function LendersPage() {
  const navigate = useNavigate()
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [dbTotal, setDbTotal] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<LenderFilters>({})
  const [fresh, setFresh] = useState<{
    lenders_with_signals: number
    changed_24h: number
    changed_7d: number
    newest_check: string | null
  } | null>(null)
  const [fastOnly, setFastOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const lastPollTime = useRef<string>(new Date().toISOString())
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null)

  const fetchLenders = useCallback(async () => {
    setLoading(true)
    setOffset(0)
    try {
      const result = await apiService.getLenders({ ...filters, limit: PAGE_SIZE, offset: 0 })
      setLenders(result.lenders)
      setDbTotal(result.total)
      setHasMore(result.lenders.length < result.total)
      setOffset(result.lenders.length)
      lastPollTime.current = new Date().toISOString()
    } catch (e) {
      console.error("fetchLenders failed", e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const result = await apiService.getLenders({ ...filters, limit: PAGE_SIZE, offset })
      setLenders(prev => {
        const ids = new Set(prev.map(l => l.id))
        return [...prev, ...result.lenders.filter(l => !ids.has(l.id))]
      })
      setHasMore(result.lenders.length < result.total)
      setOffset(prev => prev + result.lenders.length)
    } catch (e) {
      console.error("loadMore failed", e)
    } finally {
      setLoadingMore(false)
    }
  }, [filters, hasMore, loadingMore, offset])

  // Poll for newly enriched lenders — also callable on demand
  const pollUpdates = useCallback(async () => {
    const since = lastPollTime.current
    lastPollTime.current = new Date().toISOString()
    const result = await apiService.getLenders({ ...filters, updatedAfter: since })
    if (result.lenders.length === 0) return
    setLenders(prev => {
      const byId = new Map(prev.map(l => [l.id, l]))
      for (const l of result.lenders) byId.set(l.id, l)
      return [...byId.values()]
    })
  }, [filters])

  useEffect(() => {
    const id = setInterval(pollUpdates, POLL_MS)
    return () => clearInterval(id)
  }, [pollUpdates])

  // Poll crawler status every 5s
  useEffect(() => {
    const poll = () => apiService.getCrawlerStatus().then(setCrawlerStatus).catch(() => {})
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchLenders()
  }, [fetchLenders])

  useEffect(() => {
    fetch("/api/freshness").then(r => r.json())
      .then(b => { if (b.success) setFresh(b.data) })
      .catch(() => { /* the line simply says less */ })
  }, [])

  const toggleDealSize = (preset: typeof DEAL_SIZE_PRESETS[0]) => {
    setFilters(prev => ({
      ...prev,
      minDealSize: prev.minDealSize === preset.min ? undefined : preset.min,
      maxDealSize: prev.maxDealSize === preset.max ? undefined : preset.max,
    }))
  }

  const toggleRisk = (val: RiskTolerance) => {
    setFilters(prev => {
      const current = prev.riskTolerances ?? []
      const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, riskTolerances: updated.length ? updated : undefined }
    })
  }

  const toggleSpeed = (val: ApprovalSpeed) => {
    setFilters(prev => {
      const current = prev.approvalSpeeds ?? []
      const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, approvalSpeeds: updated.length ? updated : undefined }
    })
  }

  const toggleCountry = (val: string) => {
    setFilters(prev => {
      const current = prev.countries ?? []
      const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      return { ...prev, countries: updated.length ? updated : undefined }
    })
  }

  const availableCountries = useMemo(() => {
    const seen = new Set<string>()
    for (const l of lenders) {
      for (const c of l.countriesServed ?? []) seen.add(c)
    }
    return [...seen].sort()
  }, [lenders])

  const sortedLenders = useMemo(() => {
    let filtered = lenders
    if (fastOnly) filtered = filtered.filter(canFastTrack)
    if (filters.countries?.length) {
      filtered = filtered.filter(l =>
        filters.countries!.some(c => (l.countriesServed ?? []).includes(c))
      )
    }
    return [...filtered].sort((a, b) => {
      let av: string | number = a[sortField] as string | number
      let bv: string | number = b[sortField] as string | number
      if (sortField === "updatedAt") {
        av = new Date(av as string).getTime()
        bv = new Date(bv as string).getTime()
      }
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [lenders, sortField, sortDir, fastOnly])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
  }

  const activeFilterCount = [
    filters.minDealSize,
    filters.riskTolerances?.length,
    filters.approvalSpeeds?.length,
    filters.brokerFriendlyOnly,
    filters.verifiedOnly,
    filters.rcrOnly,
    filters.minConfidenceScore,
    filters.countries?.length,
  ].filter(Boolean).length

  return (
    <div className="p-6">
      {/* Nothing stands between the masthead and the first lender. The counts
          and the enrich control live in the bar that stays put. */}
      {/* Sort and filter bars stay under the masthead while the tiles scroll */}
      <div className="sticky top-14 z-40 -mx-6 px-6 pt-3 bg-black border-b border-zinc-800">

      {/* Sort bar */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[11px] text-zinc-500 mr-1">Sort:</span>
        {SORT_OPTIONS.map(opt => {
          const active = sortField === opt.value
          const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
          return (
            <button
              key={opt.value}
              onClick={() => toggleSort(opt.value)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
              }`}
            >
              {opt.label}
              <Icon className="h-3 w-3" />
            </button>
          )
        })}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search lenders, industries, equipment..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            value={filters.search ?? ""}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button
          variant={filters.verifiedOnly ? "default" : "outline"}
          className="gap-2"
          onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
        >
          <BadgeCheck className="h-4 w-4" />
          Verified Only
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setFilters(prev => ({ ...prev, brokerFriendlyOnly: !prev.brokerFriendlyOnly }))}
        >
          <Filter className={`h-4 w-4 ${filters.brokerFriendlyOnly ? "text-primary" : ""}`} />
          Broker Friendly
        </Button>
        <Button
          variant={filters.rcrOnly ? "default" : "outline"}
          className="gap-2"
          onClick={() => setFilters(prev => ({ ...prev, rcrOnly: !prev.rcrOnly }))}
        >
          RCR Lender
        </Button>
        <Button
          variant={fastOnly ? "default" : "outline"}
          className="gap-2"
          onClick={() => setFastOnly(f => !f)}
          title="Only lenders a packet can go straight out to"
        >
          <Zap className="h-4 w-4" />
          Fast Track
        </Button>

      </div>

      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 grid grid-cols-5 gap-6">
          {/* Deal size */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">DEAL SIZE</p>
            <div className="flex flex-wrap gap-1.5">
              {DEAL_SIZE_PRESETS.map(p => {
                const active = filters.minDealSize === p.min && filters.maxDealSize === p.max
                return (
                  <button
                    key={p.label}
                    onClick={() => toggleDealSize(p)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Risk tolerance */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">RISK TOLERANCE</p>
            <div className="flex flex-wrap gap-1.5">
              {RISK_OPTIONS.map(r => {
                const active = filters.riskTolerances?.includes(r.value)
                return (
                  <button
                    key={r.value}
                    onClick={() => toggleRisk(r.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Confidence score */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">MIN CONFIDENCE</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { label: "Any", value: undefined },
                { label: "50+", value: 50 },
                { label: "75+", value: 75 },
                { label: "90+", value: 90 },
              ] as { label: string; value: number | undefined }[]).map(c => {
                const active = filters.minConfidenceScore === c.value
                return (
                  <button
                    key={c.label}
                    onClick={() => setFilters(prev => ({ ...prev, minConfidenceScore: c.value }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Approval speed */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">APPROVAL SPEED</p>
            <div className="flex flex-wrap gap-1.5">
              {SPEED_OPTIONS.map(s => {
                const active = filters.approvalSpeeds?.includes(s.value)
                return (
                  <button
                    key={s.value}
                    onClick={() => toggleSpeed(s.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Country */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">COUNTRY</p>
            <div className="flex flex-wrap gap-1.5">
              {availableCountries.map(c => {
                const active = filters.countries?.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() => toggleCountry(c)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-zinc-700 text-zinc-400 hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {COUNTRY_LABELS[c] ?? c}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-zinc-500">Active filters:</span>
          {filters.minDealSize && (
            <Badge variant="blue" className="gap-1">
              Deal size filtered
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(p => ({ ...p, minDealSize: undefined, maxDealSize: undefined }))} />
            </Badge>
          )}
          {filters.riskTolerances?.map(r => (
            <Badge key={r} variant="blue" className="gap-1">
              {r}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleRisk(r)} />
            </Badge>
          ))}
          {filters.approvalSpeeds?.map(s => (
            <Badge key={s} variant="blue" className="gap-1">
              {s.replace(/_/g, " ")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSpeed(s)} />
            </Badge>
          ))}
          {filters.countries?.map(c => (
            <Badge key={c} variant="blue" className="gap-1">
              {COUNTRY_LABELS[c] ?? c}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCountry(c)} />
            </Badge>
          ))}
          <button onClick={() => setFilters({})} className="text-xs text-primary hover:underline ml-1">Clear all</button>
        </div>
      )}

      {/* Last-checked banner + top pagination */}
      <div className="flex items-center justify-between mb-3 min-h-[28px]">
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span className="text-zinc-300">{lenders.length.toLocaleString()}</span>
            {dbTotal !== null && <>of <span className="text-zinc-300">{dbTotal.toLocaleString()}</span></>}
            shown
          </span>
          {fresh && (
            <span>
              <span className="text-zinc-300">{fresh.changed_24h.toLocaleString()}</span>
              {" changed today, newest "}{freshAgo(fresh.newest_check)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-6 text-[11px] px-2"
            disabled={crawlerStatus?.status === "running"}
            onClick={async () => {
              try {
                await apiService.triggerEnrichment()
                const st = await apiService.getCrawlerStatus()
                setCrawlerStatus(st)
              } catch (e) {
                console.error("Enrich failed", e)
              }
            }}
          >
            <RefreshCw className={`h-3 w-3 ${crawlerStatus?.status === "running" ? "animate-spin" : ""}`} />
            {crawlerStatus?.status === "running" ? "Enriching" : "Enrich"}
          </Button>
          {crawlerStatus?.status === "running" && crawlerStatus.batch_progress && (
            <span className="flex items-center gap-2">
              <span className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <span
                  className="block h-full bg-primary rounded-full"
                  style={{ width: `${Math.round((crawlerStatus.batch_progress.done / Math.max(1, crawlerStatus.batch_progress.total)) * 100)}%` }}
                />
              </span>
              {crawlerStatus.batch_progress.done.toLocaleString()} of {crawlerStatus.batch_progress.total.toLocaleString()}
            </span>
          )}
        </div>
        {hasMore && (
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} className="gap-1.5 text-xs h-7">
            {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Load more
            {dbTotal !== null && <span className="text-zinc-500">({dbTotal - lenders.length} remaining)</span>}
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : lenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500">No lenders match your filters</p>
          <button onClick={() => setFilters({})} className="text-sm text-primary hover:underline mt-2">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedLenders.map(lender => (
              <LenderCard
                key={lender.id}
                lender={lender}
                onClick={() => navigate(`/lenders/${lender.id}`)}
                onCrawl={async (e) => {
                  e.stopPropagation()
                  await apiService.crawlLender(lender.id)
                  // Poll at 20s, 40s, 70s after sending — crawler takes 15-40s
                  setTimeout(() => pollUpdates(), 20000)
                  setTimeout(() => pollUpdates(), 40000)
                  setTimeout(() => pollUpdates(), 70000)
                }}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-2">
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Load more
                {dbTotal !== null && (
                  <span className="text-zinc-500 text-xs">({dbTotal - lenders.length} remaining)</span>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
