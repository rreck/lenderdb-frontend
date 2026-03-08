import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Globe, Phone, Mail, Star, Shield, Clock, TrendingUp, TrendingDown, Minus, ExternalLink, Loader2, MapPin, RefreshCw, Check, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { apiService } from "@/api"
import type { Lender, WatchlistEntry } from "@/api/types"
import { formatDollars, formatDate, daysSince, formatRelativeDate, labelLenderType, labelApprovalSpeed, labelProduct, labelIndustry, cn } from "@/lib/utils"

function logoUrl(website?: string): string | null {
  if (!website) return null
  try {
    const url = website.startsWith("http") ? website : `https://${website}`
    const domain = new URL(url).hostname
    return `https://logo.clearbit.com/${domain}`
  } catch {
    return null
  }
}

function faviconUrl(website?: string): string | null {
  if (!website) return null
  try {
    const url = website.startsWith("http") ? website : `https://${website}`
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

function LenderLogo({ website }: { website?: string }) {
  const [logoFailed, setLogoFailed] = useState(false)
  const logo = logoUrl(website)
  const favicon = faviconUrl(website)
  if (logo && !logoFailed) {
    return (
      <img
        src={logo}
        alt=""
        className="h-12 w-12 rounded-lg object-contain bg-white p-1 shrink-0"
        onError={() => setLogoFailed(true)}
      />
    )
  }
  if (favicon) {
    return (
      <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
        <img src={favicon} alt="" className="h-8 w-8 object-contain" />
      </div>
    )
  }
  return (
    <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
      <Building2 className="h-6 w-6 text-zinc-500" />
    </div>
  )
}

function countryFlag(code: string): string {
  return code.toUpperCase().replace(/[A-Z]/g, c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 90) return <Badge variant="success">High confidence {score}%</Badge>
  if (score >= 75) return <Badge variant="warning">Medium confidence {score}%</Badge>
  return <Badge variant="danger">Low confidence {score}%</Badge>
}

function AppetiteSignalRow({ signal }: { signal: Lender["appetiteSignals"][0] }) {
  const icon = signal.type === "positive"
    ? <TrendingUp className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
    : signal.type === "negative"
    ? <TrendingDown className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
    : <Minus className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />

  const bg = signal.type === "positive" ? "bg-green-950/50 border-green-900" :
    signal.type === "negative" ? "bg-red-950/50 border-red-900" : "bg-yellow-950/50 border-yellow-900"

  return (
    <div className={cn("flex gap-3 p-3 rounded-lg border", bg)}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{signal.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500">{signal.source}</span>
          <span className="text-xs text-zinc-600">·</span>
          <span className="text-xs text-zinc-500">{daysSince(signal.detectedAt)}d ago</span>
        </div>
      </div>
    </div>
  )
}

export function LenderDetailsPage() {
  const { lenderId } = useParams<{ lenderId: string }>()
  const navigate = useNavigate()
  const [lender, setLender] = useState<Lender | null>(null)
  const [loading, setLoading] = useState(true)
  const [watchEntry, setWatchEntry] = useState<WatchlistEntry | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlSent, setCrawlSent] = useState(false)
  const [crawlPolling, setCrawlPolling] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [screenshotError, setScreenshotError] = useState(false)

  useEffect(() => {
    if (!lenderId) return
    setLoading(true)
    Promise.all([
      apiService.getLender(lenderId),
      apiService.getWatchlist(),
    ]).then(([l, wl]) => {
      setLender(l)
      setWatchEntry(wl.find(e => e.lenderId === lenderId) ?? null)
      setLoading(false)
    })
    // Check if screenshot exists
    const url = `/api/lenders/${lenderId}/screenshot`
    fetch(url, { method: "HEAD" }).then(r => {
      if (r.ok) setScreenshotUrl(url + "?t=" + Date.now())
    }).catch(() => {})
  }, [lenderId])

  const handleTakeScreenshot = async () => {
    if (!lenderId) return
    setScreenshotLoading(true)
    setScreenshotError(false)
    try {
      const r = await fetch(`/api/lenders/${lenderId}/screenshot`, { method: "POST" })
      if (r.ok) {
        setScreenshotUrl(`/api/lenders/${lenderId}/screenshot?t=` + Date.now())
      } else {
        setScreenshotError(true)
      }
    } catch {
      setScreenshotError(true)
    } finally {
      setScreenshotLoading(false)
    }
  }

  const handleWatchToggle = async () => {
    if (!lender) return
    if (watchEntry) {
      await apiService.removeFromWatchlist(watchEntry.id)
      setWatchEntry(null)
    } else {
      const entry = await apiService.addToWatchlist(lender.id)
      setWatchEntry(entry)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lender) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-500">Lender not found</p>
        <Button variant="link" onClick={() => navigate("/lenders")}>Back to database</Button>
      </div>
    )
  }

  const appetiteColor = lender.appetiteScore >= 80 ? "text-green-400" :
    lender.appetiteScore >= 60 ? "text-yellow-400" : "text-red-400"
  const favicon = faviconUrl(lender.website)

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      {/* Page header */}
      <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/lenders")} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <LenderLogo website={lender.website} />
            <div>
              <div className="flex items-center gap-2">
                {favicon && (
                  <img src={favicon} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                )}
                <h1 className="text-xl font-semibold text-white">{lender.name}</h1>
                <Badge variant="secondary">{labelLenderType(lender.lenderType)}</Badge>
                <Badge variant="outline">Tier {lender.tier}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {lender.parentCompany && (
                  <span className="text-xs text-zinc-500">Part of {lender.parentCompany}</span>
                )}
                {(lender.hqCity || lender.hqState || lender.hqCountry) && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    {lender.parentCompany && <span className="text-zinc-700">·</span>}
                    <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                    {[lender.hqCity, lender.hqState, lender.hqCountry].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={watchEntry ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={handleWatchToggle}
            >
              <Star className={cn("h-4 w-4", watchEntry && "fill-white")} />
              {watchEntry ? "Watching" : "Watch"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2 transition-colors", crawlSent && "border-green-600 text-green-400 hover:text-green-400")}
              disabled={crawling || crawlSent || crawlPolling}
              onClick={async () => {
                if (!lender) return
                setCrawling(true)
                await apiService.crawlLender(lender.id).catch(() => {})
                setCrawling(false)
                setCrawlSent(true)
                // Poll for updated data every 10s for up to 90s
                setCrawlPolling(true)
                const start = Date.now()
                const poll = setInterval(async () => {
                  const updated = await apiService.getLender(lender.id).catch(() => null)
                  if (updated) setLender(updated)
                  if (Date.now() - start > 90000) {
                    clearInterval(poll)
                    setCrawlPolling(false)
                    setCrawlSent(false)
                  }
                }, 10000)
              }}
            >
              {crawling
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : crawlSent
                  ? <Check className="h-4 w-4" />
                  : <RefreshCw className="h-4 w-4" />
              }
              {crawling ? "Sending…" : crawlSent ? "Sent to crawler" : crawlPolling ? "Waiting for update…" : "Enrich"}
            </Button>
            <Button size="sm" onClick={() => navigate(`/match`)}>
              Run Deal Match
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Top stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Deal Range</p>
            <p className="text-sm font-semibold text-white">{formatDollars(lender.minDealSize)} – {formatDollars(lender.maxDealSize)}</p>
            {lender.preferredDealMin && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                sweet spot {formatDollars(lender.preferredDealMin)}–{formatDollars(lender.preferredDealMax!)}
              </p>
            )}
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Approval Speed</p>
            <p className="text-sm font-semibold text-white">{labelApprovalSpeed(lender.approvalSpeed)}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Risk Tolerance</p>
            <p className="text-sm font-semibold text-white capitalize">{lender.riskTolerance}</p>
            {lender.minCreditFico && (
              <p className="text-[11px] text-zinc-500 mt-0.5">Min FICO {lender.minCreditFico}</p>
            )}
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Appetite Score</p>
            <p className={cn("text-2xl font-bold", appetiteColor)}>{lender.appetiteScore}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Data Quality</p>
            <ConfidenceBadge score={lender.confidenceScore} />
            <p className="text-[11px] text-zinc-500 mt-1">
              Verified {formatRelativeDate(lender.lastVerifiedDate)}
            </p>
          </div>
        </div>

        {/* Website Screenshot */}
        {lender.website && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-white">Website Preview</span>
                <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                disabled={screenshotLoading}
                onClick={handleTakeScreenshot}
              >
                {screenshotLoading
                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                  : <Camera className="h-3 w-3" />
                }
                {screenshotLoading ? "Capturing…" : screenshotUrl ? "Refresh" : "Capture"}
              </Button>
            </div>
            {screenshotUrl ? (
              <img
                src={screenshotUrl}
                alt={`${lender.name} website`}
                className="w-full object-cover max-h-80"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-600">
                <Camera className="h-8 w-8" />
                {screenshotError
                  ? <span className="text-xs text-red-500">Screenshot failed — site may be blocking automated browsers</span>
                  : <span className="text-xs">No screenshot yet — click Capture to take one</span>
                }
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <Tabs defaultValue="intelligence">
            <div className="px-6 border-b border-zinc-800">
              <TabsList>
                <TabsTrigger value="intelligence">Appetite Intelligence</TabsTrigger>
                <TabsTrigger value="profile">Lender Profile</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="sources">Data Sources</TabsTrigger>
              </TabsList>
            </div>

            {/* Appetite Intelligence */}
            <TabsContent value="intelligence" className="p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Live Appetite Signals</h3>
                <span className="text-xs text-zinc-500">
                  {lender.appetiteSignals.length} signals detected
                </span>
              </div>
              {lender.appetiteSignals.length === 0 ? (
                <p className="text-sm text-zinc-500">No signals detected for this lender yet.</p>
              ) : (
                <div className="space-y-3">
                  {lender.appetiteSignals
                    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                    .map(sig => <AppetiteSignalRow key={sig.id} signal={sig} />)
                  }
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-white mb-3">Favored Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {lender.industriesFavored.map(i => (
                    <Badge key={i} variant="success">{labelIndustry(i)}</Badge>
                  ))}
                </div>
              </div>

              {lender.industriesAvoided.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-3 text-red-400">Avoided Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {lender.industriesAvoided.map(i => (
                      <Badge key={i} variant="danger">{labelIndustry(i)}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Lender Profile */}
            <TabsContent value="profile" className="p-6 pb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Lending Products</h3>
                  <div className="flex flex-wrap gap-2">
                    {lender.lendingProducts.map(p => (
                      <Badge key={p} variant="blue">{labelProduct(p)}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Equipment Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {lender.equipmentCategories.map(c => (
                      <Badge key={c} variant="secondary">{c.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Underwriting</h3>
                  <div className="space-y-2">
                    {lender.minCreditFico && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Min FICO</span>
                        <span className="font-medium text-white">{lender.minCreditFico}</span>
                      </div>
                    )}
                    {lender.minTimeInBusinessMonths && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Min Time in Business</span>
                        <span className="font-medium text-white">{lender.minTimeInBusinessMonths} months</span>
                      </div>
                    )}
                    {lender.maxLtv && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Max LTV</span>
                        <span className="font-medium text-white">{lender.maxLtv}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Risk Posture</span>
                      <span className="font-medium text-white capitalize">{lender.riskTolerance}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Broker Program</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Broker Friendly</span>
                      <span className={cn("font-medium", lender.brokerFriendly ? "text-green-400" : "text-red-400")}>
                        {lender.brokerFriendly ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Registration Required</span>
                      <span className="font-medium text-white">{lender.brokerRegistrationRequired ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Captive/Independent</span>
                      <span className="font-medium text-white capitalize">{lender.lenderType === "captive" ? "Captive" : "Independent"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ELFA enrichment — only rendered when data exists */}
              {((lender.fundingPrograms?.length ?? 0) > 0 || (lender.creditCriteria?.length ?? 0) > 0) && (
                <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-6">
                  {(lender.fundingPrograms?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Funding Programs</h3>
                      <div className="flex flex-wrap gap-2">
                        {lender.fundingPrograms!.map(p => (
                          <Badge key={p} variant="outline" className="text-[11px]">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(lender.creditCriteria?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Credit Criteria</h3>
                      <div className="flex flex-wrap gap-2">
                        {lender.creditCriteria!.map(c => (
                          <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Coverage */}
            <TabsContent value="coverage" className="p-6 pb-8">
              <div>
                {(lender.hqCity || lender.hqState || lender.hqCountry) && (
                  <div className="flex items-center gap-2 mb-5">
                    <MapPin className="h-4 w-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-xs text-zinc-500 mr-2">Headquartered in</span>
                      <span className="text-sm font-medium text-white">
                        {[lender.hqCity, lender.hqState, lender.hqCountry].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-3">Countries Served</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {lender.countriesServed.map(c => (
                    <div key={c} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg">
                      <span className="text-2xl leading-none" style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, sans-serif" }}>
                        {countryFlag(c)}
                      </span>
                      <span className="text-sm font-medium text-white">{c}</span>
                    </div>
                  ))}
                </div>

                {lender.statesServed && lender.statesServed.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-3">US States (restricted)</h3>
                    <div className="flex flex-wrap gap-2">
                      {lender.statesServed.map(s => (
                        <Badge key={s} variant="warning">{s}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      This lender has a restricted geographic footprint — deals outside these states will not be considered.
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="p-6 pb-8">
              <div className="space-y-4 max-w-sm">
                {lender.originationsContact && (
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Originations Contact</p>
                      <p className="text-sm font-medium text-white">{lender.originationsContact}</p>
                    </div>
                  </div>
                )}
                {lender.originationsEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <a href={`mailto:${lender.originationsEmail}`} className="text-sm text-primary hover:underline">
                        {lender.originationsEmail}
                      </a>
                    </div>
                  </div>
                )}
                {lender.originationsPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm font-medium text-white">{lender.originationsPhone}</p>
                    </div>
                  </div>
                )}
                {lender.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Website</p>
                      <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        {lender.website.replace("https://", "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {(lender.hqCity || lender.hqState || lender.hqCountry) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Headquarters</p>
                      <p className="text-sm font-medium text-white">
                        {[lender.hqCity, lender.hqState, lender.hqCountry].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {!lender.originationsContact && !lender.originationsEmail && !lender.originationsPhone && !lender.website && !lender.hqCity && !lender.hqState && (
                  <p className="text-sm text-zinc-500">Contact information not yet verified for this lender.</p>
                )}
              </div>
            </TabsContent>

            {/* Data Sources */}
            <TabsContent value="sources" className="p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Provenance</h3>
                <ConfidenceBadge score={lender.confidenceScore} />
              </div>
              <div className="space-y-3">
                {lender.sources.map(src => (
                  <div key={src.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{src.sourceType}</Badge>
                      <span className="text-sm font-medium text-white">{src.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        crawled {formatDate(src.lastCrawledAt)}
                      </span>
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                Last verified: {formatRelativeDate(lender.lastVerifiedDate)}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
