import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Globe, Phone, Mail, Star, Shield, Clock, TrendingUp, TrendingDown, Minus, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { apiService } from "@/api"
import type { Lender, WatchlistEntry } from "@/api/types"
import { formatDollars, formatDate, daysSince, labelLenderType, labelApprovalSpeed, labelProduct, labelIndustry, cn } from "@/lib/utils"

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 90) return <Badge variant="success">High confidence {score}%</Badge>
  if (score >= 75) return <Badge variant="warning">Medium confidence {score}%</Badge>
  return <Badge variant="danger">Low confidence {score}%</Badge>
}

function AppetiteSignalRow({ signal }: { signal: Lender["appetiteSignals"][0] }) {
  const icon = signal.type === "positive"
    ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
    : signal.type === "negative"
    ? <TrendingDown className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
    : <Minus className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />

  const bg = signal.type === "positive" ? "bg-green-50 border-green-100" :
    signal.type === "negative" ? "bg-red-50 border-red-100" : "bg-yellow-50 border-yellow-100"

  return (
    <div className={cn("flex gap-3 p-3 rounded-lg border", bg)}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{signal.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{signal.source}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{daysSince(signal.detectedAt)}d ago</span>
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
  }, [lenderId])

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
        <p className="text-muted-foreground">Lender not found</p>
        <Button variant="link" onClick={() => navigate("/lenders")}>Back to database</Button>
      </div>
    )
  }

  const appetiteColor = lender.appetiteScore >= 80 ? "text-green-600" :
    lender.appetiteScore >= 60 ? "text-yellow-600" : "text-red-500"

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50">
      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/lenders")} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{lender.name}</h1>
                <Badge variant="secondary">{labelLenderType(lender.lenderType)}</Badge>
                <Badge variant="outline">Tier {lender.tier}</Badge>
              </div>
              {lender.parentCompany && (
                <p className="text-xs text-muted-foreground">Part of {lender.parentCompany}</p>
              )}
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
            <Button size="sm" onClick={() => navigate(`/match`)}>
              Run Deal Match
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Top stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">Deal Range</p>
            <p className="text-sm font-semibold">{formatDollars(lender.minDealSize)} – {formatDollars(lender.maxDealSize)}</p>
            {lender.preferredDealMin && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                sweet spot {formatDollars(lender.preferredDealMin)}–{formatDollars(lender.preferredDealMax!)}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">Approval Speed</p>
            <p className="text-sm font-semibold">{labelApprovalSpeed(lender.approvalSpeed)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">Risk Tolerance</p>
            <p className="text-sm font-semibold capitalize">{lender.riskTolerance}</p>
            {lender.minCreditFico && (
              <p className="text-[11px] text-muted-foreground mt-0.5">Min FICO {lender.minCreditFico}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">Appetite Score</p>
            <p className={cn("text-2xl font-bold", appetiteColor)}>{lender.appetiteScore}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
            <ConfidenceBadge score={lender.confidenceScore} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Verified {daysSince(lender.lastVerifiedDate)}d ago
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border">
          <Tabs defaultValue="intelligence">
            <div className="px-6 border-b">
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
                <h3 className="text-sm font-semibold">Live Appetite Signals</h3>
                <span className="text-xs text-muted-foreground">
                  {lender.appetiteSignals.length} signals detected
                </span>
              </div>
              {lender.appetiteSignals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No signals detected for this lender yet.</p>
              ) : (
                <div className="space-y-3">
                  {lender.appetiteSignals
                    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                    .map(sig => <AppetiteSignalRow key={sig.id} signal={sig} />)
                  }
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold mb-3">Favored Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {lender.industriesFavored.map(i => (
                    <Badge key={i} variant="success">{labelIndustry(i)}</Badge>
                  ))}
                </div>
              </div>

              {lender.industriesAvoided.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-3 text-red-600">Avoided Industries</h3>
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
                  <h3 className="text-sm font-semibold mb-4">Lending Products</h3>
                  <div className="flex flex-wrap gap-2">
                    {lender.lendingProducts.map(p => (
                      <Badge key={p} variant="blue">{labelProduct(p)}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4">Equipment Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {lender.equipmentCategories.map(c => (
                      <Badge key={c} variant="secondary">{c.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Underwriting</h3>
                  <div className="space-y-2">
                    {lender.minCreditFico && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min FICO</span>
                        <span className="font-medium">{lender.minCreditFico}</span>
                      </div>
                    )}
                    {lender.minTimeInBusinessMonths && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Time in Business</span>
                        <span className="font-medium">{lender.minTimeInBusinessMonths} months</span>
                      </div>
                    )}
                    {lender.maxLtv && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max LTV</span>
                        <span className="font-medium">{lender.maxLtv}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk Posture</span>
                      <span className="font-medium capitalize">{lender.riskTolerance}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Broker Program</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Broker Friendly</span>
                      <span className={cn("font-medium", lender.brokerFriendly ? "text-green-600" : "text-red-500")}>
                        {lender.brokerFriendly ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registration Required</span>
                      <span className="font-medium">{lender.brokerRegistrationRequired ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Captive/Independent</span>
                      <span className="font-medium capitalize">{lender.lenderType === "captive" ? "Captive" : "Independent"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Coverage */}
            <TabsContent value="coverage" className="p-6 pb-8">
              <div>
                <h3 className="text-sm font-semibold mb-3">Countries Served</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {lender.countriesServed.map(c => (
                    <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{c}</span>
                    </div>
                  ))}
                </div>

                {lender.statesServed && lender.statesServed.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold mb-3">US States (restricted)</h3>
                    <div className="flex flex-wrap gap-2">
                      {lender.statesServed.map(s => (
                        <Badge key={s} variant="warning">{s}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
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
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Originations Contact</p>
                      <p className="text-sm font-medium">{lender.originationsContact}</p>
                    </div>
                  </div>
                )}
                {lender.originationsEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${lender.originationsEmail}`} className="text-sm text-primary hover:underline">
                        {lender.originationsEmail}
                      </a>
                    </div>
                  </div>
                )}
                {lender.originationsPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{lender.originationsPhone}</p>
                    </div>
                  </div>
                )}
                {lender.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        {lender.website.replace("https://", "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {!lender.originationsContact && !lender.originationsEmail && !lender.originationsPhone && !lender.website && (
                  <p className="text-sm text-muted-foreground">Contact information not yet verified for this lender.</p>
                )}
              </div>
            </TabsContent>

            {/* Data Sources */}
            <TabsContent value="sources" className="p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Provenance</h3>
                <ConfidenceBadge score={lender.confidenceScore} />
              </div>
              <div className="space-y-3">
                {lender.sources.map(src => (
                  <div key={src.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{src.sourceType}</Badge>
                      <span className="text-sm font-medium">{src.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
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
              <p className="text-xs text-muted-foreground mt-4">
                Last verified: {formatDate(lender.lastVerifiedDate)} ({daysSince(lender.lastVerifiedDate)} days ago)
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
