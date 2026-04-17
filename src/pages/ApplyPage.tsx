import { useState } from "react"
import { FileText, Building2, Receipt, Globe, CheckCircle2, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const FIELD = "space-y-1.5"
const LBL = "text-zinc-400 text-sm"
const INP = "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
const INP_ERR = "bg-zinc-800 border-red-500 text-white placeholder:text-zinc-600"

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className={FIELD}>
      <Label className={LBL}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

function ClaimBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      {text}
    </div>
  )
}

function SuccessBanner({ product }: { product: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Application Submitted</h3>
      <p className="text-zinc-400 max-w-sm">
        Your {product} application has been received. We'll match it against our lender network and follow up within 24 hours.
      </p>
    </div>
  )
}

// ── Equipment Lease Form ────────────────────────────────────────────────────

function EquipmentForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({
    name: "", address: "", website: "", phone: "", email: "",
    equipmentType: "", dealAmount: "", leaseTermMonths: "", leaseStructure: "",
    creditProfile: "", noteType: "", saleLeasebackInterest: "", description: "",
  })
  const [attempted, setAttempted] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const e = (k: string) => attempted && !f[k as keyof typeof f] ? "This field is required" : undefined

  return (
    <div className="space-y-5">
      {/* Claims */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-2">
        <ClaimBadge text="$10,000 – $10,000,000+ financed" />
        <ClaimBadge text="24 – 60 month lease terms" />
        <ClaimBadge text="No minimum credit score" />
        <ClaimBadge text="Bad credit & bankruptcy OK" />
        <ClaimBadge text="No collateral age restrictions" />
        <ClaimBadge text="Early payoff discounts available" />
        <ClaimBadge text="Sale-leaseback accepted" />
        <ClaimBadge text="Private party transactions: yes" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" error={e("name")}><Input className={e("name") ? INP_ERR : INP} placeholder="John Smith" value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone *"><Input className={INP} placeholder="+1 300 400 5000" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email Address *" error={e("email")}><Input className={e("email") ? INP_ERR : INP} placeholder="john@company.com" value={f.email} onChange={set("email")} /></Field>
        <Field label="Website"><Input className={INP} placeholder="https://www.company.com" value={f.website} onChange={set("website")} /></Field>
        <Field label="Business Address"><Input className={INP} placeholder="123 Main St, City, State" value={f.address} onChange={set("address")} /></Field>
        <Field label="Equipment Type *" error={e("equipmentType")}>
          <Input className={e("equipmentType") ? INP_ERR : INP} placeholder="e.g. CNC machine, forklift, dump truck" value={f.equipmentType} onChange={set("equipmentType")} />
        </Field>
        <Field label="Deal Amount *" error={e("dealAmount")}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input className={cn(e("dealAmount") ? INP_ERR : INP, "pl-6")} placeholder="150,000" value={f.dealAmount} onChange={set("dealAmount")} />
          </div>
        </Field>
        <Field label="Desired Lease Term">
          <Select onValueChange={v => setF(p => ({ ...p, leaseTermMonths: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select term" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {["24", "36", "48", "60"].map(t => (
                <SelectItem key={t} value={t} className="text-white">{t} months</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Lease Structure">
          <Select onValueChange={v => setF(p => ({ ...p, leaseStructure: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select structure" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {[
                ["fmv", "Fair Market Value (FMV)"],
                ["dollar_buyout", "$1 Buyout"],
                ["ten_pct", "10% Purchase Option"],
                ["equipment_put", "Equipment Put"],
              ].map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Credit Profile">
          <Select onValueChange={v => setF(p => ({ ...p, creditProfile: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select credit profile" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="good" className="text-white">Good (700+)</SelectItem>
              <SelectItem value="fair" className="text-white">Fair (600–699)</SelectItem>
              <SelectItem value="bad" className="text-white">Bad / Challenged (&lt;600)</SelectItem>
              <SelectItem value="bankruptcy" className="text-white">Past Bankruptcy</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Note Type">
          <Select onValueChange={v => setF(p => ({ ...p, noteType: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select note type" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="purchase" className="text-white">Purchase</SelectItem>
              <SelectItem value="sale_leaseback" className="text-white">Sale-Leaseback</SelectItem>
              <SelectItem value="equity_cash_out" className="text-white">Equity Cash Out</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Sectors / Industry">
        <Select onValueChange={v => setF(p => ({ ...p, description: v }))}>
          <SelectTrigger className={INP}><SelectValue placeholder="Select sector" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {[
              "Manufacturing & Industrial", "Construction & Heavy Equipment", "Transportation & Fleet",
              "Healthcare & Medical", "Agricultural", "Energy & Mining", "Technology & Software",
              "Restaurant & Fitness", "Trucking & Logistics", "Other"
            ].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Description of Request">
        <textarea
          className={cn(INP, "w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-none")}
          placeholder="Describe the equipment, intended use, and any other relevant details"
          value={f.description}
          onChange={set("description")}
        />
      </Field>

      <Field label="Supporting Documents">
        <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-md">
          <Upload className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Upload financials, invoices, or other documents</span>
          <input type="file" multiple className="hidden" id="eq-upload" />
          <label htmlFor="eq-upload" className="ml-auto text-xs text-primary cursor-pointer hover:underline">Browse</label>
        </div>
      </Field>

      <Button className="w-full" disabled={loading} onClick={() => {
        setAttempted(true)
        if (!f.name || !f.email || !f.equipmentType || !f.dealAmount) return
        onSubmit(f)
      }}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Application"}
      </Button>
    </div>
  )
}

// ── CRE / Construction Form ─────────────────────────────────────────────────

function CREForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({
    name: "", address: "", website: "", phone: "", email: "",
    propertyType: "", fundingUse: "", dealAmount: "", description: "",
  })
  const [attempted, setAttempted] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const e = (k: string) => attempted && !f[k as keyof typeof f] ? "This field is required" : undefined

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-2">
        <ClaimBadge text="Loans from $200,000 to $500,000,000+" />
        <ClaimBadge text="Multifamily, office, industrial, hospitality" />
        <ClaimBadge text="Construction & project funding" />
        <ClaimBadge text="Cannabis, agricultural, renewable energy" />
        <ClaimBadge text="Urgent closing timelines accommodated" />
        <ClaimBadge text="Private bank & institutional lender network" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" error={e("name")}><Input className={e("name") ? INP_ERR : INP} placeholder="John Smith" value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone *"><Input className={INP} placeholder="+1 300 400 5000" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email Address *" error={e("email")}><Input className={e("email") ? INP_ERR : INP} placeholder="john@company.com" value={f.email} onChange={set("email")} /></Field>
        <Field label="Website"><Input className={INP} placeholder="https://www.company.com" value={f.website} onChange={set("website")} /></Field>
        <Field label="Property / Project Address"><Input className={INP} placeholder="123 Main St, City, State" value={f.address} onChange={set("address")} /></Field>
        <Field label="Deal Amount *" error={e("dealAmount")}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input className={cn(e("dealAmount") ? INP_ERR : INP, "pl-6")} placeholder="2,500,000" value={f.dealAmount} onChange={set("dealAmount")} />
          </div>
        </Field>
        <Field label="Property Type *">
          <Select onValueChange={v => setF(p => ({ ...p, propertyType: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {["Multifamily", "Industrial", "Office", "Retail", "Hotel / Resort", "Medical", "Mixed-Use",
                "Condo", "Land", "Church", "Cannabis", "Agricultural", "Renewable Energy (Wind/Solar/BioFuel/Hydro)"].map(t => (
                <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Funding Use *">
          <Select onValueChange={v => setF(p => ({ ...p, fundingUse: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select use" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {[
                ["acquisition", "Property Acquisition"],
                ["construction", "Construction / Rehabilitation"],
                ["refi", "Refinance / Recapitalization"],
                ["lease_up", "Lease-Up / Stabilization"],
                ["partner_buyout", "Partner Buy-Out"],
                ["note_acquisition", "Note Acquisition"],
                ["redevelopment", "Redevelopment / Repositioning"],
                ["bankruptcy", "Bankruptcy / Receivership Resolution"],
              ].map(([v, l]) => <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Executive Summary / Description *">
        <textarea
          className={cn(INP, "w-full rounded-md border px-3 py-2 text-sm min-h-[100px] resize-none")}
          placeholder="Describe the project, value proposition, and exit strategy"
          value={f.description}
          onChange={set("description")}
        />
      </Field>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Required documents for underwriting</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-zinc-400">
          {[
            "2 years trailing revenue + YTD financials",
            "12 months bank statements",
            "Property rent roll or pre-sales evidence",
            "Detailed cost breakdown",
            "Personal financial statement (all principals)",
            "3 years personal tax returns (all principals)",
            "Proof of cash equity invested/pledged",
            "Most recent appraisal and photos",
          ].map(d => <div key={d} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-zinc-600 shrink-0" />{d}</div>)}
        </div>
      </div>

      <Field label="Supporting Documents">
        <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-md">
          <Upload className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Upload financials, appraisals, rent rolls</span>
          <input type="file" multiple className="hidden" id="cre-upload" />
          <label htmlFor="cre-upload" className="ml-auto text-xs text-primary cursor-pointer hover:underline">Browse</label>
        </div>
      </Field>

      <Button className="w-full" disabled={loading} onClick={() => {
        setAttempted(true)
        if (!f.name || !f.email || !f.dealAmount) return
        onSubmit(f)
      }}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Application"}
      </Button>
    </div>
  )
}

// ── AR / PO / Inventory Form ────────────────────────────────────────────────

function ARForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({
    name: "", address: "", website: "", phone: "", email: "",
    productType: "", monthlyInvoiceVolume: "", sector: "", description: "",
  })
  const [attempted, setAttempted] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const e = (k: string) => attempted && !f[k as keyof typeof f] ? "This field is required" : undefined

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-2">
        <ClaimBadge text="Advances 70–95% of invoice value" />
        <ClaimBadge text="$1,000 to $20,000,000+ monthly" />
        <ClaimBadge text="Funded 12–48 hours from invoice receipt" />
        <ClaimBadge text="Startups accepted — no minimums" />
        <ClaimBadge text="No long-term contracts" />
        <ClaimBadge text="Medical insurance invoices accepted" />
        <ClaimBadge text="Domestic & cross-border factoring" />
        <ClaimBadge text="Initial funding in 5–10 business days" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" error={e("name")}><Input className={e("name") ? INP_ERR : INP} placeholder="John Smith" value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone *"><Input className={INP} placeholder="+1 300 400 5000" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email Address *" error={e("email")}><Input className={e("email") ? INP_ERR : INP} placeholder="john@company.com" value={f.email} onChange={set("email")} /></Field>
        <Field label="Website"><Input className={INP} placeholder="https://www.company.com" value={f.website} onChange={set("website")} /></Field>
        <Field label="Business Address"><Input className={INP} placeholder="123 Main St, City, State" value={f.address} onChange={set("address")} /></Field>
        <Field label="Product Type *" error={e("productType")}>
          <Select onValueChange={v => setF(p => ({ ...p, productType: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="ar_factoring" className="text-white">A/R Factoring</SelectItem>
              <SelectItem value="contract_financing" className="text-white">Contract Financing Facility (CFF)</SelectItem>
              <SelectItem value="purchase_order" className="text-white">Purchase Order Financing</SelectItem>
              <SelectItem value="inventory" className="text-white">Inventory Financing</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Monthly Invoice / Revenue Volume">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input className={cn(INP, "pl-6")} placeholder="500,000" value={f.monthlyInvoiceVolume} onChange={set("monthlyInvoiceVolume")} />
          </div>
        </Field>
        <Field label="Industry / Sector">
          <Select onValueChange={v => setF(p => ({ ...p, sector: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select sector" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {[
                "Distributors / Wholesalers", "Construction", "Manufacturing", "Importers / Exporters",
                "Staffing Agencies", "Trucking / Transportation", "Government Contractors",
                "Medical Practices / Healthcare", "Technology", "Oil & Energy", "Janitorial / Cleaning",
                "Courier / Delivery", "Other"
              ].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Description of Request *">
        <textarea
          className={cn(INP, "w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-none")}
          placeholder="Describe your business, invoice cycle, customer concentration, and funding need"
          value={f.description}
          onChange={set("description")}
        />
      </Field>

      <Field label="Supporting Documents">
        <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-md">
          <Upload className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Upload invoices, bank statements, AR aging report</span>
          <input type="file" multiple className="hidden" id="ar-upload" />
          <label htmlFor="ar-upload" className="ml-auto text-xs text-primary cursor-pointer hover:underline">Browse</label>
        </div>
      </Field>

      <Button className="w-full" disabled={loading} onClick={() => {
        setAttempted(true)
        if (!f.name || !f.email || !f.productType) return
        onSubmit(f)
      }}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Application"}
      </Button>
    </div>
  )
}

// ── Trade Finance Form ──────────────────────────────────────────────────────

function TradeForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({
    name: "", address: "", website: "", phone: "", email: "",
    instrument: "", commodity: "", originCountry: "", destinationCountry: "",
    dealAmount: "", description: "",
  })
  const [attempted, setAttempted] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const e = (k: string) => attempted && !f[k as keyof typeof f] ? "This field is required" : undefined

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-2">
        <ClaimBadge text="Documentary Letters of Credit (DLC / MT700)" />
        <ClaimBadge text="Standby Letters of Credit (SBLC / MT760)" />
        <ClaimBadge text="Bank Guarantees (BG)" />
        <ClaimBadge text="Proof of Funds (POF)" />
        <ClaimBadge text="Ready, Willing & Able (RWA)" />
        <ClaimBadge text="Swift Services" />
        <ClaimBadge text="Cross-border risk reduction" />
        <ClaimBadge text="Little to no upfront capital required" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" error={e("name")}><Input className={e("name") ? INP_ERR : INP} placeholder="John Smith" value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone *"><Input className={INP} placeholder="+1 300 400 5000" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email Address *" error={e("email")}><Input className={e("email") ? INP_ERR : INP} placeholder="john@company.com" value={f.email} onChange={set("email")} /></Field>
        <Field label="Website"><Input className={INP} placeholder="https://www.company.com" value={f.website} onChange={set("website")} /></Field>
        <Field label="Instrument Needed *" error={e("instrument")}>
          <Select onValueChange={v => setF(p => ({ ...p, instrument: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select instrument" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="dlc" className="text-white">Documentary Letter of Credit (DLC)</SelectItem>
              <SelectItem value="sblc" className="text-white">Standby Letter of Credit (SBLC)</SelectItem>
              <SelectItem value="bg" className="text-white">Bank Guarantee (BG)</SelectItem>
              <SelectItem value="pof" className="text-white">Proof of Funds (POF)</SelectItem>
              <SelectItem value="rwa" className="text-white">Ready, Willing & Able (RWA)</SelectItem>
              <SelectItem value="swift" className="text-white">Swift Services</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Deal Amount *" error={e("dealAmount")}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input className={cn(e("dealAmount") ? INP_ERR : INP, "pl-6")} placeholder="1,000,000" value={f.dealAmount} onChange={set("dealAmount")} />
          </div>
        </Field>
        <Field label="Commodity / Goods">
          <Select onValueChange={v => setF(p => ({ ...p, commodity: v }))}>
            <SelectTrigger className={INP}><SelectValue placeholder="Select commodity" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {["Sugar", "Rice", "Corn / Maize", "Sunflower Oil", "Wheat Flour", "Soybeans",
                "Precious Metals", "Agricultural — Other", "Other Commodities"].map(c => (
                <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Origin Country"><Input className={INP} placeholder="e.g. Brazil, India" value={f.originCountry} onChange={set("originCountry")} /></Field>
        <Field label="Destination Country"><Input className={INP} placeholder="e.g. USA, UAE" value={f.destinationCountry} onChange={set("destinationCountry")} /></Field>
      </div>

      <Field label="Transaction Description *">
        <textarea
          className={cn(INP, "w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-none")}
          placeholder="Describe the trade transaction, parties involved, and timeline"
          value={f.description}
          onChange={set("description")}
        />
      </Field>

      <Field label="Supporting Documents">
        <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-md">
          <Upload className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Upload purchase orders, contracts, or CIS form</span>
          <input type="file" multiple className="hidden" id="trade-upload" />
          <label htmlFor="trade-upload" className="ml-auto text-xs text-primary cursor-pointer hover:underline">Browse</label>
        </div>
      </Field>

      <Button className="w-full" disabled={loading} onClick={() => {
        setAttempted(true)
        if (!f.name || !f.email || !f.instrument || !f.dealAmount) return
        onSubmit(f)
      }}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Application"}
      </Button>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

const PRODUCTS = [
  { key: "equipment",  label: "Equipment Finance",      icon: FileText,   subtitle: "$10K – $10M+ · 24–60 months · No min. credit" },
  { key: "cre",        label: "Real Estate & Construction", icon: Building2, subtitle: "$200K – $500M+ · All commercial property types" },
  { key: "ar",         label: "A/R · PO · Inventory",   icon: Receipt,    subtitle: "70–95% advance · Funded in 12–48 hrs" },
  { key: "trade",      label: "Trade Finance",           icon: Globe,      subtitle: "DLC · SBLC · BG · POF · Swift" },
]

export function ApplyPage() {
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const handleSubmit = (product: string) => async (data: Record<string, string>) => {
    setLoading(p => ({ ...p, [product]: true }))
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, ...data, source: "apply_page", preferred_partner: "rcr" }),
      })
    } catch (_) { /* fail silently — lead capture best-effort */ }
    await new Promise(r => setTimeout(r, 800))
    setLoading(p => ({ ...p, [product]: false }))
    setSubmitted(p => ({ ...p, [product]: true }))
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      {/* Header */}
      <div className="px-6 py-5 bg-zinc-900 border-b border-zinc-800">
        <h1 className="text-2xl font-semibold text-white mb-1">Apply for Financing</h1>
        <p className="text-sm text-zinc-400">
          All your financing needs under one roof. Submit your application and we'll match you with the right lender — fast.
        </p>
        <div className="flex items-center gap-6 mt-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />24-hour approvals available</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />No hidden fees</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />No long-term contracts</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Global service capabilities</span>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        <Tabs defaultValue="equipment">
          <TabsList className="grid grid-cols-4 w-full bg-zinc-900 border border-zinc-800 h-auto p-1 mb-6">
            {PRODUCTS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-zinc-400"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium leading-tight text-center">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {PRODUCTS.map(({ key, subtitle }) => (
            <TabsContent key={key} value={key}>
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{subtitle}</p>
              </div>
              {submitted[key] ? (
                <SuccessBanner product={PRODUCTS.find(p => p.key === key)!.label} />
              ) : key === "equipment" ? (
                <EquipmentForm onSubmit={handleSubmit(key)} loading={!!loading[key]} />
              ) : key === "cre" ? (
                <CREForm onSubmit={handleSubmit(key)} loading={!!loading[key]} />
              ) : key === "ar" ? (
                <ARForm onSubmit={handleSubmit(key)} loading={!!loading[key]} />
              ) : (
                <TradeForm onSubmit={handleSubmit(key)} loading={!!loading[key]} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
