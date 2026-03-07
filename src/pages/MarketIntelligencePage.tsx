import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/api"
import type { MarketSummary, AppetiteSignal } from "@/api/types"
import { formatDate, cn } from "@/lib/utils"

function HeatBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 65 ? "bg-yellow-400" : "bg-orange-400"
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
    </div>
  )
}

function SignalFeed({ signals }: { signals: AppetiteSignal[] }) {
  return (
    <div className="space-y-3">
      {signals.map(sig => {
        const icon = sig.type === "positive"
          ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          : sig.type === "negative"
          ? <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
          : <Minus className="h-4 w-4 text-yellow-500 shrink-0" />

        return (
          <div key={sig.id} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{sig.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-muted-foreground">{sig.source}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(sig.detectedAt)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MarketIntelligencePage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getMarketSummary().then(s => {
      setSummary(s)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Market Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lender appetite trends across the equipment finance market · Updated {formatDate(summary.lastUpdated)}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Lenders Tracked</p>
          <p className="text-3xl font-bold text-foreground">{summary.totalActiveLenders}</p>
          <p className="text-xs text-muted-foreground mt-1">verified in last 30 days</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Approval Time</p>
          <p className="text-3xl font-bold text-foreground">{summary.avgApprovalDays}d</p>
          <p className="text-xs text-muted-foreground mt-1">across all active lenders</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Recent Appetite Signals</p>
          <p className="text-3xl font-bold text-foreground">{summary.recentSignals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.recentSignals.filter(s => s.type === "positive").length} positive ·{" "}
            {summary.recentSignals.filter(s => s.type === "negative").length} negative
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Industry heat map */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Industry Appetite Heat Map</h2>
          </div>
          <div className="space-y-3">
            {summary.hotIndustries.map(item => (
              <div key={item.industry}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground capitalize">{item.industry.replace(/_/g, " ")}</span>
                    {item.trendDirection === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                    {item.trendDirection === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.lenderCount} lenders</span>
                    <span className="text-xs font-semibold text-foreground">{item.avgAppetiteScore}</span>
                  </div>
                </div>
                <HeatBar score={item.avgAppetiteScore} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-green-500 rounded inline-block" /> Active ≥80</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-yellow-400 rounded inline-block" /> Moderate 65–79</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-orange-400 rounded inline-block" /> Cooling &lt;65</span>
          </div>
        </div>

        {/* Signal feed */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Latest Appetite Signals</h2>
            <div className="flex items-center gap-2">
              <Badge variant="success">{summary.recentSignals.filter(s => s.type === "positive").length} positive</Badge>
              <Badge variant="warning">{summary.recentSignals.filter(s => s.type === "caution").length} caution</Badge>
              <Badge variant="danger">{summary.recentSignals.filter(s => s.type === "negative").length} negative</Badge>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[480px] pr-1">
            <SignalFeed signals={summary.recentSignals} />
          </div>
        </div>
      </div>
    </div>
  )
}
