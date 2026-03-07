import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Star, Bell, BellOff, X, TrendingUp, Loader2 } from "lucide-react"
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
          <h1 className="text-xl font-semibold">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entries.length} lenders watched · get alerts when their appetite changes
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/lenders")}>
          <Star className="h-4 w-4" />
          Browse Lenders
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <Star className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">No lenders watched yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Star lenders in the database to track their appetite and get notified when they change.
          </p>
          <Button onClick={() => navigate("/lenders")}>Browse Lenders</Button>
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
                  "bg-white border rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors",
                  isRecent ? "border-primary/20" : "border-gray-200"
                )}
              >
                {/* Alert dot */}
                {isRecent && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                )}

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/lenders/${lender.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{lender.name}</h3>
                    {isRecent && <Badge variant="blue" className="text-[10px]">New signal</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDollars(lender.minDealSize)}–{formatDollars(lender.maxDealSize)}
                    </span>
                    <span className="text-xs text-muted-foreground">{labelApprovalSpeed(lender.approvalSpeed)}</span>
                    <span className="text-xs text-muted-foreground">appetite {lender.appetiteScore}</span>
                  </div>

                  {latestSignal && (
                    <div className={cn(
                      "flex gap-2 text-[11px] px-2.5 py-1.5 rounded-md",
                      latestSignal.type === "positive" ? "bg-green-50 text-green-700" :
                      latestSignal.type === "negative" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                    )}>
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{latestSignal.text.slice(0, 120)}{latestSignal.text.length > 120 ? "..." : ""}</span>
                      <span className="shrink-0 text-muted-foreground ml-auto">{daysSince(latestSignal.detectedAt)}d ago</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-muted-foreground"
                    title={entry.alertsEnabled ? "Disable alerts" : "Enable alerts"}
                  >
                    {entry.alertsEnabled
                      ? <Bell className="h-4 w-4 text-primary" />
                      : <BellOff className="h-4 w-4" />
                    }
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-muted-foreground"
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
