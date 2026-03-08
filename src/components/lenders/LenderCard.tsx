import { Building2, TrendingUp, Star, Shield, ExternalLink, RefreshCw } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Lender } from "@/api/types"
import { formatDollars, labelLenderType, labelApprovalSpeed, cn } from "@/lib/utils"

interface LenderCardProps {
  lender: Lender
  onClick: () => void
  isWatched?: boolean
  onWatchToggle?: (e: React.MouseEvent) => void
  onCrawl?: (e: React.MouseEvent) => Promise<void>
}

function tierColor(tier: number) {
  if (tier === 1) return "bg-purple-950 text-purple-300"
  if (tier === 2) return "bg-blue-950 text-blue-300"
  if (tier === 3) return "bg-zinc-800 text-zinc-300"
  return "bg-zinc-900 text-zinc-500"
}

function appetiteColor(score: number) {
  if (score >= 80) return "text-green-400"
  if (score >= 60) return "text-yellow-400"
  return "text-red-400"
}

function speedDot(speed: string) {
  if (speed === "same_day" || speed === "2_3_days") return "bg-green-400"
  if (speed === "1_week") return "bg-yellow-400"
  return "bg-red-400"
}

function countryFlag(code: string): string {
  return code.toUpperCase().replace(/[A-Z]/g, c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

function clearbitUrl(website: string): string {
  const url = website.startsWith("http") ? website : `https://${website}`
  const domain = new URL(url).hostname
  return `https://logo.clearbit.com/${domain}`
}

function faviconUrl(website: string): string {
  const url = website.startsWith("http") ? website : `https://${website}`
  const domain = new URL(url).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

function logoUrl(website?: string): string | null {
  if (!website) return null
  try {
    return clearbitUrl(website)
  } catch {
    return null
  }
}

function updatedAtMeta(updatedAt: string): { dot: string; color: string; label: string } {
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000
  const d = Math.floor(days)
  const label = d === 0 ? "today" : d === 1 ? "1d ago" : `${d}d ago`
  if (days <= 7) return { dot: "bg-green-400", color: "text-green-400", label }
  if (days <= 30) return { dot: "bg-yellow-400", color: "text-yellow-400", label }
  return { dot: "bg-red-400", color: "text-red-400", label }
}

export function LenderCard({ lender, onClick, isWatched, onWatchToggle, onCrawl }: LenderCardProps) {
  const [crawling, setCrawling] = useState(false)
  const latestSignal = lender.appetiteSignals
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0]
  const favicon = logoUrl(lender.website)

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", tierColor(lender.tier))}>
              T{lender.tier}
            </span>
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="h-5 w-5 rounded-sm shrink-0 object-contain"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  if (lender.website && !el.src.includes("google.com")) {
                    try { el.src = faviconUrl(lender.website) } catch { el.style.display = "none" }
                  } else {
                    el.style.display = "none"
                  }
                }}
              />
            ) : null}
            {!favicon && <Building2 className="h-4 w-4 text-zinc-600 shrink-0" />}
            <h3 className="text-sm font-semibold text-white truncate">{lender.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-zinc-500">{labelLenderType(lender.lenderType)}</p>
            {lender.website && (
              <a
                href={lender.website.startsWith("http") ? lender.website : `https://${lender.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-zinc-600 hover:text-primary transition-colors"
                title={lender.website}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <button
          onClick={onWatchToggle}
          className={cn(
            "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
            isWatched ? "opacity-100 text-yellow-400" : "text-zinc-600 hover:text-yellow-400"
          )}
          title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={cn("h-4 w-4", isWatched && "fill-yellow-400")} />
        </button>
      </div>

      {/* Deal range */}
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <span className="text-xs text-white font-medium">
          {formatDollars(lender.minDealSize)} – {formatDollars(lender.maxDealSize)}
        </span>
        {lender.preferredDealMin && (
          <span className="text-[10px] text-zinc-500">
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

      {/* Countries served */}
      {lender.countriesServed?.length > 0 && (
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {lender.countriesServed.slice(0, 8).map(c => (
            <span key={c} title={c} className="text-base leading-none" style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, sans-serif" }}>
              {countryFlag(c)}
            </span>
          ))}
          {lender.countriesServed.length > 8 && (
            <span className="text-[10px] text-zinc-500">+{lender.countriesServed.length - 8}</span>
          )}
        </div>
      )}

      {/* Appetite signal */}
      {latestSignal && (
        <div className={cn(
          "text-[11px] px-2 py-1.5 rounded-md mb-3 leading-tight",
          latestSignal.type === "positive" ? "bg-green-950/60 text-green-400" :
          latestSignal.type === "caution" ? "bg-yellow-950/60 text-yellow-300" :
          "bg-red-950/60 text-red-400"
        )}>
          <TrendingUp className="h-3 w-3 inline mr-1" />
          {latestSignal.text.length > 90
            ? latestSignal.text.slice(0, 90) + "..."
            : latestSignal.text}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1">
          <div className={cn("h-2 w-2 rounded-full", speedDot(lender.approvalSpeed))} />
          <span className="text-[11px] text-zinc-500">{labelApprovalSpeed(lender.approvalSpeed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-zinc-600" />
            <span className="text-[11px] text-zinc-500">{lender.confidenceScore}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-500">appetite</span>
            <span className={cn("text-[11px] font-semibold", appetiteColor(lender.appetiteScore))}>
              {lender.appetiteScore}
            </span>
          </div>
        </div>
      </div>

      {/* Updated at + Enrich button */}
      {(() => {
        const meta = updatedAtMeta(lender.updatedAt)
        const dateStr = new Date(lender.updatedAt).toISOString().slice(0, 10)
        return (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
              <span className={cn("text-[11px]", meta.color)}>Updated {dateStr}</span>
            </div>
            {onCrawl && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  setCrawling(true)
                  await onCrawl(e).catch(() => {})
                  setCrawling(false)
                }}
                disabled={crawling}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-zinc-700 text-xs text-zinc-300 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", crawling && "animate-spin text-primary")} />
                {crawling ? "Queued for enrichment…" : "Enrich this record"}
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
