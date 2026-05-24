import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { AnalysisResult, AdAnalysis, TicketStrategy, CategoryName, CategoryResult, Issue } from '@/lib/types'

export const dynamic = 'force-dynamic'

function parseMetaResults(metaIssues: Issue[]): Partial<AnalysisResult> {
  const get = (title: string) => metaIssues.find(i => i.title === title)?.description ?? ''

  const topPriorities: Issue[] = []
  for (let i = 0; i < 3; i++) {
    const raw = get(`_priority_${i}`)
    if (raw) {
      try { topPriorities.push(JSON.parse(raw) as Issue) } catch { /* skip */ }
    }
  }

  let adAnalysis: AdAnalysis | undefined
  const rawAdAnalysis = get('_ad_analysis')
  if (rawAdAnalysis) {
    try { adAnalysis = JSON.parse(rawAdAnalysis) as AdAnalysis } catch { /* skip */ }
  }

  let ticketStrategy: TicketStrategy | undefined
  const rawTicket = get('_ticket_strategy')
  if (rawTicket) {
    try { ticketStrategy = JSON.parse(rawTicket) as TicketStrategy } catch { /* skip */ }
  }

  return {
    benchmark: Number(get('_benchmark')) || 50,
    revenueImpact: {
      min: Number(get('_revenue_min')) || 0,
      max: Number(get('_revenue_max')) || 0,
    },
    executiveSummary: get('_executive_summary'),
    classification: (get('_classification') as AnalysisResult['classification']) || 'warning',
    topPriorities,
    adAnalysis,
    ticketStrategy,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !analysis) {
    return NextResponse.json({ status: 'error', message: 'Análise não encontrada' }, { status: 404 })
  }

  if (new Date(analysis.expires_at) < new Date()) {
    return NextResponse.json({ status: 'expired' })
  }

  if (analysis.status === 'error') {
    return NextResponse.json({ status: 'error', message: 'A análise falhou. Tente novamente.' })
  }

  if (analysis.status === 'processing') {
    return NextResponse.json({
      status: 'processing',
      progress: [
        { category: 'performance', label: 'Verificando velocidade', done: false },
        { category: 'seo', label: 'Analisando SEO', done: false },
        { category: 'mobile', label: 'Testando mobile', done: false },
        { category: 'conversion', label: 'Avaliando conversão', done: false },
        { category: 'trust', label: 'Verificando confiança', done: false },
        { category: 'ux', label: 'Analisando UX', done: false },
        { category: 'gemini', label: 'IA analisando visualmente', done: false },
      ],
    })
  }

  // Fetch category results
  const { data: results } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('analysis_id', id)

  if (!results) {
    return NextResponse.json({ status: 'error', message: 'Resultados não encontrados' })
  }

  const categoryNames: CategoryName[] = ['performance', 'seo', 'mobile', 'conversion', 'trust', 'ux']
  const categories: CategoryResult[] = categoryNames
    .map(cat => results.find(r => r.category === cat))
    .filter(Boolean)
    .map(r => ({ category: r!.category as CategoryName, score: r!.score, issues: r!.issues as Issue[] }))

  const meta = results.find(r => r.category === '_meta')
  const metaParsed = meta ? parseMetaResults(meta.issues as Issue[]) : {}

  const result: AnalysisResult = {
    overallScore: analysis.overall_score ?? 0,
    classification: metaParsed.classification ?? 'warning',
    benchmark: metaParsed.benchmark ?? 50,
    revenueImpact: metaParsed.revenueImpact ?? { min: 0, max: 0 },
    executiveSummary: metaParsed.executiveSummary ?? '',
    categories,
    topPriorities: metaParsed.topPriorities ?? [],
    adAnalysis: metaParsed.adAnalysis,
    ticketStrategy: metaParsed.ticketStrategy,
  }

  return NextResponse.json({ status: 'completed', result })
}
