import { supabase } from '@/lib/supabase'
import { analyzePageSpeed } from './pagespeed'
import { analyzeSeo } from './seo'
import { analyzeMobile } from './mobile'
import { analyzeConversion } from './conversion'
import { analyzeTrust } from './trust'
import { analyzeUx } from './ux'
import { analyzeWithGemini } from './gemini'
import type { AnalysisResult, CategoryName, CategoryResult, Issue, StoreContext } from '@/lib/types'

const CATEGORY_WEIGHTS: Record<CategoryName, number> = {
  performance: 0.20,
  seo: 0.20,
  mobile: 0.15,
  conversion: 0.20,
  trust: 0.15,
  ux: 0.10,
}

// Financial impact per critical issue type (R$/month range)
const REVENUE_IMPACT: Record<string, { min: number; max: number }> = {
  lcp: { min: 2000, max: 5000 },
  mobile: { min: 1000, max: 3000 },
  https: { min: 500, max: 1500 },
  cwv: { min: 800, max: 2000 },
  seo: { min: 300, max: 800 },
}

function calcBenchmark(score: number): number {
  if (score <= 30) return 92
  if (score <= 40) return 83
  if (score <= 55) return 68
  if (score <= 69) return 45
  if (score <= 84) return 40 // "acima de 60%" means 40% below
  return 10
}

function calcRevenueImpact(categories: CategoryResult[]): { min: number; max: number } {
  let min = 0
  let max = 0

  const perfIssues = categories.find(c => c.category === 'performance')?.issues ?? []
  const mobileIssues = categories.find(c => c.category === 'mobile')?.issues ?? []
  const trustIssues = categories.find(c => c.category === 'trust')?.issues ?? []
  const seoIssues = categories.find(c => c.category === 'seo')?.issues ?? []

  const hasLcpIssue = perfIssues.some(i => i.title.includes('LCP') && i.severity === 'critical')
  const hasMobileIssue = mobileIssues.some(i => i.severity === 'critical')
  const hasHttpsIssue = trustIssues.some(i => i.title.includes('SSL') && i.severity === 'critical')
  const hasCwvIssue = perfIssues.some(i => i.severity === 'critical')
  const hasSeoIssue = seoIssues.some(i => i.severity === 'critical')

  if (hasLcpIssue || hasCwvIssue) { min += REVENUE_IMPACT.lcp.min; max += REVENUE_IMPACT.lcp.max }
  if (hasMobileIssue) { min += REVENUE_IMPACT.mobile.min; max += REVENUE_IMPACT.mobile.max }
  if (hasHttpsIssue) { min += REVENUE_IMPACT.https.min; max += REVENUE_IMPACT.https.max }
  if (hasCwvIssue && !hasLcpIssue) { min += REVENUE_IMPACT.cwv.min; max += REVENUE_IMPACT.cwv.max }
  if (hasSeoIssue) { min += REVENUE_IMPACT.seo.min; max += REVENUE_IMPACT.seo.max }

  return { min, max }
}

function selectTopPriorities(categories: CategoryResult[]): Issue[] {
  const allIssues = categories.flatMap(c =>
    c.issues.map(issue => ({ ...issue, _category: c.category }))
  )
  return allIssues
    .filter(i => i.severity === 'critical')
    .slice(0, 3)
}

export async function runAnalysis(analysisId: string, url: string, context: Partial<StoreContext> = {}): Promise<void> {
  const TIMEOUT_MS = 40000

  try {
    // Fetch HTML once, share with all services
    let html = ''
    try {
      const htmlRes = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EcommerceAnalyzer/1.0)' },
      })
      html = await htmlRes.text()
    } catch { /* services will handle empty html gracefully */ }

    // Run all 6 services in parallel with a global timeout
    const [pageSpeedResult, seoResult, mobileResult, conversionResult, trustResult, uxResult] =
      await Promise.race([
        Promise.all([
          analyzePageSpeed(url),
          analyzeSeo(url, html),
          analyzeMobile(url, html),
          analyzeConversion(url, html),
          analyzeTrust(url, html),
          analyzeUx(url, html),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout')), TIMEOUT_MS)
        ),
      ])

    const categories: CategoryResult[] = [
      pageSpeedResult.result,
      seoResult,
      mobileResult,
      conversionResult,
      trustResult,
      uxResult,
    ]

    // Preliminary score for Gemini context
    const prelimScore = Math.round(
      Object.entries(CATEGORY_WEIGHTS).reduce((sum, [cat, weight]) => {
        const catResult = categories.find(c => c.category === cat)
        return sum + (catResult?.score ?? 0) * weight
      }, 0)
    )

    // Gemini analysis (runs after all 6 services)
    const { visualIssues, executiveSummary, adAnalysis, correctedCategories } = await analyzeWithGemini(
      pageSpeedResult.screenshot,
      categories,
      url,
      context,
      prelimScore,
    )

    const finalCategories = correctedCategories || categories

    // Append visual issues to the conversion category
    if (visualIssues.length > 0) {
      const convIdx = finalCategories.findIndex(c => c.category === 'conversion')
      if (convIdx !== -1) {
        finalCategories[convIdx] = {
          ...finalCategories[convIdx],
          issues: [...finalCategories[convIdx].issues, ...visualIssues],
        }
      }
    }

    // Calculate overall score
    const overallScore = Math.round(
      Object.entries(CATEGORY_WEIGHTS).reduce((sum, [cat, weight]) => {
        const catResult = finalCategories.find(c => c.category === cat)
        return sum + (catResult?.score ?? 0) * weight
      }, 0)
    )

    const classification = overallScore <= 39 ? 'critical' : overallScore <= 69 ? 'warning' : 'good'
    const benchmark = calcBenchmark(overallScore)
    const revenueImpact = calcRevenueImpact(finalCategories)
    const topPriorities = selectTopPriorities(finalCategories)

    const result: AnalysisResult = {
      overallScore,
      classification,
      benchmark,
      revenueImpact,
      executiveSummary,
      categories: finalCategories,
      topPriorities,
    }

    // Save results to Supabase
    await Promise.all([
      supabase.from('analyses').update({
        status: 'completed',
        overall_score: overallScore,
      }).eq('id', analysisId),
      ...finalCategories.map(cat =>
        supabase.from('analysis_results').insert({
          analysis_id: analysisId,
          category: cat.category,
          score: cat.score,
          issues: cat.issues,
        })
      ),
      supabase.from('analysis_results').insert({
        analysis_id: analysisId,
        category: '_meta',
        score: overallScore,
        issues: [
          {
            title: '_benchmark',
            description: String(benchmark),
            severity: 'ok',
            cause: '',
          },
          {
            title: '_revenue_min',
            description: String(revenueImpact.min),
            severity: 'ok',
            cause: '',
          },
          {
            title: '_revenue_max',
            description: String(revenueImpact.max),
            severity: 'ok',
            cause: '',
          },
          {
            title: '_executive_summary',
            description: executiveSummary,
            severity: 'ok',
            cause: '',
          },
          {
            title: '_classification',
            description: classification,
            severity: 'ok',
            cause: '',
          },
          ...(adAnalysis ? [{
            title: '_ad_analysis',
            description: JSON.stringify(adAnalysis),
            severity: 'ok' as const,
            cause: '',
          }] : []),
          ...topPriorities.map((p, i) => ({
            title: `_priority_${i}`,
            description: JSON.stringify(p),
            severity: 'ok' as const,
            cause: '',
          })),
        ],
      }),
    ])
  } catch (err) {
    await supabase.from('analyses').update({ status: 'error' }).eq('id', analysisId)
    console.error('Analysis failed:', err)
  }
}
