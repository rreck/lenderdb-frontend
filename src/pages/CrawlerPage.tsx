import { useState, useEffect, useRef } from "react"
import { Bot, Play, RefreshCw, Loader2, AlertCircle, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const CRAWLER_URL = import.meta.env.VITE_CRAWLER_URL || "/crawler"

interface CrawlerStatus {
  status: "running" | "idle"
  current_lender: string | null
  last_run: string | null
  slm_url: string
  batch_progress: { done: number; total: number; errors: number }
}

interface Criteria {
  staleness_days: number | null
  missing_deal_size: boolean
  missing_industries: boolean
  missing_loan_types: boolean
  missing_equipment_types: boolean
  missing_regions: boolean
  missing_signals: boolean
  low_confidence: boolean
  confidence_threshold: number
  force_all: boolean
}

const DEFAULT_CRITERIA: Criteria = {
  staleness_days: 7,
  missing_deal_size: true,
  missing_industries: true,
  missing_loan_types: true,
  missing_equipment_types: false,
  missing_regions: false,
  missing_signals: false,
  low_confidence: false,
  confidence_threshold: 60,
  force_all: false,
}

async function crawlerFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${CRAWLER_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  })
  return res.json()
}

function StatusBadge({ status }: { status: "running" | "idle" | "unreachable" }) {
  if (status === "running") return (
    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      Running
    </span>
  )
  if (status === "idle") return (
    <span className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
      Idle
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
      <AlertCircle className="h-3 w-3" />
      Unreachable
    </span>
  )
}

function ProgressBar({ done, total, errors }: { done: number; total: number; errors: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{done.toLocaleString()} / {total.toLocaleString()} lenders</span>
        <span className="flex items-center gap-3">
          {errors > 0 && <span className="text-red-400">{errors} errors</span>}
          <span>{pct}%</span>
        </span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface CheckRowProps {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}

function CheckRow({ label, description, checked, disabled, onChange }: CheckRowProps) {
  return (
    <label className={cn(
      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
      disabled ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900/30" :
      checked ? "border-primary/40 bg-primary/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
    )}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 accent-primary"
      />
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
      </div>
    </label>
  )
}

export function CrawlerPage() {
  const [status, setStatus] = useState<CrawlerStatus | null>(null)
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [pin, setPin] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [pasteName, setPasteName] = useState("")
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{extracted: Record<string,unknown>; signals: unknown[]} | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unlocked = pin === "000"

  const fetchStatus = async () => {
    try {
      const res = await crawlerFetch("/status")
      setStatus(res.data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const processText = async () => {
    if (!pasteText.trim()) return
    setProcessing(true)
    setResult(null)
    try {
      const res = await crawlerFetch("/process-text", {
        method: "POST",
        body: JSON.stringify({ text: pasteText, name: pasteName || "Unknown" }),
      })
      if (res.success) setResult(res.data)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startBatch = async () => {
    setStarting(true)
    try {
      await crawlerFetch("/batch", {
        method: "POST",
        body: JSON.stringify({ criteria }),
      })
      await fetchStatus()
    } finally {
      setStarting(false)
    }
  }

  const isRunning = status?.status === "running"
  const unreachable = !loading && status === null

  // estimated time remaining
  const eta = (() => {
    if (!status || !isRunning) return null
    const { done, total } = status.batch_progress
    if (done < 2 || total === 0) return null
    // assume ~4 workers at ~25s each = ~6/min
    const remaining = total - done
    const mins = Math.round(remaining / 6)
    if (mins < 60) return `~${mins}m remaining`
    return `~${Math.round(mins / 60)}h ${mins % 60}m remaining`
  })()

  const set = (key: keyof Criteria) => (val: boolean | number | null) =>
    setCriteria(prev => ({ ...prev, [key]: val }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Crawler Control</h1>
            <p className="text-xs text-zinc-500">crewai-lenderdb-crawler</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            maxLength={8}
            placeholder="·····"
            className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white text-center outline-none focus:border-zinc-600 placeholder-zinc-700"
          />
          {unlocked && (
            <button onClick={fetchStatus} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status card */}
      <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 transition-opacity", !unlocked && "opacity-30 pointer-events-none select-none blur-sm")}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Status</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <StatusBadge status={unreachable ? "unreachable" : status!.status} />
          )}
        </div>

        {status && (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <div className="text-lg font-bold text-white">{status.batch_progress.done.toLocaleString()}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Done</div>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <div className="text-lg font-bold text-white">{status.batch_progress.total.toLocaleString()}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Total</div>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <div className={cn("text-lg font-bold", status.batch_progress.errors > 0 ? "text-red-400" : "text-white")}>
                  {status.batch_progress.errors}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Errors</div>
              </div>
            </div>

            {isRunning && status.batch_progress.total > 0 && (
              <ProgressBar {...status.batch_progress} />
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3 w-3" />
                SLM: {status.slm_url}
              </span>
              {status.current_lender && (
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {status.current_lender}
                </span>
              )}
            </div>

            {eta && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {eta}
              </div>
            )}

            {status.last_run && (
              <div className="text-[11px] text-zinc-600">
                Last run: {new Date(status.last_run).toLocaleString()}
              </div>
            )}
          </>
        )}

        {unreachable && (
          <p className="text-sm text-zinc-500">Cannot reach crawler at {CRAWLER_URL}</p>
        )}
      </div>

      {/* Criteria config */}
      <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 transition-opacity", !unlocked && "opacity-30 pointer-events-none select-none blur-sm")}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Re-crawl Criteria</span>
          <button
            onClick={() => setCriteria(DEFAULT_CRITERIA)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Reset defaults
          </button>
        </div>

        {/* Force all overrides everything */}
        <CheckRow
          label="Force all lenders"
          description="Re-crawl every lender regardless of other criteria"
          checked={criteria.force_all}
          onChange={v => setCriteria(prev => ({ ...prev, force_all: v }))}
        />

        <div className={cn("space-y-2 transition-opacity", criteria.force_all && "opacity-40 pointer-events-none")}>
          {/* Staleness */}
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider pt-1">Staleness</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Not verified in 1 day", days: 1 },
              { label: "Not verified in 7 days", days: 7 },
              { label: "Not verified in 30 days", days: 30 },
              { label: "Never verified", days: null },
            ].map(({ label, days }) => (
              <label key={String(days)} className={cn(
                "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                criteria.staleness_days === days
                  ? "border-primary/40 bg-primary/5 text-white"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
              )}>
                <input
                  type="radio"
                  name="staleness"
                  checked={criteria.staleness_days === days}
                  onChange={() => set("staleness_days")(days)}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
          <label className={cn(
            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
            criteria.staleness_days === undefined || (criteria.staleness_days !== 1 && criteria.staleness_days !== 7 && criteria.staleness_days !== 30 && criteria.staleness_days !== null && criteria.staleness_days !== undefined)
              ? "border-primary/40 bg-primary/5 text-white"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
          )}>
            <input
              type="radio"
              name="staleness"
              checked={false}
              readOnly
              className="accent-primary"
            />
            <span className="text-zinc-400 mr-1">Custom:</span>
            <input
              type="number"
              min={1}
              max={365}
              placeholder="days"
              className="w-16 bg-transparent border-b border-zinc-700 text-white text-sm outline-none px-1"
              onChange={e => set("staleness_days")(parseInt(e.target.value) || 7)}
            />
            <span className="text-zinc-500 text-xs">days</span>
          </label>

          {/* Missing data */}
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider pt-2">Missing Data</div>
          <div className="grid grid-cols-1 gap-2">
            <CheckRow
              label="No deal size range"
              description="Lender has no minimum or maximum deal size recorded"
              checked={criteria.missing_deal_size}
              onChange={v => set("missing_deal_size")(v)}
            />
            <CheckRow
              label="No industry profile"
              description="No favored or avoided industries extracted"
              checked={criteria.missing_industries}
              onChange={v => set("missing_industries")(v)}
            />
            <CheckRow
              label="No loan types"
              description="No lending products recorded (lease, loan, LOC, etc.)"
              checked={criteria.missing_loan_types}
              onChange={v => set("missing_loan_types")(v)}
            />
            <CheckRow
              label="No equipment types"
              description="No equipment categories recorded"
              checked={criteria.missing_equipment_types}
              onChange={v => set("missing_equipment_types")(v)}
            />
            <CheckRow
              label="No geography / regions"
              description="No countries or states recorded"
              checked={criteria.missing_regions}
              onChange={v => set("missing_regions")(v)}
            />
          </div>

          {/* Signal quality */}
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider pt-2">Signal Quality</div>
          <div className="grid grid-cols-1 gap-2">
            <CheckRow
              label="No appetite signals"
              description="Re-crawl news/blog pages on lenders with zero signals"
              checked={criteria.missing_signals}
              onChange={v => set("missing_signals")(v)}
            />
            <CheckRow
              label="Low confidence score"
              description={`Re-crawl lenders with confidence below ${criteria.confidence_threshold}`}
              checked={criteria.low_confidence}
              onChange={v => set("low_confidence")(v)}
            />
            {criteria.low_confidence && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <span className="text-xs text-zinc-400">Threshold</span>
                <input
                  type="range"
                  min={30}
                  max={90}
                  value={criteria.confidence_threshold}
                  onChange={e => set("confidence_threshold")(parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-medium text-white w-6">{criteria.confidence_threshold}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={startBatch}
        disabled={!unlocked || isRunning || starting || unreachable}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
          isRunning || starting || unreachable
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
        )}
      >
        {starting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
        ) : isRunning ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Batch Running</>
        ) : (
          <><Play className="h-4 w-4" /> Start Batch</>
        )}
      </button>

      {isRunning && (
        <p className="text-center text-xs text-zinc-600">
          Status auto-refreshes every 5 seconds
        </p>
      )}

      {/* Text paste processor */}
      <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 transition-opacity", !unlocked && "opacity-30 pointer-events-none select-none blur-sm")}>
        <span className="text-sm font-semibold text-white">Process Text</span>

        <input
          type="text"
          value={pasteName}
          onChange={e => setPasteName(e.target.value)}
          placeholder="Lender name (optional)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
        />

        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste any text — website content, email, PDF copy, notes..."
          rows={8}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 resize-none font-mono"
        />

        <button
          onClick={processText}
          disabled={processing || !pasteText.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all",
            processing || !pasteText.trim()
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-zinc-700 text-white hover:bg-zinc-600"
          )}
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Extract with SLM</>
          )}
        </button>

        {result && (
          <div className="space-y-3 pt-1">
            {Object.keys(result.extracted).length > 0 ? (
              <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3 space-y-1.5">
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Extracted Fields</div>
                {Object.entries(result.extracted).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-zinc-500 shrink-0 w-36">{k}</span>
                    <span className="text-white">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center">No structured fields found</p>
            )}

            {result.signals.length > 0 && (
              <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3 space-y-2">
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Signals</div>
                {(result.signals as {text: string; type: string}[]).map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className={cn("shrink-0 font-medium", s.type === "positive" ? "text-green-400" : s.type === "negative" ? "text-red-400" : "text-yellow-400")}>{s.type}</span>
                    <span className="text-zinc-300">{s.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
