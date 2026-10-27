import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2, Clock, RefreshCw, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiService } from "@/api"
import type { MarketSummary, AppetiteSignal } from "@/api/types"
import { formatDate, cn } from "@/lib/utils"

function HeatBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-400" : score >= 65 ? "bg-yellow-400" : "bg-orange-400"
  return (
    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
    </div>
  )
}

function SignalFeed({ signals }: { signals: AppetiteSignal[] }) {
  return (
    <div className="space-y-3">
      {signals.map(sig => {
        const icon = sig.type === "positive"
          ? <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
          : sig.type === "negative"
          ? <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />
          : <Minus className="h-4 w-4 text-yellow-400 shrink-0" />

        return (
          <div key={sig.id} className="flex gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-snug">{sig.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-zinc-500">{sig.source}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
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

interface AppetiteMover {
  name: string
  type: string | null
  appetite: number | null
  positive?: number
  negative?: number
  caution?: number
  newest: string | null
}

interface AppetiteRead {
  bands: Record<string, number>
  evidenced_lenders: number
  signals: Record<string, number>
  expanding: AppetiteMover[]
  cooling: AppetiteMover[]
  recent: { name: string; type: string; text: string; source: string; at: string }[]
  by_institution_type: { type: string | null; lenders: number; avg_appetite: number | null; evidenced: number }[]
  as_of: string
}

const BAND_ORDER = ["expanding", "open", "selective", "pulling back", "no reading"]
const BAND_STYLE: Record<string, string> = {
  "expanding": "bg-green-500",
  "open": "bg-emerald-600",
  "selective": "bg-yellow-500",
  "pulling back": "bg-red-500",
  "no reading": "bg-zinc-700",
}

function AppetiteSection() {
  const [a, setA] = useState<AppetiteRead | null>(null)

  useEffect(() => {
    fetch("/api/market/appetite").then(r => r.json())
      .then(b => { if (b.success) setA(b.data) })
      .catch(() => { /* the section simply does not appear */ })
  }, [])

  if (!a) return null

  const total = BAND_ORDER.reduce((s, k) => s + (a.bands[k] || 0), 0) || 1
  const read = total - (a.bands["no reading"] || 0)

  return (
    <div className="mb-6 space-y-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-white">Where appetite sits right now</h2>
          <span className="text-xs text-zinc-500">
            {read.toLocaleString()} of {total.toLocaleString()} active lenders carry a reading ·
            {" "}{a.evidenced_lenders.toLocaleString()} have live evidence
          </span>
        </div>

        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-800">
          {BAND_ORDER.map(k => (
            <div key={k} className={BAND_STYLE[k]} style={{ width: `${((a.bands[k] || 0) / total) * 100}%` }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
          {BAND_ORDER.map(k => (
            <div key={k}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${BAND_STYLE[k]}`} />
                <span className="text-lg font-semibold text-white">{(a.bands[k] || 0).toLocaleString()}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 capitalize">{k}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          A reading comes from dated signals found on the lender's own publications.
          No reading means the score is a placeholder and should not be relied on.
          Positive {a.signals.positive || 0} · caution {a.signals.caution || 0} · negative {a.signals.negative || 0}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-white">Expanding</h2>
          <div className="mt-3 divide-y divide-zinc-800">
            {a.expanding.map(m => (
              <div key={m.name} className="flex items-center gap-3 py-2">
                <span className="text-sm text-white flex-1 truncate">{m.name}</span>
                <span className="text-xs text-zinc-500">{m.type}</span>
                <span className="text-xs text-green-400">+{m.positive}</span>
                <span className="text-sm font-semibold text-white w-8 text-right">{m.appetite}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-white">Pulling back</h2>
          <div className="mt-3 divide-y divide-zinc-800">
            {a.cooling.map(m => (
              <div key={m.name} className="flex items-center gap-3 py-2">
                <span className="text-sm text-white flex-1 truncate">{m.name}</span>
                <span className="text-xs text-zinc-500">{m.type}</span>
                <span className="text-xs text-red-400">-{m.negative}</span>
                <span className="text-sm font-semibold text-white w-8 text-right">{m.appetite}</span>
              </div>
            ))}
            {a.cooling.length === 0 && <p className="py-2 text-sm text-zinc-500">Nothing is pulling back</p>}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-white">Appetite by lender type</h2>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium text-right">Lenders</th>
              <th className="py-2 font-medium text-right">Average</th>
              <th className="py-2 font-medium text-right">With a reading</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {a.by_institution_type.map(r => (
              <tr key={String(r.type)} className="text-zinc-300">
                <td className="py-2">{r.type}</td>
                <td className="py-2 text-right">{r.lenders.toLocaleString()}</td>
                <td className="py-2 text-right text-white font-medium">{r.avg_appetite ?? "none"}</td>
                <td className="py-2 text-right">{r.evidenced.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-white">Newest signals</h2>
        <div className="mt-3 divide-y divide-zinc-800">
          {a.recent.map((s, i) => (
            <div key={i} className="py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.type === "positive" ? "bg-green-500" : s.type === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
                <span className="text-sm text-white">{s.name}</span>
                <span className="text-xs text-zinc-500 ml-auto">{new Date(s.at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── public reporting on this kind of lending ─────────────────────────────── */

interface NewsItem {
  topic: string
  title: string
  source: string
  url: string
  published: string
}

function timeAgo(published: string) {
  const t = new Date(published).getTime()
  if (!t) return ""
  const hrs = Math.round((Date.now() - t) / 3600000)
  if (hrs < 1) return "just now"
  if (hrs < 48) return hrs + (hrs === 1 ? " hour ago" : " hours ago")
  return Math.round(hrs / 24) + " days ago"
}

function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(true)
  const [when, setWhen] = useState("")

  const load = (refresh = false) => {
    setLoading(true)
    fetch("/api/market/news" + (refresh ? "?refresh=true" : ""))
      .then(r => r.json())
      .then(b => {
        if (b.success) {
          setItems(b.data.items)
          setTopics(b.data.topics)
          setWhen(b.data.fetched_at)
        }
      })
      .catch(() => { /* the panel stays empty */ })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const shown = topic ? items.filter(i => i.topic === topic) : items

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">What is being reported</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Public reporting on equipment finance, leasing, factoring and trade, from news
            search. Headlines link to the outlet. Nothing here is our own writing.
            {when && <> Read {timeAgo(when)}.</>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setTopic("")}
          className={cn("text-[11px] px-2.5 py-1 rounded-full border transition-colors",
            topic === "" ? "bg-primary text-white border-primary"
                         : "border-zinc-700 text-zinc-400 hover:text-white")}
        >
          Everything ({items.length})
        </button>
        {topics.map(t => {
          const n = items.filter(i => i.topic === t).length
          if (!n) return null
          return (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={cn("text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                topic === t ? "bg-primary text-white border-primary"
                            : "border-zinc-700 text-zinc-400 hover:text-white")}
            >
              {t} ({n})
            </button>
          )
        })}
      </div>

      <div className="mt-4 max-h-[26rem] overflow-y-auto divide-y divide-zinc-800">
        {shown.map((i, k) => (
          <a
            key={k}
            href={i.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2.5 group"
          >
            <div className="flex items-start gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5 group-hover:text-primary" />
              <div className="min-w-0">
                <p className="text-sm text-zinc-200 group-hover:text-white">{i.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {i.source}
                  {i.published && <> · {timeAgo(i.published)}</>}
                  <span className="text-zinc-600"> · {i.topic}</span>
                </p>
              </div>
            </div>
          </a>
        ))}
        {shown.length === 0 && !loading && (
          <p className="py-6 text-sm text-zinc-500">Nothing came back</p>
        )}
      </div>
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
        <h1 className="text-xl font-semibold text-white">Market Intelligence</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Lender appetite trends across the equipment finance market · <span className="text-white">appetite intelligence updated daily</span>
        </p>
      </div>

      <NewsFeed />

      <AppetiteSection />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Active Lenders Tracked</p>
          <p className="text-3xl font-bold text-white">{summary.totalActiveLenders}</p>
          <p className="text-xs text-zinc-500 mt-1">verified in last 30 days</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Avg Approval Time</p>
          <p className="text-3xl font-bold text-white">{summary.avgApprovalDays}d</p>
          <p className="text-xs text-zinc-500 mt-1">across all active lenders</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Recent Appetite Signals</p>
          <p className="text-3xl font-bold text-white">{summary.recentSignals.length}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {summary.recentSignals.filter(s => s.type === "positive").length} positive ·{" "}
            {summary.recentSignals.filter(s => s.type === "negative").length} negative
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Industry heat map */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">Product Appetite Heat Map</h2>
          </div>
          <div className="space-y-3">
            {summary.hotIndustries.map(item => (
              <div key={item.industry}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white capitalize">{item.industry.replace(/_/g, " ")}</span>
                    {item.trendDirection === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-400" />}
                    {item.trendDirection === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{item.lenderCount} lenders</span>
                    <span className="text-xs font-semibold text-white">{item.avgAppetiteScore}</span>
                  </div>
                </div>
                <HeatBar score={item.avgAppetiteScore} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-green-400 rounded inline-block" /> Active ≥80</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-yellow-400 rounded inline-block" /> Moderate 65–79</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 bg-orange-400 rounded inline-block" /> Cooling &lt;65</span>
          </div>
        </div>

        {/* Signal feed */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Latest Appetite Signals</h2>
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
