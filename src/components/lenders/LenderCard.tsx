import { Building2, TrendingUp, Star, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Lender } from "@/api/types"
import { formatDollars, labelLenderType, labelApprovalSpeed, cn } from "@/lib/utils"

interface LenderCardProps {
  lender: Lender
  onClick: () => void
  isWatched?: boolean
  onWatchToggle?: (e: React.MouseEvent) => void
}

function tierColor(tier: number) {
  if (tier === 1) return "bg-purple-100 text-purple-700"
  if (tier === 2) return "bg-blue-100 text-blue-700"
  if (tier === 3) return "bg-gray-100 text-gray-600"
  return "bg-gray-50 text-gray-500"
}

function appetiteColor(score: number) {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-500"
}

function speedDot(speed: string) {
  if (speed === "same_day" || speed === "2_3_days") return "bg-green-500"
  if (speed === "1_week") return "bg-yellow-500"
  return "bg-red-400"
}

export function LenderCard({ lender, onClick, isWatched, onWatchToggle }: LenderCardProps) {
  const latestSignal = lender.appetiteSignals
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0]

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", tierColor(lender.tier))}>
              T{lender.tier}
            </span>
            <h3 className="text-sm font-semibold text-foreground truncate">{lender.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{labelLenderType(lender.lenderType)}</p>
        </div>
        <button
          onClick={onWatchToggle}
          className={cn(
            "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
            isWatched ? "opacity-100 text-yellow-500" : "text-gray-300 hover:text-yellow-400"
          )}
          title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={cn("h-4 w-4", isWatched && "fill-yellow-500")} />
        </button>
      </div>

      {/* Deal range */}
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-foreground font-medium">
          {formatDollars(lender.minDealSize)} – {formatDollars(lender.maxDealSize)}
        </span>
        {lender.preferredDealMin && (
          <span className="text-[10px] text-muted-foreground">
            (sweet spot {formatDollars(lender.preferredDealMin)}–{formatDollars(lender.preferredDealMax!)})
          </span>
        )}
      </div>

      {/* Industries */}
      <div className="flex flex-wrap gap-1 mb-3">
        {lender.industriesFavored.slice(0, 3).map(ind => (
          <Badge key={ind} variant="secondary" className="text-[10px]">
            {ind.replace(/_/g, " ")}
          </Badge>
        ))}
        {lender.industriesFavored.length > 3 && (
          <Badge variant="outline" className="text-[10px]">+{lender.industriesFavored.length - 3}</Badge>
        )}
      </div>

      {/* Appetite signal */}
      {latestSignal && (
        <div className={cn(
          "text-[11px] px-2 py-1.5 rounded-md mb-3 leading-tight",
          latestSignal.type === "positive" ? "bg-green-50 text-green-700" :
          latestSignal.type === "caution" ? "bg-yellow-50 text-yellow-700" :
          "bg-red-50 text-red-700"
        )}>
          <TrendingUp className="h-3 w-3 inline mr-1" />
          {latestSignal.text.length > 90
            ? latestSignal.text.slice(0, 90) + "..."
            : latestSignal.text}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className={cn("h-2 w-2 rounded-full", speedDot(lender.approvalSpeed))} />
          <span className="text-[11px] text-muted-foreground">{labelApprovalSpeed(lender.approvalSpeed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-gray-400" />
            <span className="text-[11px] text-muted-foreground">{lender.confidenceScore}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">appetite</span>
            <span className={cn("text-[11px] font-semibold", appetiteColor(lender.appetiteScore))}>
              {lender.appetiteScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
