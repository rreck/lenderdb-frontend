import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronRight, RefreshCw, Loader2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Lead {
  id: string
  created_at: string
  product: string
  source: string | null
  preferred_partner: string | null
  name: string | null
  email: string | null
  phone: string | null
  deal_amount: string | null
  payload: Record<string, unknown>
}

const PRODUCT_COLORS: Record<string, string> = {
  equipment: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  cre:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ar:        "bg-amber-500/15 text-amber-400 border-amber-500/30",
  trade:     "bg-purple-500/15 text-purple-400 border-purple-500/30",
}

const PRODUCT_LABELS: Record<string, string> = {
  equipment: "Equipment",
  cre:       "Real Estate",
  ar:        "A/R Finance",
  trade:     "Trade Finance",
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

function PayloadRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex gap-3 py-1 text-sm border-b border-zinc-800 last:border-0">
      <span className="w-44 shrink-0 text-zinc-500 capitalize">
        {label.replace(/_/g, " ")}
      </span>
      <span className="text-zinc-200 break-all">{String(value)}</span>
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)

  const colorClass = PRODUCT_COLORS[lead.product] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
  const productLabel = PRODUCT_LABELS[lead.product] ?? lead.product

  // Fields shown in the expanded payload section — excludes top-level fields already visible
  const payloadEntries = Object.entries(lead.payload ?? {}).filter(
    ([k]) => !["name", "email", "phone", "website", "address", "dealAmount", "deal_amount"].includes(k)
  )

  return (
    <>
      <tr
        className={cn(
          "border-b border-zinc-800 cursor-pointer transition-colors",
          open ? "bg-zinc-900" : "hover:bg-zinc-900/60"
        )}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
          {fmt(lead.created_at)}
        </td>
        <td className="px-4 py-3">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", colorClass)}>
            {productLabel}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-white font-medium">{lead.name ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-zinc-300">{lead.email ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-zinc-300">{lead.phone ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-zinc-300 text-right font-mono">
          {lead.deal_amount ? `$${lead.deal_amount}` : "—"}
        </td>
        <td className="px-4 py-3 text-zinc-500 text-right">
          {open
            ? <ChevronDown className="h-4 w-4 inline" />
            : <ChevronRight className="h-4 w-4 inline" />}
        </td>
      </tr>

      {open && (
        <tr className="bg-zinc-900/80 border-b border-zinc-800">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Contact block */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Contact</p>
                <PayloadRow label="Name"    value={lead.name} />
                <PayloadRow label="Email"   value={lead.email} />
                <PayloadRow label="Phone"   value={lead.phone} />
                <PayloadRow label="Website" value={lead.payload?.website as string} />
                <PayloadRow label="Address" value={lead.payload?.address as string} />
                <PayloadRow label="Source"  value={lead.source} />
                <PayloadRow label="Preferred Partner" value={lead.preferred_partner} />
              </div>

              {/* Deal details block */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Deal Details</p>
                <PayloadRow label="Deal Amount" value={lead.deal_amount} />
                {payloadEntries.map(([k, v]) => (
                  <PayloadRow key={k} label={k} value={v} />
                ))}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-600 font-mono">ID: {lead.id}</div>
          </td>
        </tr>
      )}
    </>
  )
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<string>("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = product !== "all" ? `?product=${product}&limit=500` : "?limit=500"
      const res = await fetch(`/api/leads${qs}`)
      const json = await res.json()
      setLeads(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [product])

  useEffect(() => { load() }, [load])

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.product] = (acc[l.product] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? "Loading…" : `${leads.length} submission${leads.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Product filter tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "equipment", "cre", "ar", "trade"].map(p => {
          const isActive = product === p
          const count = p === "all" ? leads.length : (counts[p] ?? 0)
          return (
            <button
              key={p}
              onClick={() => setProduct(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              {PRODUCT_LABELS[p] ?? "All Products"}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-primary/30 text-primary" : "bg-zinc-800 text-zinc-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Inbox className="h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400">No leads yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
