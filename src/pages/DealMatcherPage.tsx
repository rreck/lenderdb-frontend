import { useState } from "react"
import { Zap, AlertTriangle, CheckCircle2, Loader2, ArrowRight, BadgeCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/api"
import type { DealProfile, DealMatchResult, LenderMatch, LendingProduct, DealUrgency } from "@/api/types"
import { formatDollars, labelApprovalSpeed, labelProduct, labelIndustry, cn } from "@/lib/utils"
import { INDUSTRIES } from "@/data/mockLenders"

const INITIAL_DEAL: DealProfile = {
  dealSize: 75000,
  industryCategory: "healthcare",
  equipmentType: "medical imaging",
  borrowerCountry: "US",
  borrowerState: "",
  creditScore: 680,
  timeInBusinessMonths: 36,
  lendingProductNeeded: "finance_lease",
  urgency: "this_week",
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-zinc-600")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right text-white">{score}/{max}</span>
    </div>
  )
}

function MatchCard({ match, onClick }: { match: LenderMatch; onClick: () => void }) {
  const score = match.matchScore
  const scoreColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-orange-400"
  const scoreBg = score >= 80 ? "bg-green-950/40 border-green-900" : score >= 60 ? "bg-yellow-950/40 border-yellow-900" : "bg-orange-950/40 border-orange-900"

  return (
    <div className={cn("rounded-xl border p-4 hover:shadow-lg transition-all cursor-pointer", scoreBg)} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-semibold text-white">{match.lender.name}</h3>
            {match.lender.status === "active" && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-zinc-500">{match.lender.lenderType.replace(/_/g, " ")}</p>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-bold", scoreColor)}>{score}</div>
          <div className="text-[10px] text-zinc-500">match score</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1.5 mb-3">
        <ScoreBar label="Deal size" score={match.dealSizeFit} max={30} />
        <ScoreBar label="Industry" score={match.industryFit} max={25} />
        <ScoreBar label="Geography" score={match.geographyFit} max={20} />
        <ScoreBar label="Credit/risk" score={match.riskFit} max={15} />
        <ScoreBar label="Product" score={match.productFit} max={10} />
      </div>

      {/* Match reasons */}
      {match.matchReasons.slice(0, 2).map((r, i) => (
        <div key={i} className="flex items-start gap-1.5 mb-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-white">{r}</span>
        </div>
      ))}

      {/* Warnings */}
      {match.warnings.slice(0, 2).map((w, i) => (
        <div key={i} className="flex items-start gap-1.5 mb-1">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-zinc-400">{w}</span>
        </div>
      ))}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500">
            {formatDollars(match.lender.minDealSize)} – {formatDollars(match.lender.maxDealSize)}
          </span>
          <span className="text-[11px] text-zinc-500">{labelApprovalSpeed(match.lender.approvalSpeed)}</span>
        </div>
        <button className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
          View <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function DealMatcherPage() {
  const navigate = useNavigate()
  const [deal, setDeal] = useState<DealProfile>(INITIAL_DEAL)
  const [result, setResult] = useState<DealMatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const handleMatch = async () => {
    setLoading(true)
    const res = await apiService.matchDeal(deal)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      {/* Header */}
      <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Deal Matcher</h1>
            <p className="text-sm text-zinc-500">Input your deal — get ranked lender matches with appetite scores</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex gap-6">
        {/* Left: Deal input */}
        <div className="w-80 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-semibold text-white">Deal Parameters</h2>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Deal Size</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <Input
                  type="number"
                  className="pl-6 bg-zinc-800 border-zinc-700 text-white"
                  value={deal.dealSize}
                  onChange={e => setDeal(p => ({ ...p, dealSize: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Industry</Label>
              <Select value={deal.industryCategory} onValueChange={v => setDeal(p => ({ ...p, industryCategory: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {INDUSTRIES.map(i => (
                    <SelectItem key={i} value={i} className="text-white hover:bg-zinc-800">{labelIndustry(i)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Equipment Type</Label>
              <Input
                placeholder="e.g. medical imaging, forklift..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                value={deal.equipmentType}
                onChange={e => setDeal(p => ({ ...p, equipmentType: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Country</Label>
                <Select value={deal.borrowerCountry} onValueChange={v => setDeal(p => ({ ...p, borrowerCountry: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["US", "CA", "GB", "AU", "DE", "FR", "NL"].map(c => (
                      <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">State</Label>
                <Input
                  placeholder="e.g. TX"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  value={deal.borrowerState ?? ""}
                  onChange={e => setDeal(p => ({ ...p, borrowerState: e.target.value }))}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Credit Score (FICO)</Label>
              <Input
                type="number"
                placeholder="e.g. 680"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                value={deal.creditScore ?? ""}
                onChange={e => setDeal(p => ({ ...p, creditScore: Number(e.target.value) || undefined }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Time in Business (months)</Label>
              <Input
                type="number"
                className="bg-zinc-800 border-zinc-700 text-white"
                value={deal.timeInBusinessMonths ?? ""}
                onChange={e => setDeal(p => ({ ...p, timeInBusinessMonths: Number(e.target.value) || undefined }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Product Needed</Label>
              <Select value={deal.lendingProductNeeded} onValueChange={v => setDeal(p => ({ ...p, lendingProductNeeded: v as LendingProduct }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {(["finance_lease", "operating_lease", "equipment_loan", "sale_leaseback", "trac_lease", "fmv_lease", "line_of_credit"] as LendingProduct[]).map(p => (
                    <SelectItem key={p} value={p} className="text-white">{labelProduct(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Urgency</Label>
              <Select value={deal.urgency} onValueChange={v => setDeal(p => ({ ...p, urgency: v as DealUrgency }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="immediate" className="text-white">Immediate (today)</SelectItem>
                  <SelectItem value="this_week" className="text-white">This Week</SelectItem>
                  <SelectItem value="this_month" className="text-white">This Month</SelectItem>
                  <SelectItem value="flexible" className="text-white">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full gap-2" onClick={handleMatch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Matching..." : "Find Lenders"}
            </Button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-zinc-800 rounded-xl text-center px-8">
              <Zap className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-lg font-medium text-white mb-1">Enter your deal details</p>
              <p className="text-sm text-zinc-500">
                The matcher scores every active lender against your deal parameters and ranks them by fit.
                Deal size, industry, geography, credit profile, and product type all factor into the score.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-zinc-500">Scoring lenders...</p>
            </div>
          )}

          {result && !loading && (
            <div>
              {/* Summary bar */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white">
                    {verifiedOnly ? result.matches.filter(m => m.lender.status === "active").length : result.matches.length} matches found
                  </span>
                  <span className="text-sm text-zinc-500 ml-2">
                    from {result.totalLendersScored} lenders scored · {formatDollars(deal.dealSize)} {labelIndustry(deal.industryCategory)} deal
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVerifiedOnly(v => !v)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
                      verifiedOnly
                        ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified Only
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{result.matches.filter(m => m.matchScore >= 80).length} strong</Badge>
                    <Badge variant="warning">{result.matches.filter(m => m.matchScore >= 60 && m.matchScore < 80).length} good</Badge>
                    <Badge variant="secondary">{result.matches.filter(m => m.matchScore < 60).length} weak</Badge>
                  </div>
                </div>
              </div>

              {/* Match cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.matches
                  .filter(m => !verifiedOnly || m.lender.status === "active")
                  .map(match => (
                  <MatchCard
                    key={match.lender.id}
                    match={match}
                    onClick={() => navigate(`/lenders/${match.lender.id}`)}
                  />
                ))}
              </div>

              {result.matches.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 border border-zinc-800 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-yellow-400 mb-2" />
                  <p className="text-sm font-medium text-white">No lenders matched this deal</p>
                  <p className="text-xs text-zinc-500 mt-1">Try adjusting deal size, industry, or geography</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
