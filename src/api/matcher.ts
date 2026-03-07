import type { Lender, DealProfile, LenderMatch, DealMatchResult } from "./types"

// ============================================
// Deal-Lender Matching Engine
// The core algorithm that determines fit score.
// Max score = 100 points
//   Deal size fit:    30 pts
//   Industry fit:     25 pts
//   Geography fit:    20 pts
//   Risk / credit:    15 pts
//   Product fit:      10 pts
// ============================================

function scoreDealSize(lender: Lender, deal: DealProfile): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []
  const warnings: string[] = []
  const { minDealSize, maxDealSize, preferredDealMin, preferredDealMax } = lender
  const d = deal.dealSize

  if (d < minDealSize || d > maxDealSize) {
    return { score: 0, reasons: [], warnings: [`Deal size $${d.toLocaleString()} is outside lender's range ($${minDealSize.toLocaleString()} – $${maxDealSize.toLocaleString()})`] }
  }

  let score = 20 // in range = 20
  const inPreferred = preferredDealMin && preferredDealMax && d >= preferredDealMin && d <= preferredDealMax
  if (inPreferred) {
    score = 30
    reasons.push(`Deal size $${d.toLocaleString()} is within preferred sweet spot`)
  } else {
    reasons.push(`Deal size $${d.toLocaleString()} is within acceptable range`)
  }

  return { score, reasons, warnings }
}

function scoreIndustry(lender: Lender, deal: DealProfile): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []
  const warnings: string[] = []
  const ind = deal.industryCategory.toLowerCase()

  if (lender.industriesAvoided.includes(ind)) {
    return { score: 0, reasons: [], warnings: [`Industry "${deal.industryCategory}" is on lender's avoided list`] }
  }

  if (lender.industriesFavored.includes(ind)) {
    reasons.push(`"${deal.industryCategory}" is a favored industry for this lender`)
    return { score: 25, reasons, warnings }
  }

  reasons.push(`Industry "${deal.industryCategory}" is acceptable (not favored or avoided)`)
  return { score: 12, reasons, warnings }
}

function scoreGeography(lender: Lender, deal: DealProfile): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []
  const warnings: string[] = []

  if (!lender.countriesServed.includes(deal.borrowerCountry)) {
    return { score: 0, reasons: [], warnings: [`Lender does not serve ${deal.borrowerCountry}`] }
  }

  if (deal.borrowerState && lender.statesServed && lender.statesServed.length > 0) {
    if (!lender.statesServed.includes(deal.borrowerState)) {
      warnings.push(`Lender is restricted to: ${lender.statesServed.join(", ")} — borrower is in ${deal.borrowerState}`)
      return { score: 0, reasons: [], warnings }
    }
    reasons.push(`Borrower state ${deal.borrowerState} is within lender's footprint`)
    return { score: 20, reasons, warnings }
  }

  reasons.push(`Lender serves ${deal.borrowerCountry}`)
  return { score: 20, reasons, warnings }
}

function scoreRisk(lender: Lender, deal: DealProfile): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 10 // baseline

  if (deal.creditScore && lender.minCreditFico) {
    if (deal.creditScore < lender.minCreditFico) {
      warnings.push(`Credit score ${deal.creditScore} is below lender minimum of ${lender.minCreditFico}`)
      return { score: 0, reasons: [], warnings }
    }
    if (deal.creditScore >= lender.minCreditFico + 80) {
      score += 5
      reasons.push(`Credit score ${deal.creditScore} is well above minimum (${lender.minCreditFico})`)
    } else {
      reasons.push(`Credit score ${deal.creditScore} meets minimum (${lender.minCreditFico})`)
    }
  }

  if (deal.timeInBusinessMonths && lender.minTimeInBusinessMonths) {
    if (deal.timeInBusinessMonths < lender.minTimeInBusinessMonths) {
      warnings.push(`${deal.timeInBusinessMonths} months in business is below lender's ${lender.minTimeInBusinessMonths}-month minimum`)
      score = Math.max(0, score - 5)
    }
  }

  return { score: Math.min(15, score), reasons, warnings }
}

function scoreProduct(lender: Lender, deal: DealProfile): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = []
  const warnings: string[] = []

  if (lender.lendingProducts.includes(deal.lendingProductNeeded)) {
    reasons.push(`Lender offers ${deal.lendingProductNeeded.replace(/_/g, " ")}`)
    return { score: 10, reasons, warnings }
  }

  warnings.push(`Lender may not offer ${deal.lendingProductNeeded.replace(/_/g, " ")}`)
  return { score: 0, reasons, warnings }
}

function speedWarning(lender: Lender, deal: DealProfile): string[] {
  const warnings: string[] = []
  const speedRank: Record<string, number> = {
    same_day: 1,
    "2_3_days": 2,
    "1_week": 3,
    "2_4_weeks": 4,
    "30_plus_days": 5,
  }
  const urgencySpeedMap: Record<string, string> = {
    immediate: "same_day",
    this_week: "2_3_days",
    this_month: "1_week",
    flexible: "30_plus_days",
  }
  const needed = urgencySpeedMap[deal.urgency]
  if (speedRank[lender.approvalSpeed] > speedRank[needed]) {
    warnings.push(`Approval speed (${lender.approvalSpeed.replace(/_/g, " ")}) may not meet urgency requirement (${deal.urgency.replace(/_/g, " ")})`)
  }
  return warnings
}

export function matchLenders(lenders: Lender[], deal: DealProfile): DealMatchResult {
  const matches: LenderMatch[] = []

  for (const lender of lenders) {
    if (lender.status !== "active") continue

    const dealSize = scoreDealSize(lender, deal)
    const industry = scoreIndustry(lender, deal)
    const geography = scoreGeography(lender, deal)
    const risk = scoreRisk(lender, deal)
    const product = scoreProduct(lender, deal)
    const speedWarnings = speedWarning(lender, deal)

    const matchScore = dealSize.score + industry.score + geography.score + risk.score + product.score
    const disqualifiers = [
      ...dealSize.warnings.filter(w => w.includes("outside lender's range")),
      ...industry.warnings.filter(w => w.includes("avoided list")),
      ...geography.warnings.filter(w => w.includes("does not serve") || w.includes("restricted")),
      ...risk.warnings.filter(w => w.includes("below lender minimum")),
    ]

    if (disqualifiers.length > 0) continue // hard disqualifier

    const warnings = [
      ...dealSize.warnings,
      ...industry.warnings,
      ...geography.warnings,
      ...risk.warnings,
      ...product.warnings,
      ...speedWarnings,
    ]

    const reasons = [
      ...dealSize.reasons,
      ...industry.reasons,
      ...geography.reasons,
      ...risk.reasons,
      ...product.reasons,
    ]

    matches.push({
      lender,
      matchScore,
      dealSizeFit: dealSize.score,
      industryFit: industry.score,
      geographyFit: geography.score,
      riskFit: risk.score,
      productFit: product.score,
      matchReasons: reasons,
      warnings,
      disqualifiers: [],
    })
  }

  matches.sort((a, b) => b.matchScore - a.matchScore)

  return {
    dealProfile: deal,
    matches,
    totalLendersScored: lenders.filter(l => l.status === "active").length,
    generatedAt: new Date().toISOString(),
  }
}
