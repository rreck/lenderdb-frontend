import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Filter, SlidersHorizontal, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LenderCard } from "@/components/lenders"
import { apiService } from "@/api"
import type { Lender, LenderFilters, RiskTolerance, ApprovalSpeed } from "@/api/types"

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

export function LendersPage() {
  const navigate = useNavigate()
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<LenderFilters>({})

  const fetchLenders = useCallback(async () => {
    setLoading(true)
    const result = await apiService.getLenders(filters)
    setLenders(result)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchLenders()
  }, [fetchLenders])

  useEffect(() => {
    apiService.getWatchlist().then(wl => {
      setWatchedIds(new Set(wl.map(e => e.lenderId)))
    })
  }, [])

  const handleWatchToggle = async (e: React.MouseEvent, lenderId: string) => {
    e.stopPropagation()
    if (watchedIds.has(lenderId)) {
      const wl = await apiService.getWatchlist()
      const entry = wl.find(e => e.lenderId === lenderId)
      if (entry) await apiService.removeFromWatchlist(entry.id)
      setWatchedIds(prev => { const s = new Set(prev); s.delete(lenderId); return s })
    } else {
      await apiService.addToWatchlist(lenderId)
      setWatchedIds(prev => new Set([...prev, lenderId]))
    }
  }

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

  const activeFilterCount = [
    filters.minDealSize,
    filters.riskTolerances?.length,
    filters.approvalSpeeds?.length,
    filters.brokerFriendlyOnly,
  ].filter(Boolean).length

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lender Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lenders.length} active lenders · appetite intelligence updated daily
          </p>
        </div>
        <Button onClick={() => navigate("/match")} className="gap-2">
          <Search className="h-4 w-4" />
          Match a Deal
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lenders, industries, equipment..."
            className="pl-9"
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
          variant="outline"
          className="gap-2"
          onClick={() => setFilters(prev => ({ ...prev, brokerFriendlyOnly: !prev.brokerFriendlyOnly }))}
        >
          <Filter className={`h-4 w-4 ${filters.brokerFriendlyOnly ? "text-primary" : ""}`} />
          Broker Friendly
        </Button>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-3 gap-6">
          {/* Deal size */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">DEAL SIZE</p>
            <div className="flex flex-wrap gap-1.5">
              {DEAL_SIZE_PRESETS.map(p => {
                const active = filters.minDealSize === p.min && filters.maxDealSize === p.max
                return (
                  <button
                    key={p.label}
                    onClick={() => toggleDealSize(p)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-gray-200 hover:border-primary/40"
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
            <p className="text-xs font-semibold text-muted-foreground mb-2">RISK TOLERANCE</p>
            <div className="flex flex-wrap gap-1.5">
              {RISK_OPTIONS.map(r => {
                const active = filters.riskTolerances?.includes(r.value)
                return (
                  <button
                    key={r.value}
                    onClick={() => toggleRisk(r.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Approval speed */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">APPROVAL SPEED</p>
            <div className="flex flex-wrap gap-1.5">
              {SPEED_OPTIONS.map(s => {
                const active = filters.approvalSpeeds?.includes(s.value)
                return (
                  <button
                    key={s.value}
                    onClick={() => toggleSpeed(s.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active ? "bg-primary text-white border-primary" : "border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    {s.label}
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
          <span className="text-xs text-muted-foreground">Active filters:</span>
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
          <button onClick={() => setFilters({})} className="text-xs text-primary hover:underline ml-1">Clear all</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : lenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-muted-foreground">No lenders match your filters</p>
          <button onClick={() => setFilters({})} className="text-sm text-primary hover:underline mt-2">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lenders.map(lender => (
            <LenderCard
              key={lender.id}
              lender={lender}
              isWatched={watchedIds.has(lender.id)}
              onClick={() => navigate(`/lenders/${lender.id}`)}
              onWatchToggle={(e) => handleWatchToggle(e, lender.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
