

import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

// ── Verified data from rcrintl-finance.com closings (Nov 2022 – Jul 2024) ──
const STATS = [
  { val: ">$140M",  sub: "Capital Placed",      note: "verified transactions" },
  { val: "50+",     sub: "Deals Closed",         note: "Nov 2022 – Jul 2024" },
  { val: "$2.9M",   sub: "Average Deal",         note: "$731K median" },
  { val: "2.5/mo",  sub: "Closing Velocity",     note: "7-day median gap" },
  { val: "20+",     sub: "Years Active",         note: "since 2003" },
  { val: "7",       sub: "Product Lines",        note: "20+ industries" },
]

const SIZE_BUCKETS = [
  { label: "< $100K",      count: 4,  pct: 8  },
  { label: "$100K–$500K",  count: 14, pct: 28 },
  { label: "$500K–$1M",    count: 12, pct: 24 },
  { label: "$1M–$5M",      count: 12, pct: 24 },
  { label: "$5M–$10M",     count: 4,  pct: 8  },
  { label: "> $10M",       count: 4,  pct: 8  },
]

const PRODUCTS_VOL = [
  { label: "Trade Finance",   vol: 91.3, deals: 15, color: "#1ec8b4", pct: 63 },
  { label: "A/R · P/O",      vol: 26.5, deals: 16, color: "#3ca0ff", pct: 18 },
  { label: "Real Estate",     vol: 15.8, deals: 6,  color: "#a78bfa", pct: 11 },
  { label: "Equipment",       vol: 9.1,  deals: 11, color: "#fbbf24", pct: 6  },
  { label: "Other",           vol: 2.6,  deals: 2,  color: "#6b7280", pct: 2  },
]

// Monthly deal counts (verified)
const MONTHLY = [
  { m: "N'22", n: 1 }, { m: "J'23", n: 2 }, { m: "F'23", n: 3 },
  { m: "M'23", n: 1 }, { m: "A'23", n: 3 }, { m: "M'23", n: 3 },
  { m: "J'23", n: 3 }, { m: "J'23", n: 4 }, { m: "A'23", n: 4 },
  { m: "S'23", n: 5 }, { m: "O'23", n: 2 }, { m: "N'23", n: 1 },
  { m: "D'23", n: 1 }, { m: "J'24", n: 1 }, { m: "F'24", n: 1 },
  { m: "M'24", n: 1 }, { m: "A'24", n: 3 }, { m: "J'24", n: 4 },
  { m: "J'24", n: 2 },
]

// ── Horizontal bar chart ──
function HBar({ label, pct, count, color, note }: {
  label: string; pct: number; count: number; color: string; note?: string
}) {
  return (
    <div className="group flex items-center gap-3 py-1.5">
      <div className="w-28 text-right text-xs font-mono text-zinc-500 shrink-0">{label}</div>
      <div className="flex-1 h-6 bg-zinc-800/60 rounded-sm overflow-hidden relative">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-white/80">
          {count} deal{count !== 1 ? "s" : ""}
          {note && <span className="ml-2 text-zinc-500">{note}</span>}
        </span>
      </div>
      <div className="w-8 text-right text-xs font-mono text-zinc-600 shrink-0">{pct}%</div>
    </div>
  )
}

// ── Volume bar ──
function VolumeBar({ label, vol, deals, color, pct }: {
  label: string; vol: number; deals: number; color: string; pct: number
}) {
  return (
    <div className="py-2">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs font-mono text-zinc-500">{deals} deals</span>
      </div>
      <div className="h-5 bg-zinc-800/60 rounded-sm overflow-hidden relative">
        <div
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-white/90">
          ${vol}M
        </span>
      </div>
    </div>
  )
}

// ── Monthly sparkline ──
function MonthlyChart() {
  const max = Math.max(...MONTHLY.map(m => m.n))
  const W = 640, H = 100, padX = 0, padY = 8
  const barW = (W - padX * 2) / MONTHLY.length - 3

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" preserveAspectRatio="none">
      {MONTHLY.map((m, i) => {
        const x = padX + i * ((W - padX * 2) / MONTHLY.length)
        const barH = ((m.n / max) * (H - padY * 2))
        const y = H - barH - padY
        const isHigh = m.n >= 4
        return (
          <g key={i}>
            <rect
              x={x + 1} y={y} width={barW} height={barH}
              rx={2}
              fill={isHigh ? "#3ca0ff" : "#1e3a6e"}
              opacity={0.9}
            />
            <text x={x + barW / 2 + 1} y={H + 16} textAnchor="middle"
              fontSize={8} fill="#4b5563" fontFamily="monospace">
              {m.m}
            </text>
            {m.n >= 3 && (
              <text x={x + barW / 2 + 1} y={y - 3} textAnchor="middle"
                fontSize={9} fill="#60a5fa" fontFamily="monospace">
                {m.n}
              </text>
            )}
          </g>
        )
      })}
      {/* avg line */}
      {(() => {
        const avg = MONTHLY.reduce((s, m) => s + m.n, 0) / MONTHLY.length
        const avgY = H - (avg / max) * (H - padY * 2) - padY
        return (
          <line x1={0} y1={avgY} x2={W} y2={avgY}
            stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        )
      })()}
    </svg>
  )
}

// ── Percentile chart ──
function PercentileBar() {
  const points = [
    { p: "Min", val: 48,    label: "$48K" },
    { p: "P25", val: 264,   label: "$264K" },
    { p: "P50", val: 731,   label: "$731K" },
    { p: "P75", val: 1870,  label: "$1.87M" },
    { p: "P90", val: 7000,  label: "$7M" },
    { p: "Max", val: 50000, label: "$50M" },
  ]
  const logMin = Math.log10(48)
  const logMax = Math.log10(50000)
  const toX = (v: number) => ((Math.log10(v) - logMin) / (logMax - logMin)) * 100

  return (
    <div className="relative pt-6 pb-8">
      {/* track */}
      <div className="relative h-1.5 bg-zinc-800 rounded mx-2">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-blue-600 to-teal-500 rounded opacity-70" />
        {points.map(({ p, val, label }) => {
          const x = toX(val)
          const isMedian = p === "P50"
          return (
            <div key={p} className="absolute top-0" style={{ left: `${x}%`, transform: "translateX(-50%)" }}>
              <div className={cn(
                "w-2.5 h-2.5 rounded-full border-2 -mt-[5px]",
                isMedian ? "bg-yellow-400 border-yellow-400" : "bg-zinc-900 border-blue-400"
              )} />
              <div className={cn(
                "absolute top-4 text-[10px] font-mono whitespace-nowrap",
                isMedian ? "text-yellow-400 font-bold" : "text-zinc-500"
              )} style={{ transform: "translateX(-50%)" }}>
                {label}
              </div>
              <div className="absolute -top-5 text-[9px] font-mono text-zinc-600 whitespace-nowrap"
                style={{ transform: "translateX(-50%)" }}>
                {p}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ──
export function WhyUsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto pb-16">

      {/* ── Page header ── */}
      <div className="mb-8 flex items-baseline gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-white">Why Us?</h1>
        <span className="text-sm text-zinc-500">
          Verified performance data · 20+ years · &gt;$140M placed · 50+ closed transactions
        </span>
      </div>

      {/* ── Hero stats ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 border border-zinc-800 rounded mb-6 divide-x divide-zinc-800">
        {STATS.map(({ val, sub, note }) => (
          <div key={sub} className="py-5 px-3 text-center">
            <span className="block text-2xl font-bold text-yellow-400 tracking-tight leading-none">{val}</span>
            <span className="block text-[11px] text-white uppercase tracking-widest mt-1.5 font-medium">{sub}</span>
            <span className="block text-[10px] text-zinc-600 mt-0.5 font-mono">{note}</span>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Deal size distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Deal Size Distribution</h2>
            <span className="text-xs font-mono text-zinc-600">n = 50</span>
          </div>
          <div className="space-y-0.5">
            {SIZE_BUCKETS.map(b => (
              <HBar key={b.label} label={b.label} pct={b.pct} count={b.count}
                color={b.pct >= 24 ? "#3ca0ff" : "#1e3a6e"} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 font-mono">avg $2.9M  ·  median $731K  ·  range $50K–$50M</p>
          </div>
        </div>

        {/* Volume by product */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Volume by Product</h2>
            <span className="text-xs font-mono text-zinc-600">$145M total</span>
          </div>
          <div className="space-y-1">
            {PRODUCTS_VOL.map(p => (
              <VolumeBar key={p.label} {...p} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 font-mono">trade finance leads volume · AR leads deal count</p>
          </div>
        </div>
      </div>

      {/* ── Deal size percentiles ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-5 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Deal Size Spread  <span className="text-zinc-600 font-normal text-xs font-mono ml-2">(log scale)</span></h2>
          <span className="text-xs font-mono text-yellow-400">median $731K</span>
        </div>
        <PercentileBar />
      </div>

      {/* ── Closing velocity ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Closing Velocity</h2>
          <span className="text-xs font-mono text-zinc-500">2.5 deals/month avg  ·  <span className="text-yellow-400">30+ annualized</span></span>
        </div>
        <MonthlyChart />
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500/80" />
            <span className="text-[10px] font-mono text-zinc-600">≥4 deals/month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px border-t border-dashed border-yellow-400/50" />
            <span className="text-[10px] font-mono text-zinc-600">2.6 avg</span>
          </div>
        </div>
      </div>

      {/* ── Platform narrative ── */}
      <div className="border border-zinc-800 rounded mb-4 overflow-hidden">
        <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">The Technology Behind the Results</h2>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">AI-POWERED</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {[
            {
              color: "text-yellow-400",
              title: "Speed",
              body: "A/R advances funded 12–48 hours from invoice receipt. 24-hour approvals across all products. 5–10 business days for full facility setup.",
            },
            {
              color: "text-blue-400",
              title: "Precision Matching",
              body: "The same AI lender-matching platform managing our deal pipeline is now working for you — identifying optimal capital sources across structure, size, and industry.",
            },
            {
              color: "text-teal-400",
              title: "Global Reach",
              body: "US, Canada, Caribbean, UK. Trade finance across 20+ industries including precious metals, agriculture, manufacturing, medical, and logistics.",
            },
          ].map(({ color, title, body }) => (
            <div key={title} className="bg-zinc-900 px-5 py-5">
              <div className={cn("text-xs font-mono tracking-widest mb-2", color)}>{title}</div>
              <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border border-zinc-800 rounded p-8 text-center bg-zinc-900/50">
        <p className="text-xs font-mono text-zinc-600 mb-2 tracking-widest uppercase">Ready to close?</p>
        <h2 className="text-lg font-semibold text-white mb-1">
          The same platform closing our deals is working for you now.
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          No long-term contracts. No hidden fees. Startups accepted.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/apply"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-sm font-semibold tracking-wider uppercase rounded transition-colors"
          >
            Apply Now →
          </Link>
          <a
            href="/rcr-panel-5-closings.png"
            target="_blank"
            rel="noreferrer"
            className="inline-block border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-6 py-3 text-sm font-mono tracking-wider rounded transition-colors"
          >
            View All Closings ↗
          </a>
        </div>
      </div>
    </div>
  )
}
