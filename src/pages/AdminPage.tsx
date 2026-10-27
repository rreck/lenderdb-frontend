import { useState, useEffect, useCallback } from "react"
import {
  Bell, Inbox, Bot, FlaskConical, BookOpen, RefreshCw, Loader2,
  Plus, Check, X, AlertTriangle, CheckCircle2, Gauge,
  ChevronDown, ChevronRight, Mail, Send, Search, Download,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CrawlerPage } from "./CrawlerPage"
import { cn } from "@/lib/utils"

const TABLIST = "border-b border-zinc-800 gap-1"
const TAB = "flex items-center gap-2 text-zinc-400 hover:text-white data-[state=active]:text-primary"
const CARD = "rounded-xl border border-zinc-800 bg-zinc-950 p-5"
const INP = "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"

const PRODUCTS = [
  { key: "equipment", label: "Equipment Finance" },
  { key: "cre", label: "Real Estate and Construction" },
  { key: "ar", label: "A/R, PO and Inventory" },
  { key: "trade", label: "Trade Finance" },
]

function fmt(dt: string | null) {
  if (!dt) return "never"
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })
}

/* ── notify targets ──────────────────────────────────────────────────────── */

interface Target {
  id: number
  label: string
  phone: string
  enabled: boolean
}

function NotifyTab() {
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/notify-targets")
      const b = await r.json()
      if (b.success) { setTargets(b.data); setError(null) }
      else setError(b.error || "could not read the targets")
    } catch {
      setError("could not reach the API")
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (t: Target) => {
    setBusy(t.id)
    try {
      const r = await fetch("/api/admin/notify-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, enabled: !t.enabled }),
      })
      const b = await r.json()
      if (!b.success) setError(b.error || "the change was rejected")
      else setError(null)
    } catch {
      setError("could not reach the API")
    }
    setBusy(null)
    load()
  }

  const add = async () => {
    setAdding(true)
    try {
      const r = await fetch("/api/admin/notify-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, phone: newPhone, enabled: false }),
      })
      const b = await r.json()
      if (!b.success) setError(b.error || "the number was rejected")
      else { setError(null); setNewLabel(""); setNewPhone("") }
    } catch {
      setError("could not reach the API")
    }
    setAdding(false)
    load()
  }

  const on = targets.filter(t => t.enabled).length

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Alert destinations</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Every application submitted on any of the four forms alerts each number
              switched on here. Any combination is allowed, including all of them and
              none of them. The loan amount travels as the code.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <Badge variant={on ? "success" : "danger"}>{on} switched on</Badge>
          <span className="text-zinc-500">
            {on === 0
              ? "No alert leaves the system while every number is off. Applications are still stored."
              : "AWS Notify allows 10 messages per number per day and 200 across the account per day."}
          </span>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3" role="alert">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-5 divide-y divide-zinc-800 border-t border-zinc-800">
          {targets.length === 0 && !loading && (
            <p className="py-5 text-sm text-zinc-500">No number is on record.</p>
          )}
          {targets.map(t => (
            <div key={t.id} className="flex items-center gap-4 py-3">
              <button
                onClick={() => toggle(t)}
                disabled={busy === t.id}
                aria-pressed={t.enabled}
                title={t.enabled ? "Switch this number off" : "Switch this number on"}
                className={cn(
                  "h-6 w-11 shrink-0 rounded-full border transition-colors relative",
                  t.enabled
                    ? "bg-primary border-primary"
                    : "bg-zinc-800 border-zinc-700"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  t.enabled ? "left-6" : "left-0.5"
                )} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{t.label}</div>
                <div className="text-sm text-zinc-500 font-mono">{t.phone}</div>
              </div>
              {busy === t.id
                ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                : t.enabled
                  ? <Badge variant="success"><Check className="h-3 w-3 mr-1" />On</Badge>
                  : <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Off</Badge>}
            </div>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <h3 className="text-sm font-semibold text-white">Add a number</h3>
        <p className="text-sm text-zinc-500 mt-1">
          A number is added switched off, so nothing starts alerting on its own.
          The format is E.164 for the United States, such as +12484440835.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="nt-label" className="block text-xs font-medium text-zinc-400 mb-1.5">Label</label>
            <Input id="nt-label" className={INP} placeholder="Dispatch desk"
                   value={newLabel} onChange={e => setNewLabel(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="nt-phone" className="block text-xs font-medium text-zinc-400 mb-1.5">Mobile number</label>
            <Input id="nt-phone" className={INP} placeholder="+12484440835"
                   value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          </div>
          <Button onClick={add} disabled={adding || !newPhone}>
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── submissions ─────────────────────────────────────────────────────────── */

interface Submission {
  id: string
  created_at: string
  product: string
  source: string | null
  tags: string[]
  emailed: number
  name: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  deal_amount: string | null
  sms_sent: boolean | null
  sms_text_id: string | null
  sms_error: string | null
  sms_sent_at: string | null
}

const SUGGESTED_TAGS = ["hot", "callback", "qualified", "junk", "duplicate", "funded"]

function alertState(r: Submission) {
  return r.sms_sent === true ? "sent" : r.sms_sent === false ? "failed" : "none"
}

function SubmissionRow({ r, onChanged }: { r: Submission; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<string[]>(r.tags || [])
  const [saving, setSaving] = useState(false)
  const [to, setTo] = useState("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (next: string[]) => {
    setSaving(true)
    setTags(next)
    try {
      const res = await fetch(`/api/admin/submissions/${r.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      })
      const b = await res.json()
      if (b.success) { setTags(b.data.tags); setError(null) }
      else setError(b.error || "the tag was rejected")
    } catch {
      setError("could not reach the API")
    }
    setSaving(false)
    onChanged()
  }

  const flipTag = (t: string) =>
    save(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])

  const forward = async () => {
    setSending(true)
    setError(null)
    setSent(null)
    try {
      const res = await fetch(`/api/admin/submissions/${r.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, note }),
      })
      const b = await res.json()
      if (b.success) { setSent(b.data.to); setNote("") }
      else setError(b.error || "the message was not accepted")
    } catch {
      setError("could not reach the API")
    }
    setSending(false)
    onChanged()
  }

  const state = alertState(r)
  const isCheck = r.source === "admin_test"

  return (
    <>
      <tr className={cn("text-zinc-300 cursor-pointer hover:bg-zinc-900/60", isCheck && "opacity-70")}
          onClick={() => setOpen(o => !o)}>
        <td className="py-2.5 pr-3 text-zinc-600">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-500">{fmt(r.created_at)}</td>
        <td className="py-2.5 pr-4"><Badge variant="outline">{r.product}</Badge></td>
        <td className="py-2.5 pr-4">
          <div className="text-white">{r.name || "no name"}</div>
          <div className="text-xs text-zinc-500">{r.email}</div>
        </td>
        <td className="py-2.5 pr-4 font-mono">{r.deal_amount || "none"}</td>
        <td className="py-2.5 pr-4">
          {state === "sent" && <Badge variant="success">sent</Badge>}
          {state === "failed" && <span title={r.sms_error || ""}><Badge variant="danger">failed</Badge></span>}
          {state === "none" && <Badge variant="secondary">none</Badge>}
        </td>
        <td className="py-2.5 pr-4">
          <div className="flex flex-wrap gap-1">
            {isCheck && <Badge variant="purple">check</Badge>}
            {tags.map(t => <Badge key={t} variant="blue">{t}</Badge>)}
            {r.emailed > 0 && (
              <Badge variant="secondary"><Mail className="h-3 w-3 mr-1" />{r.emailed}</Badge>
            )}
          </div>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={7} className="bg-zinc-900/40 px-4 py-4">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tags</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map(t => (
                    <button
                      key={t}
                      onClick={e => { e.stopPropagation(); flipTag(t) }}
                      disabled={saving}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        tags.includes(t)
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-zinc-700 text-zinc-400 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="text-zinc-500">Phone <span className="text-zinc-200 font-mono">{r.phone || "none"}</span></div>
                  <div className="text-zinc-500">Website <span className="text-zinc-200">{r.website || "none"}</span></div>
                  <div className="text-zinc-500">Address <span className="text-zinc-200">{r.address || "none"}</span></div>
                  <div className="text-zinc-500">Reference <span className="text-zinc-200 font-mono text-xs">{r.id}</span></div>
                  {state === "failed" && r.sms_error && (
                    <div className="text-zinc-500">Alert error <span className="text-red-300">{r.sms_error}</span></div>
                  )}
                </div>
              </div>

              <div onClick={e => e.stopPropagation()}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Send this submission to somebody
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  The whole application, its tags and the fate of its alert travel in the
                  message. Nothing leaves until Send is pressed.
                </p>
                <div className="mt-3 space-y-2">
                  <Input className={INP} placeholder="name@example.com" value={to}
                         onChange={e => setTo(e.target.value)} />
                  <Input className={INP} placeholder="a line of context, optional" value={note}
                         onChange={e => setNote(e.target.value)} />
                  <Button size="sm" onClick={forward} disabled={sending || !to}>
                    {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send
                  </Button>
                </div>
                {sent && (
                  <p className="mt-3 text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />Accepted for delivery to {sent}
                  </p>
                )}
                {error && (
                  <p className="mt-3 text-sm text-red-300 flex items-start gap-2" role="alert">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{error}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SubmissionsTab() {
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [product, setProduct] = useState("")
  const [alert, setAlert] = useState("")
  const [hideChecks, setHideChecks] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/submissions")
      const b = await r.json()
      if (b.success) setRows(b.data)
    } catch { /* the empty state covers it */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const needle = q.trim().toLowerCase()
  const shown = rows.filter(r => {
    if (product && r.product !== product) return false
    if (alert && alertState(r) !== alert) return false
    if (hideChecks && r.source === "admin_test") return false
    if (!needle) return true
    return [r.name, r.email, r.phone, r.deal_amount, (r.tags || []).join(" ")]
      .some(v => (v || "").toLowerCase().includes(needle))
  })

  const exportUrl = (format: string) => {
    const p = new URLSearchParams({ format })
    if (product) p.set("product", product)
    if (needle) p.set("q", needle)
    if (alert) p.set("alert", alert)
    if (hideChecks) p.set("include_tests", "false")
    return "/api/admin/export?" + p.toString()
  }

  const SEL = "h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-white"

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Submissions</h2>
          <p className="text-sm text-zinc-400 mt-1">
            The hundred most recent applications, each with what happened to its alert.
            Open a row to tag it or send it on.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input className={cn(INP, "pl-9")} placeholder="name, email, phone, amount or tag"
                 value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={SEL} value={product} onChange={e => setProduct(e.target.value)}>
          <option value="">every form</option>
          {PRODUCTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <select className={SEL} value={alert} onChange={e => setAlert(e.target.value)}>
          <option value="">any alert state</option>
          <option value="sent">alert sent</option>
          <option value="failed">alert failed</option>
          <option value="none">no alert</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={hideChecks} onChange={e => setHideChecks(e.target.checked)}
                 className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-indigo-500" />
          hide checks
        </label>
        <a href={exportUrl("csv")} download>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />CSV</Button>
        </a>
        <a href={exportUrl("json")} download>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />JSON</Button>
        </a>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {shown.length} of {rows.length} shown. An export carries every field held about
        every matching submission, the whole form body included, and follows the filters set here.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
              <th className="py-2 pr-3 font-medium w-6"></th>
              <th className="py-2 pr-4 font-medium">Received</th>
              <th className="py-2 pr-4 font-medium">Form</th>
              <th className="py-2 pr-4 font-medium">Applicant</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Alert</th>
              <th className="py-2 pr-4 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {shown.map(r => <SubmissionRow key={r.id} r={r} onChanged={load} />)}
            {shown.length === 0 && !loading && (
              <tr><td colSpan={7} className="py-6 text-center text-zinc-500">
                <Inbox className="h-5 w-5 mx-auto mb-2" />Nothing matches
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── crawler ─────────────────────────────────────────────────────────────── */

interface Coverage {
  lenders: number
  active: number
  checked: number
  confident: number
  newest_check: string | null
  updated_24h: number
}

function CrawlerTab() {
  const [cov, setCov] = useState<Coverage | null>(null)

  useEffect(() => {
    fetch("/api/admin/crawler/coverage")
      .then(r => r.json())
      .then(b => { if (b.success) setCov(b.data) })
      .catch(() => { /* the panel below still works */ })
  }, [])

  const cells = cov ? [
    { k: "On record", v: cov.lenders.toLocaleString() },
    { k: "Active", v: cov.active.toLocaleString() },
    { k: "Checked", v: cov.checked.toLocaleString() },
    { k: "Confidence 60 or better", v: cov.confident.toLocaleString() },
    { k: "Changed in 24 hours", v: cov.updated_24h.toLocaleString() },
    { k: "Newest check", v: fmt(cov.newest_check) },
  ] : []

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-white">Coverage</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-px bg-zinc-800 rounded-lg overflow-hidden">
          {cells.map(c => (
            <div key={c.k} className="bg-zinc-950 p-4">
              <div className="text-xl font-semibold text-white">{c.v}</div>
              <div className="text-xs text-zinc-500 mt-1">{c.k}</div>
            </div>
          ))}
          {!cov && <div className="bg-zinc-950 p-4 text-sm text-zinc-500">reading</div>}
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          The crawler runs one lender every 2 minutes, a batch every 30 minutes, a full
          pass on Sunday at 02:00, FDIC discovery every 4 hours and SBA 7a discovery on
          Saturday at 03:00. Each lender is written as it finishes, so a stoppage costs
          only the one in flight.
        </p>
      </div>

      <CrawlerPage />
    </div>
  )
}

/* ── tests ───────────────────────────────────────────────────────────────── */

interface TestCheck { check: string; pass: boolean; detail: string }
interface TestResult {
  product: string
  label: string
  url: string
  lead_id: string | null
  passed: number
  total: number
  ok: boolean
  checks: TestCheck[]
}

function TestsTab() {
  const [picked, setPicked] = useState<string[]>(PRODUCTS.map(p => p.key))
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const flip = (k: string) =>
    setPicked(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const r = await fetch("/api/admin/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: picked }),
      })
      const b = await r.json()
      if (b.success) setResults(b.data.results)
      else setError(b.error || "the run was rejected")
    } catch {
      setError("could not reach the API")
    }
    setRunning(false)
  }

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <h2 className="text-lg font-semibold text-white">Form checks</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Choose any of the four forms, or all of them, and run the submission path end
          to end. No message is sent by a run: the alert path is never entered, so a run
          costs nothing against the daily Notify allowance. Each run leaves one
          submission tagged admin_test so it stays apart from a real application.
        </p>

        <div className="mt-4 space-y-2">
          {PRODUCTS.map(p => (
            <label key={p.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={picked.includes(p.key)}
                onChange={() => flip(p.key)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-indigo-500"
              />
              <span className="text-sm text-white">{p.label}</span>
              <span className="text-xs text-zinc-500 font-mono">/apply/{p.key}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={run} disabled={running || picked.length === 0}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-2" />}
            Run {picked.length === PRODUCTS.length ? "all four" : `${picked.length} selected`}
          </Button>
          <span className="text-xs text-zinc-500">nothing is sent</span>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3" role="alert">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>

      {results && results.map(r => (
        <div key={r.product} className={CARD}>
          <div className="flex items-center gap-3">
            {r.ok
              ? <CheckCircle2 className="h-5 w-5 text-green-400" />
              : <AlertTriangle className="h-5 w-5 text-red-400" />}
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{r.label}</div>
              <div className="text-xs text-zinc-500 font-mono">{r.url}</div>
            </div>
            <Badge variant={r.ok ? "success" : "danger"}>{r.passed} of {r.total}</Badge>
          </div>
          <div className="mt-4 divide-y divide-zinc-800 border-t border-zinc-800">
            {r.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 text-sm">
                {c.pass
                  ? <Check className="h-4 w-4 text-green-400 shrink-0" />
                  : <X className="h-4 w-4 text-red-400 shrink-0" />}
                <span className="text-zinc-200 flex-1">{c.check}</span>
                <span className="text-xs text-zinc-500 font-mono">{c.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── documentation ───────────────────────────────────────────────────────── */

function Doc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-zinc-300 leading-relaxed">{children}</div>
    </div>
  )
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <tr className="border-b border-zinc-800 last:border-0">
      <td className="py-2 pr-4 align-top text-zinc-400 whitespace-nowrap">{a}</td>
      <td className="py-2 text-zinc-200">{b}</td>
    </tr>
  )
}

function AdminGuide() {
  return (
    <div className="space-y-5">
      <Doc title="What this page is for">
        <p>
          Administration gathers the controls that change how the site behaves, the record
          of what it has received, the state of the crawler and a way to check the forms
          without disturbing anyone. Each tab is described below: what it shows, what the
          controls do and what they cannot do.
        </p>
      </Doc>

      <Doc title="Getting in">
        <p>
          This page is reached by its address alone. No link to it appears anywhere on the
          site, so it is neither advertised to a visitor nor followed by a crawler working
          through the navigation.
        </p>
        <p>
          It opens black with one small box. A four digit code shows the contents. The
          code unlocks for the browser tab only: a new tab asks again.
        </p>
        <p>
          This hides the page rather than guards it. The interfaces behind it answer on
          their own, so anybody who knows their addresses reaches the data without passing
          the box. Treat the code as a screen in front of a window, not a lock on a door.
        </p>
      </Doc>

      <Doc title="Notify tab">
        <p>
          Purpose: decide which mobile numbers hear about a new application.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="The switch" b="Turns one number on or off. The change takes effect on the next submission. No message is sent by flipping it" />
            <Row a="On count" b="How many numbers are currently armed. At zero the forms keep working and no alert leaves the system" />
            <Row a="Add a number" b="Records a new destination, always switched off, so nothing begins alerting the moment it is typed" />
            <Row a="Refresh" b="Rereads the list from the database rather than from the page" />
          </tbody>
        </table>
        <p>
          Any combination is allowed, including all of them at once. Each armed number
          receives its own message and each message is recorded separately, so one number
          failing does not hide another succeeding.
        </p>
        <p>
          What it cannot do: change the wording of the alert, and change the brand per
          message. Both are fixed by the Notify configuration. A number is never deleted
          from this page.
        </p>
      </Doc>

      <Doc title="Submissions tab">
        <p>
          Purpose: see what arrived, work through it and pass it on.
        </p>
        <p>
          The table lists the hundred most recent applications, newest first, with the time
          received, which form was used, the applicant, the amount, the state of the alert
          and any tags. Sent means the message was accepted for delivery and an identifier
          came back. Failed means it was refused, and the reason is on the row. None means
          no alert was attempted, which is the case for a check run from the Tests tab and
          for any submission made while every number was switched off.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="Search" b="Matches the applicant, the email, the phone, the amount and the tags at once" />
            <Row a="Form" b="Narrows to one of the four products" />
            <Row a="Alert state" b="Narrows to sent, failed or no alert, which is the fastest way to find anyone who was never followed up" />
            <Row a="Hide checks" b="Drops the rows a Tests run created, leaving real applications only" />
            <Row a="Open a row" b="Shows the phone, website, address, the reference and any alert error, and gives the tag and send controls" />
            <Row a="Tags" b="Hot, callback, qualified, junk, duplicate and funded. A tag saves at once and is searchable and exportable" />
            <Row a="Send" b="Mails the whole application to any address, with an optional line of context" />
            <Row a="CSV and JSON" b="Export what the filters currently show" />
          </tbody>
        </table>
        <p>
          Sending is deliberate: a recipient has to be typed and Send has to be pressed.
          Each attempt is recorded against the application with the address, the time and
          the outcome, and the count shows on the row, so it is clear whether a lead has
          already been passed on and to whom. A refused address is reported rather than
          silently dropped.
        </p>
        <p>
          An export carries every field held about every matching submission, the whole
          form body included, with one column per form field and a column for the tags.
          CSV suits a spreadsheet, JSON suits another system. The filters apply, so the
          export matches what is on screen.
        </p>
      </Doc>

      <Doc title="Crawler tab">
        <p>
          Purpose: know how current the lender record set is, and refresh it on demand.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="Coverage" b="Counts taken from the record set itself, so they hold even when the crawler is idle or wedged" />
            <Row a="On record" b="Every lender held" />
            <Row a="Active" b="Those marked active, which is the population a deal is matched against" />
            <Row a="Checked" b="Those carrying a verification date, meaning the crawler has reached them at least once" />
            <Row a="Confidence 60 or better" b="Checked records whose extracted fields scored well enough to rely on" />
            <Row a="Changed in 24 hours" b="A quick read on whether the crawler is actually working" />
            <Row a="Crawler panel" b="Live status, batch progress, the current lender and the controls to start a batch" />
          </tbody>
        </table>
        <p>
          A batch selects the records that are stale or incomplete rather than all of them,
          and commits each lender as it finishes. Stopping a run therefore costs only the
          lender in flight. The crawler is reached through the API rather than directly,
          so nothing on this page depends on the crawler being published to the network.
        </p>
        <p>
          A long gap in Changed in 24 hours while the status reads running means the crawl
          thread has died and the flag is stale. Restarting the crawler container clears it.
        </p>
      </Doc>

      <Doc title="Tests tab">
        <p>
          Purpose: prove the submission path still works, for any or all of the four forms,
          without sending a message to anyone.
        </p>
        <p>
          Tick the forms to check, or leave all four ticked, and run. For each form the run
          stores an application, reads it back, confirms the product and the amount
          survived, and confirms that no alert was raised. Each check is listed with its
          outcome and the value it actually observed, so a failure says what was wrong
          rather than only that something was.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="The submission was stored" b="A row was written and its identifier came back" />
            <Row a="The product is correct" b="The form used and the product stored agree, so the four forms are not crossing" />
            <Row a="The loan amount survived" b="The amount reached the database unchanged" />
            <Row a="Nothing was sent" b="No alert record exists against the run, which is how the page proves it stayed silent" />
          </tbody>
        </table>
        <p>
          A run is tagged admin_test and shows in Submissions with no alert, which is
          correct rather than a fault. Nothing is deleted afterwards, so the evidence of
          each run stays.
        </p>
        <p>
          What it cannot do: drive a real browser. The browser checks fill the fields, click
          submit and do send, so they live as four files in the frontend repository under
          tests and are run deliberately from a terminal. They are never reachable from
          this page.
        </p>
      </Doc>

      <Doc title="Documentation tab">
        <p>
          Purpose: describe the site and this page to somebody who has neither built nor
          seen either. The site description covers the forms, what happens on submission,
          the alert mechanism and its ceilings, the lender record set, the crawler and the
          shape of the service. This guide covers the administration controls.
        </p>
      </Doc>

      <Doc title="Where the state actually lives">
        <table className="w-full text-sm">
          <tbody>
            <Row a="Alert destinations" b="A table of numbers with a label and a switch each. The API reads it on every submission, so a change needs no restart" />
            <Row a="Applications" b="One row per submission, holding the whole form body alongside the named fields" />
            <Row a="Alert outcomes" b="One row per message attempt, joined to its application, holding the identifier or the error" />
            <Row a="Lender records" b="The record set the crawler maintains and the matcher reads" />
          </tbody>
        </table>
        <p>
          Nothing on this page holds state in the browser. Every panel reads from the API
          each time it is opened or refreshed.
        </p>
      </Doc>
    </div>
  )
}

function DocsTab() {
  const [view, setView] = useState<"site" | "admin">("site")
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant={view === "site" ? "default" : "outline"} size="sm"
                onClick={() => setView("site")}>The site</Button>
        <Button variant={view === "admin" ? "default" : "outline"} size="sm"
                onClick={() => setView("admin")}>This admin page</Button>
      </div>
      {view === "admin" ? <AdminGuide /> : <SiteDocs />}
    </div>
  )
}

function SiteDocs() {
  return (
    <div className="space-y-5">
      <Doc title="What this site is">
        <p>
          LenderDB is the equipment finance platform behind finance.rrecktek.com. It holds
          a lender record set, scores a deal against it, takes applications from four
          product forms and alerts a mobile number the moment an application arrives.
          RRECKTEK Finance operates as a division of RCR International Finance.
        </p>
      </Doc>

      <Doc title="The four application forms">
        <p>
          Each product has its own address, so a flyer, a post or an advert can land a
          visitor straight on the form that matches the promise. An unknown product in
          the address falls back to Equipment Finance.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="/apply/equipment" b="Equipment Finance" />
            <Row a="/apply/cre" b="Real Estate and Construction" />
            <Row a="/apply/ar" b="A/R, PO and Inventory" />
            <Row a="/apply/trade" b="Trade Finance" />
          </tbody>
        </table>
        <p>
          A submission is reported as received only once the server has stored it. A
          transport failure, a refusal or a body reporting failure all leave the applicant
          on the form with the reason stated, so an application is never lost behind a
          success screen.
        </p>
      </Doc>

      <Doc title="What happens on submission">
        <p>
          The form posts to the lead endpoint. The application is written first, then the
          alert is attempted for each destination switched on in the Notify tab. The alert
          is recorded whether it succeeds or fails, and a failed alert never fails the
          application.
        </p>
        <table className="w-full text-sm mt-2">
          <tbody>
            <Row a="Step 1" b="The application is stored with its product, applicant, amount and the whole form body" />
            <Row a="Step 2" b="The loan amount is reduced to digits and fitted to 4 through 8 characters" />
            <Row a="Step 3" b="One alert goes to each destination switched on" />
            <Row a="Step 4" b="The outcome of each alert is recorded against the application" />
            <Row a="Step 5" b="The Submissions tab reads both back together" />
          </tbody>
        </table>
      </Doc>

      <Doc title="Why the alert carries a number and not a sentence">
        <p>
          Alerts travel through AWS End User Messaging Notify, which accepts only approved
          verification templates. The wording is fixed. What can be chosen is the brand on
          the configuration and a code of 4 through 8 digits. The loan amount therefore
          rides in the code, and the company name cannot vary per message because the
          brand belongs to the configuration rather than to the message.
        </p>
        <p>
          Notify allows 10 messages per destination per day and 200 across the account per
          day. Those ceilings are shared by all four forms. Past the ceiling the
          application is still stored and the refusal is recorded.
        </p>
      </Doc>

      <Doc title="Alert destinations">
        <p>
          The Notify tab lists every number on record with a switch each. Any combination
          is valid. With every switch off the forms keep working and no alert leaves the
          system. A number is added switched off.
        </p>
      </Doc>

      <Doc title="The lender record set">
        <p>
          The Lender Database page pages and filters the record set. A record carries
          appetite, deal size limits, products, industries, equipment, regions, contacts,
          sources, a confidence score and the date it was last checked. Deal Matcher scores
          a deal on size, industry, geography, risk, product and speed. Market Intel
          summarises the set. Watchlist is present but holds nothing yet.
        </p>
      </Doc>

      <Doc title="The crawler">
        <p>
          A separate agent rechecks lender sites and writes each one as it finishes. It
          runs one lender every 2 minutes, a batch every 30 minutes, a full pass on Sunday
          at 02:00, FDIC discovery every 4 hours and SBA 7a discovery on Saturday at 03:00.
          Pages are fetched over plain HTTP first and through a browser when the content
          comes back thin, then a small language model extracts the fields.
        </p>
        <p>
          The Crawler tab shows coverage and drives a batch on demand. Coverage counts come
          from the record set itself rather than from the crawler, so they stay true even
          when the crawler is idle.
        </p>
      </Doc>

      <Doc title="Checking the forms without sending">
        <p>
          The Tests tab exercises the submission path for any or all of the four forms. A
          run stores an application, reads it back, confirms the product and amount
          survived and confirms that no alert was raised. The alert path is never entered,
          so a run cannot consume the daily allowance. Runs are tagged admin_test.
        </p>
        <p>
          Browser level checks of each form, which fill the fields and submit for real, live
          as four files in the frontend repository under tests. Those do send, so they are
          run deliberately from a terminal and never from this page.
        </p>
      </Doc>

      <Doc title="Shape of the service">
        <table className="w-full text-sm">
          <tbody>
            <Row a="Site" b="finance.rrecktek.com, a single page application served as static files" />
            <Row a="Edge" b="Caddy, which serves the files and proxies every path under /api" />
            <Row a="API" b="crewai-lenderdb, FastAPI over asyncpg" />
            <Row a="Crawler" b="crewai-lenderdb-crawler, reached through the API rather than directly" />
            <Row a="Database" b="lenderdb on postgres-pgvector" />
            <Row a="Alerts" b="AWS End User Messaging Notify" />
          </tbody>
        </table>
      </Doc>
    </div>
  )
}

/* ── page ────────────────────────────────────────────────────────────────── */

/* ── gate ────────────────────────────────────────────────────────────────── */

// The code can be set at build time. It gates the view only: the interfaces
// behind it answer on their own, so this hides the page rather than guards it.
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "0000"
const GATE_KEY = "lenderdb.admin.open"

function Gate({ onOpen }: { onOpen: () => void }) {
  const [code, setCode] = useState("")
  const [wrong, setWrong] = useState(false)

  const submit = (value: string) => {
    if (value === ADMIN_CODE) {
      try { sessionStorage.setItem(GATE_KEY, "1") } catch { /* private window */ }
      onOpen()
      return
    }
    setWrong(true)
    setCode("")
    window.setTimeout(() => setWrong(false), 1200)
  }

  const change = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4)
    setCode(digits)
    if (digits.length === 4) submit(digits)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label="Code"
        placeholder="0000"
        value={code}
        onChange={e => change(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(code) }}
        className={cn(
          "w-28 bg-black text-center font-mono text-2xl tracking-[0.5em] text-zinc-200",
          "border rounded-md py-2 outline-none transition-colors",
          wrong ? "border-red-600" : "border-zinc-800 focus:border-zinc-600"
        )}
      />
    </div>
  )
}

export function AdminPage() {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(GATE_KEY) === "1" } catch { return false }
  })

  if (!open) return <Gate onOpen={() => setOpen(true)} />

  return (
    <div className="p-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-white">Administration</h1>
      <p className="text-sm text-zinc-400 mt-1">
        Alert destinations, submissions, the crawler, the form checks and how the site works.
      </p>

      <Tabs defaultValue="submissions" className="mt-6">
        <TabsList className={TABLIST}>
          <TabsTrigger value="submissions" className={TAB}><Inbox className="h-4 w-4" />Submissions</TabsTrigger>
          <TabsTrigger value="notify" className={TAB}><Bell className="h-4 w-4" />Notify</TabsTrigger>
          <TabsTrigger value="crawler" className={TAB}><Bot className="h-4 w-4" />Crawler</TabsTrigger>
          <TabsTrigger value="tests" className={TAB}><FlaskConical className="h-4 w-4" />Tests</TabsTrigger>
          <TabsTrigger value="docs" className={TAB}><BookOpen className="h-4 w-4" />Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions"><SubmissionsTab /></TabsContent>
        <TabsContent value="notify"><NotifyTab /></TabsContent>
        <TabsContent value="crawler"><CrawlerTab /></TabsContent>
        <TabsContent value="tests"><TestsTab /></TabsContent>
        <TabsContent value="docs"><DocsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
