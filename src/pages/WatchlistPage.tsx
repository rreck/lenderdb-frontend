import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Star, Bell, BellOff, X, TrendingUp, Loader2, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/api"
import type { WatchlistEntry } from "@/api/types"
import { formatDollars, daysSince, labelApprovalSpeed, cn } from "@/lib/utils"

export function WatchlistPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getWatchlist().then(wl => {
      setEntries(wl)
      setLoading(false)
    })
  }, [])

  const handleRemove = async (entryId: string) => {
    await apiService.removeFromWatchlist(entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {entries.length} lenders watched · get alerts when their appetite changes
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/lenders")}>
          <Star className="h-4 w-4" />
          Browse Lenders
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto gap-6">
          <Star className="h-14 w-14 text-zinc-700" />
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-white">Your watchlist is empty</p>
            <p className="text-base text-zinc-400 leading-relaxed">
              Star any lender in the database to add them here. The watchlist tracks their latest appetite signals — things like new programs, tightening credit, or broker changes — so you always know who's active.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full text-left">
            <div className="flex gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Signal alerts</p>
                <p className="text-sm text-zinc-500 mt-0.5">Get notified when a watched lender posts new positive or negative signals from their news pages.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Appetite tracking</p>
                <p className="text-sm text-zinc-500 mt-0.5">See the latest extracted signal for each lender at a glance — who's expanding, who's pulling back.</p>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate("/lenders")} className="w-full py-3 text-base">Browse Lenders</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const { lender } = entry
            const latestSignal = lender.appetiteSignals
              .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0]
            const isRecent = latestSignal && daysSince(latestSignal.detectedAt) <= 7

            return (
              <div
                key={entry.id}
                className={cn(
                  "bg-zinc-900 border rounded-xl p-4 flex items-start gap-4 hover:border-primary/40 transition-colors",
                  isRecent ? "border-primary/30" : "border-zinc-800"
                )}
              >
                {/* Alert dot */}
                {isRecent && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                )}

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/lenders/${lender.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{lender.name}</h3>
                    {lender.status === "active" && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400"><BadgeCheck className="h-3 w-3" />Verified</span>}
                    {isRecent && <Badge variant="blue" className="text-[10px]">New signal</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-zinc-500">
                      {formatDollars(lender.minDealSize)}–{formatDollars(lender.maxDealSize)}
                    </span>
                    <span className="text-xs text-zinc-500">{labelApprovalSpeed(lender.approvalSpeed)}</span>
                    <span className="text-xs text-zinc-500">appetite {lender.appetiteScore}</span>
                  </div>

                  {latestSignal && (
                    <div className={cn(
                      "flex gap-2 text-[11px] px-2.5 py-1.5 rounded-md",
                      latestSignal.type === "positive" ? "bg-green-950/50 text-green-400" :
                      latestSignal.type === "negative" ? "bg-red-950/50 text-red-400" : "bg-yellow-950/50 text-yellow-300"
                    )}>
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{latestSignal.text.slice(0, 120)}{latestSignal.text.length > 120 ? "..." : ""}</span>
                      <span className="shrink-0 text-zinc-500 ml-auto">{daysSince(latestSignal.detectedAt)}d ago</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500"
                    title={entry.alertsEnabled ? "Disable alerts" : "Enable alerts"}
                  >
                    {entry.alertsEnabled
                      ? <Bell className="h-4 w-4 text-primary" />
                      : <BellOff className="h-4 w-4" />
                    }
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500"
                    onClick={() => handleRemove(entry.id)}
                    title="Remove from watchlist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
