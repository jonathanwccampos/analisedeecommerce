'use client'

import { useEffect, useMemo, useState, memo } from 'react'
import { useParams } from 'next/navigation'
import { ScoreGauge } from '@/components/ScoreGauge'
import { CategoryCard } from '@/components/CategoryCard'
import { RadarChart } from '@/components/RadarChart'
import { IssueItem } from '@/components/IssueItem'
import { EmailGate } from '@/components/EmailGate'
import { WhatsAppCTA } from '@/components/WhatsAppCTA'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { AnalysisResult, AnalysisResponse, CategoryName, AdAnalysis, StoreContext, TicketStrategy } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<CategoryName, string> = {
  performance: '⚡', seo: '🔍', mobile: '📱',
  conversion: '🛒', trust: '🔒', ux: '🧭',
}

const CATEGORY_DESCRIPTIONS: Record<CategoryName, string> = {
  performance: 'Quanto tempo sua loja demora para abrir — cada segundo a mais custa vendas',
  seo: 'Se sua loja aparece (ou some) quando alguém busca seus produtos no Google',
  mobile: 'Como sua loja funciona nos celulares — onde 73% das compras acontecem',
  conversion: 'Checklist de elementos que ajudam (ou travam) a decisão de compra',
  trust: 'O quanto sua loja passa credibilidade e segurança para o comprador',
  ux: 'Facilidade de navegar, encontrar produtos e chegar ao checkout',
}

const ROAS_CONFIG = {
  excelente: { color: '#00e676', bg: 'rgba(0,230,118,0.07)', label: 'Excelente', icon: '🚀' },
  bom:       { color: '#34d399', bg: 'rgba(52,211,153,0.07)',  label: 'Bom',       icon: '✅' },
  regular:   { color: '#ffb020', bg: 'rgba(255,176,32,0.07)',  label: 'Regular',   icon: '⚠️' },
  ruim:      { color: '#ff3366', bg: 'rgba(255,51,102,0.07)',  label: 'Abaixo do potencial', icon: '🔴' },
}

const FORMAT_ICONS: Record<string, string> = { video: '🎬', carrossel: '🖼️', imagem: '📸' }


// ─── Sub-components ───────────────────────────────────────────────────────────

const MaturityTrack = memo(function MaturityTrack({ score }: { score: number }) {
  const color = score <= 39 ? '#ff3366' : score <= 69 ? '#ffb020' : '#00e676'
  const label = score <= 39 ? 'Iniciante' : score <= 69 ? 'Em Crescimento' : 'Avançado'
  const position = Math.min(Math.max(score, 0), 100)

  return (
    <div style={{ marginTop: '24px', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>
        <span style={{ color: score <= 39 ? '#ff3366' : 'rgba(255,255,255,0.2)' }}>Iniciante</span>
        <span style={{ color: score > 39 && score <= 69 ? '#ffb020' : 'rgba(255,255,255,0.2)' }}>Em Crescimento</span>
        <span style={{ color: score > 69 ? '#00e676' : 'rgba(255,255,255,0.2)' }}>Avançado</span>
      </div>

      <div style={{ position: 'relative', height: '20px' }}>
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', height: '4px', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '40%', height: '100%', backgroundColor: score <= 39 ? '#ff3366' : 'rgba(255,51,102,0.15)' }} />
          <div style={{ width: '30%', height: '100%', backgroundColor: score > 39 && score <= 69 ? '#ffb020' : 'rgba(255,176,32,0.15)' }} />
          <div style={{ width: '30%', height: '100%', backgroundColor: score > 69 ? '#00e676' : 'rgba(0,230,118,0.15)' }} />
        </div>
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: `calc(${position}% - 10px)`,
          width: '20px', height: '20px', borderRadius: '50%',
          backgroundColor: color, border: '2px solid #080c14',
          boxShadow: `0 0 12px ${color}`,
          transition: 'left 1s ease',
          zIndex: 1,
        }} />
      </div>

      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block', fontSize: '11px', fontWeight: 700,
          padding: '3px 12px', borderRadius: '100px',
          color, backgroundColor: `${color}14`, border: `1px solid ${color}30`,
          fontFamily: 'var(--font-syne), sans-serif',
        }}>
          Nível atual: {label}
        </span>
      </div>
    </div>
  )
})

const RevenueImpactBanner = memo(function RevenueImpactBanner({ min, max }: { min: number; max: number }) {
  if (max === 0) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,51,102,0.12) 0%, rgba(255,51,102,0.05) 100%)',
      border: '1px solid rgba(255,51,102,0.25)',
      borderRadius: '16px', padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ fontSize: '28px', flexShrink: 0 }}>⚠️</div>
        <div>
          <p style={{ color: 'rgba(255,51,102,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Alerta Financeiro
          </p>
          <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px', marginBottom: '4px', fontFamily: 'var(--font-syne), sans-serif' }}>
            Sua loja está perdendo estimados
          </p>
          <p style={{ color: '#ff3366', fontWeight: 900, fontSize: 'clamp(24px, 5vw, 34px)', lineHeight: 1.1, fontFamily: 'var(--font-mono), monospace' }}>
            R$ {min.toLocaleString('pt-BR')} – R$ {max.toLocaleString('pt-BR')}
            <span style={{ fontSize: '18px', fontWeight: 700 }}>/mês</span>
          </p>
          <p style={{ color: 'rgba(255,51,102,0.6)', fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
            Baseado nos problemas técnicos encontrados e no impacto médio em e-commerces com perfil similar.
          </p>
        </div>
      </div>
    </div>
  )
})

const PrioritiesTeaser = memo(function PrioritiesTeaser({ priorities }: { priorities: AnalysisResult['topPriorities'] }) {
  if (priorities.length === 0) return null
  return (
    <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>🎯</span>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
          Top Prioridades Identificadas
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {priorities.map((issue, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(255,176,32,0.05)', border: '1px solid rgba(255,176,32,0.15)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: '#ffb020', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '12px', color: '#001a09',
              fontFamily: 'var(--font-syne), sans-serif',
            }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{issue.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.description}</p>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(255,51,102,0.15)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', flexShrink: 0 }}>
              CRÍTICO
            </span>
          </div>
        ))}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '14px', textAlign: 'center' }}>
        Desbloqueie o relatório completo para ver os detalhes e soluções de cada problema
      </p>
    </div>
  )
})

const TicketMedioSection = memo(function TicketMedioSection({ strategy }: { strategy?: TicketStrategy }) {
  if (!strategy) return null

  return (
    <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #120820 100%)', padding: '22px 24px', borderBottom: '1px solid rgba(138,43,226,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>💰</span>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '17px', fontWeight: 700, color: '#f1f5f9' }}>
            Como Aumentar seu Ticket Médio
          </h2>
        </div>
        <p style={{ color: 'rgba(168,85,247,0.7)', fontSize: '13px' }}>{strategy.goal}</p>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {strategy.tips.map((tip, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(138,43,226,0.06)', border: '1px solid rgba(138,43,226,0.15)' }}>
            <div style={{
              width: '26px', height: '26px', background: 'rgba(138,43,226,0.8)', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 900, color: '#f1f5f9', flexShrink: 0,
              fontFamily: 'var(--font-syne), sans-serif',
            }}>
              {idx + 1}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginBottom: '4px' }}>{tip.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: 1.55 }}>{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const AdFallbackSection = memo(function AdFallbackSection({ adSpend }: { adSpend?: string }) {
  if (!adSpend || adSpend === 'nenhum') return null
  const spendLabels: Record<string, string> = {
    'menos-1k': 'menos de R$ 1.000/mês', '1k-5k': 'R$ 1.000 – R$ 5.000/mês',
    '5k-20k': 'R$ 5.000 – R$ 20.000/mês', 'mais-20k': 'acima de R$ 20.000/mês',
  }
  const tips = [
    { tip: 'Velocidade da landing page', desc: 'Uma página que demora mais de 3s para abrir no mobile pode destruir até 50% do seu ROAS. Prioridade máxima.' },
    { tip: 'Coerência entre o anúncio e a página', desc: 'Se o anúncio promete "vestido azul floral", a landing deve mostrar exatamente isso above the fold.' },
    { tip: 'CTA e preço visíveis sem scroll', desc: 'O comprador que chegou pelo anúncio precisa ver o produto, o preço e o botão de compra sem precisar descer a página.' },
    { tip: 'Prova social acima do fold', desc: 'Avaliações de clientes, número de pedidos ou depoimentos visíveis na landing aumentam ROAS em até 25%.' },
    { tip: 'PIX e parcelamento em destaque', desc: '43% dos brasileiros preferem PIX. Se não estiver visível antes do checkout, você está perdendo conversões.' },
  ]

  return (
    <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #080f1e 100%)', padding: '22px 24px', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '17px', fontWeight: 700, color: '#f1f5f9' }}>
            Diagnóstico de Tráfego Pago
          </h2>
        </div>
        <p style={{ color: 'rgba(96,165,250,0.7)', fontSize: '13px' }}>
          Investimento declarado: {spendLabels[adSpend] ?? adSpend}
        </p>
      </div>
      <div style={{ padding: '24px' }}>
        <div style={{ background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,176,32,0.9)', fontSize: '13px', fontWeight: 500 }}>
            ⚡ Configure <code style={{ background: 'rgba(255,176,32,0.15)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono), monospace', fontSize: '12px' }}>GEMINI_API_KEY</code> para ativar análise detalhada de ROAS, criativos e audiência.
          </p>
        </div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
          Enquanto isso, verifique estes pontos críticos para o retorno dos seus anúncios:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tips.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <span style={{ color: 'rgba(96,165,250,0.7)', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{idx + 1}.</span>
              <div>
                <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{item.tip}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '3px', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const AdAnalysisSection = memo(function AdAnalysisSection({ ad }: { ad: AdAnalysis }) {
  const roasConf = ROAS_CONFIG[ad.roasAssessment]
  return (
    <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #080f1e 100%)', padding: '22px 24px', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '17px', fontWeight: 700, color: '#f1f5f9' }}>
            Diagnóstico de Tráfego Pago
          </h2>
        </div>
        <p style={{ color: 'rgba(96,165,250,0.6)', fontSize: '13px' }}>Análise de ROAS, criativos e estratégia de anúncios</p>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ROAS */}
        <div style={{ borderRadius: '12px', border: `1px solid ${roasConf.color}30`, backgroundColor: roasConf.bg, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: roasConf.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                MER Estimado (Faturamento / Investimento)
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: roasConf.color, fontFamily: 'var(--font-mono), monospace', lineHeight: 1 }}>
                  {ad.roas !== null ? `${ad.roas}x` : '—'}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', paddingBottom: '4px' }}>
                  vs benchmark {ad.roasBenchmark.min}x–{ad.roasBenchmark.max}x
                </span>
              </div>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: `${roasConf.color}18`, border: `1px solid ${roasConf.color}30`, color: roasConf.color, fontSize: '13px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{roasConf.icon}</span><span>{roasConf.label}</span>
            </div>
          </div>
          {ad.roasComment && (
            <p style={{ fontSize: '13px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${roasConf.color}20`, color: `${roasConf.color}cc` }}>
              {ad.roasComment}
            </p>
          )}
        </div>

        {/* Landing fixes */}
        {ad.adLandingFixes.length > 0 && (
          <div>
            <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎯</span> Melhorias na Landing Page para Aumentar ROAS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ad.adLandingFixes.map((fix, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900,
                    color: fix.priority === 'alta' ? '#ff3366' : '#ffb020',
                    background: fix.priority === 'alta' ? 'rgba(255,51,102,0.15)' : 'rgba(255,176,32,0.15)',
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{fix.title}</p>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', color: fix.priority === 'alta' ? '#ff3366' : '#ffb020', background: fix.priority === 'alta' ? 'rgba(255,51,102,0.15)' : 'rgba(255,176,32,0.15)' }}>
                        {fix.priority}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{fix.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creative ideas */}
        {ad.creativeIdeas.length > 0 && (
          <div>
            <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span> Ideias de Criativo para Anúncios
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
              {ad.creativeIdeas.map((idea, idx) => (
                <div key={idx} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{FORMAT_ICONS[idea.format] ?? '📸'}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(96,165,250,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{idea.format}</span>
                  </div>
                  <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{idea.concept}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: 1.5 }}>{idea.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience strategy */}
        {ad.audienceStrategy.length > 0 && (
          <div>
            <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> Estratégia de Audiência
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ad.audienceStrategy.map((strategy, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ color: 'rgba(96,165,250,0.5)', flexShrink: 0, marginTop: '1px' }}>→</span>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{strategy}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultPage() {
  const params = useParams()
  const id = params.id as string

  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [status, setStatus] = useState<'loading' | 'completed' | 'error' | 'expired'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [emailUnlocked, setEmailUnlocked] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')
  const [storeContext, setStoreContext] = useState<Partial<StoreContext>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const totalIssues = useMemo(
    () => result?.categories.reduce((sum, c) => sum + c.issues.length, 0) ?? 0,
    [result]
  )
  const criticalTotal = useMemo(
    () => result?.categories.reduce((sum, c) => sum + c.issues.filter(i => i.severity === 'critical').length, 0) ?? 0,
    [result]
  )

  useEffect(() => {
    if (localStorage.getItem(`unlocked_${id}`) === '1') setEmailUnlocked(true)
    try {
      const saved = localStorage.getItem(`analysis_${id}`)
      if (saved) {
        const parsed = JSON.parse(saved) as { url?: string; context?: Partial<StoreContext> }
        if (parsed.url) setStoreUrl(parsed.url)
        if (parsed.context) setStoreContext(parsed.context)
      }
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/analise/${id}`)
        const data = await res.json() as AnalysisResponse
        if (data.status === 'completed') { setResult(data.result); setStatus('completed') }
        else if (data.status === 'expired') { setStatus('expired') }
        else if (data.status === 'error') {
          setStatus('error')
          setErrorMsg('message' in data ? (data as { message: string }).message : 'Erro desconhecido')
        } else if (data.status === 'processing') {
          window.location.href = `/analisando/${id}`
        }
      } catch {
        setStatus('error')
        setErrorMsg('Erro ao carregar o relatório.')
      }
    }
    load()
  }, [id])

  function handleUnlock() { localStorage.setItem(`unlocked_${id}`, '1'); setEmailUnlocked(true) }

  const displayUrl = storeUrl || `#${id}`

  // ─── Loading states ────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono), monospace', fontSize: '14px' }}>Carregando relatório...</p>
        </div>
      </main>
    )
  }

  if (status === 'expired') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#080c14' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏰</div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>Esta análise expirou</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '24px', fontSize: '14px' }}>Os resultados ficam disponíveis por 7 dias. Faça uma nova análise gratuita.</p>
          <a href="/" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #00e676, #00c853)', color: '#001a09', fontWeight: 700, padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontFamily: 'var(--font-syne), sans-serif' }}>
            Fazer nova análise →
          </a>
        </div>
      </main>
    )
  }

  if (status === 'error' || !result) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#080c14' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>❌</div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>Erro ao carregar</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '24px', fontSize: '14px' }}>{errorMsg || 'Tente novamente em instantes.'}</p>
          <a href="/" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
            ← Voltar
          </a>
        </div>
      </main>
    )
  }

  // ─── Result ────────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
    <main style={{ minHeight: '100vh', background: '#080c14' }}>

      {/* Header bar */}
      <div style={{ background: '#0a0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}>
            ← Nova análise
          </a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono), monospace' }}>
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '16px 12px 64px' : '28px 16px 64px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Score Hero */}
        <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
          {(storeUrl || storeContext.niche) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '10px 14px', background: '#162033', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
              {storeUrl && (
                <>
                  <span>🌐</span>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'var(--font-mono), monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{storeUrl}</p>
                </>
              )}
              {storeContext.niche && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>{storeContext.niche}</span>}
              {storeContext.platform && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>{storeContext.platform}</span>}
            </div>
          )}

          <ScoreGauge score={result.overallScore} size="lg" />
          <MaturityTrack score={result.overallScore} />

          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            {[
              { value: totalIssues, label: 'problemas', color: 'rgba(255,255,255,0.75)' },
              { value: criticalTotal, label: 'críticos', color: '#ff3366' },
              { value: `${result.benchmark}%`, label: result.benchmark <= 50 ? 'abaixo do mercado' : 'acima do mercado', color: result.benchmark <= 50 ? '#ff3366' : '#00e676' },
            ].map((item, idx) => (
              <div key={idx} style={{ background: '#162033', borderRadius: '10px', padding: '14px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '26px', fontWeight: 700, color: item.color, lineHeight: 1, marginBottom: '4px' }}>{item.value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Impact */}
        <RevenueImpactBanner min={result.revenueImpact.min} max={result.revenueImpact.max} />

        {/* Category Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Diagnóstico por Pilar</h2>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>A = excelente · F = crítico</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px' }}>
            {result.categories.filter(cat => !cat.measurementFailed).map(cat => (
              <CategoryCard key={cat.category} category={cat} />
            ))}
          </div>
        </div>

        {/* Top Priorities Teaser */}
        {result.topPriorities.length > 0 && (
          <PrioritiesTeaser priorities={result.topPriorities} />
        )}

        {/* Email gate or full report */}
        {!emailUnlocked ? (
          <EmailGate analysisId={id} totalIssues={totalIssues} onUnlock={handleUnlock} />
        ) : (
          <>
            {/* Executive Summary */}
            {result.executiveSummary && (
              <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                  <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Sumário Executivo</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.executiveSummary.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.65 }}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Issues per Category */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
                Análise Detalhada por Pilar
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.categories.filter(cat => !cat.measurementFailed).map(cat => {
                  const color = cat.score <= 39 ? '#ff3366' : cat.score <= 69 ? '#ffb020' : '#00e676'
                  const issueCount = cat.issues.length
                  const hasCritical = cat.issues.some(i => i.severity === 'critical')

                  return (
                    <div key={cat.category} style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${color}` }}>
                        <span style={{ fontSize: '18px' }}>{CATEGORY_ICONS[cat.category]}</span>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>{CATEGORY_LABELS[cat.category]}</h3>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{CATEGORY_DESCRIPTIONS[cat.category]}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{cat.score}</span>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>/100</p>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div style={{ padding: '10px 20px', background: '#0a0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cat.score}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60`, transition: 'width 0.7s ease' }} />
                        </div>
                      </div>

                      {/* Issues */}
                      <div style={{ padding: '18px 20px' }}>
                        {issueCount === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '10px' }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <p style={{ color: 'rgba(0,230,118,0.8)', fontSize: '13px', fontWeight: 500 }}>
                              Nenhum problema crítico encontrado nesta área. Continue assim!
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {hasCritical && (
                              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>
                                {cat.issues.filter(i => i.severity === 'critical').length} problema{cat.issues.filter(i => i.severity === 'critical').length > 1 ? 's' : ''} crítico{cat.issues.filter(i => i.severity === 'critical').length > 1 ? 's' : ''} identificado{cat.issues.filter(i => i.severity === 'critical').length > 1 ? 's' : ''}
                              </p>
                            )}
                            {cat.issues.map((issue, idx) => (
                              <IssueItem key={idx} issue={issue} blurred={idx >= 2 && cat.issues.length >= 3} index={idx} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ticket médio */}
            <TicketMedioSection strategy={result.ticketStrategy} />

            {/* Ad Analysis */}
            {result.adAnalysis ? (
              <AdAnalysisSection ad={result.adAnalysis} />
            ) : (
              <AdFallbackSection adSpend={storeContext.adSpend} />
            )}

            {/* Action Plan */}
            {result.topPriorities.length > 0 && (
              <div style={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '18px' }}>🚀</span>
                  <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                    Plano de Ação Recomendado
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.topPriorities.map((issue, idx) => {
                    const accentColor = idx === 0 ? '#ff3366' : idx === 1 ? '#ffb020' : '#f59e0b'
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: '#001a09', fontFamily: 'var(--font-syne), sans-serif', boxShadow: `0 0 16px ${accentColor}50` }}>
                            {idx + 1}
                          </div>
                          {idx < result.topPriorities.length - 1 && (
                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.07)', margin: '6px auto 0' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{issue.title}</p>
                            <span style={{ fontSize: '10px', color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}30`, fontWeight: 700, padding: '2px 8px', borderRadius: '100px', flexShrink: 0 }}>
                              Prioridade {idx === 0 ? 'máxima' : idx === 1 ? 'alta' : 'média'}
                            </span>
                          </div>
                          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: 1.5 }}>{issue.description}</p>
                          {issue.cause && (
                            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', marginTop: '6px' }}>
                              <span style={{ fontWeight: 600 }}>Causa:</span> {issue.cause}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px' }}>
                  <p style={{ color: 'rgba(96,165,250,0.8)', fontSize: '13px', fontWeight: 500 }}>
                    💡 Resolver apenas essas 3 prioridades pode gerar um impacto significativo nas suas vendas nas próximas 4-8 semanas.
                  </p>
                </div>
              </div>
            )}

            <WhatsAppCTA storeUrl={displayUrl} score={result.overallScore} totalIssues={totalIssues} revenueImpact={result.revenueImpact} />
          </>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: '11px', fontFamily: 'var(--font-mono), monospace' }}>
          Relatório disponível por 7 dias · ID: {id}
        </p>
      </div>
    </main>
    </ErrorBoundary>
  )
}
