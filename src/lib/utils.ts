import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toLocaleString()}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (date.toDateString() === now.toDateString()) return `today at ${timeStr}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `yesterday at ${timeStr}`
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function labelLenderType(t: string): string {
  const map: Record<string, string> = {
    bank: "Bank",
    credit_union: "Credit Union",
    leasing_company: "Leasing Company",
    specialty_finance: "Specialty Finance",
    private_credit: "Private Credit",
    captive: "Captive",
    cdfi: "CDFI",
  }
  return map[t] ?? t
}

export function labelApprovalSpeed(s: string): string {
  const map: Record<string, string> = {
    same_day: "Same Day",
    "2_3_days": "2–3 Days",
    "1_week": "1 Week",
    "2_4_weeks": "2–4 Weeks",
    "30_plus_days": "30+ Days",
  }
  return map[s] ?? s
}

export function labelProduct(p: string): string {
  const map: Record<string, string> = {
    finance_lease: "Finance Lease",
    operating_lease: "Operating Lease",
    equipment_loan: "Equipment Loan",
    sale_leaseback: "Sale-Leaseback",
    trac_lease: "TRAC Lease",
    fmv_lease: "FMV Lease",
    line_of_credit: "Line of Credit",
    working_capital: "Working Capital",
  }
  return map[p] ?? p
}

export function labelIndustry(i: string): string {
  return i.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}
