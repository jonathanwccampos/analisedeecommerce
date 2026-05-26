'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreNiche, StorePlatform, AdSpend, MonthlyRevenue, AverageTicket, StoreContext } from '@/lib/types'

const NICHES: { value: StoreNiche; label: string; emoji: string }[] = [
  { value: 'moda', label: 'Moda & Vestuário', emoji: '👗' },
  { value: 'fitness', label: 'Fitness & Suplementos', emoji: '💪' },
  { value: 'beleza', label: 'Beleza & Cosméticos', emoji: '💄' },
  { value: 'eletronicos', label: 'Eletrônicos & Tech', emoji: '📱' },
  { value: 'alimentos', label: 'Alimentos & Bebidas', emoji: '🍎' },
  { value: 'casa', label: 'Casa & Decoração', emoji: '🏠' },
  { value: 'infantil', label: 'Produtos Infantis', emoji: '🧸' },
  { value: 'esportes', label: 'Esportes & Aventura', emoji: '⚽' },
  { value: 'pets', label: 'Pets', emoji: '🐾' },
  { value: 'outro', label: 'Outro segmento', emoji: '🛍️' },
]

const PLATFORMS: { value: StorePlatform; label: string }[] = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'nuvemshop', label: 'Nuvemshop' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'vtex', label: 'VTEX' },
  { value: 'tray', label: 'Tray' },
  { value: 'outro', label: 'Outra / Personalizada' },
]

const AD_SPENDS: { value: AdSpend; label: string }[] = [
  { value: 'nenhum', label: 'Não invisto em anúncios' },
  { value: 'menos-1k', label: 'Menos de R$ 1.000/mês' },
  { value: '1k-5k', label: 'R$ 1.000 – R$ 5.000/mês' },
  { value: '5k-20k', label: 'R$ 5.000 – R$ 20.000/mês' },
  { value: 'mais-20k', label: 'Acima de R$ 20.000/mês' },
]

const REVENUES: { value: MonthlyRevenue; label: string }[] = [
  { value: 'menos-10k', label: 'Menos de R$ 10.000/mês' },
  { value: '10k-50k', label: 'R$ 10.000 – R$ 50.000/mês' },
  { value: '50k-200k', label: 'R$ 50.000 – R$ 200.000/mês' },
  { value: 'mais-200k', label: 'Acima de R$ 200.000/mês' },
]

const TICKETS: { value: AverageTicket; label: string; hint: string }[] = [
  { value: 'menos-100', label: 'Menos de R$ 100', hint: 'Compra por impulso' },
  { value: '100-250', label: 'R$ 100 – R$ 250', hint: 'Compra consciente' },
  { value: '250-500', label: 'R$ 250 – R$ 500', hint: 'Compra planejada' },
  { value: 'mais-500', label: 'Acima de R$ 500', hint: 'Alto valor' },
]

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    // rejeita hostnames sem ponto, ex: "teste", "localhost"
    return url.hostname.includes('.')
  } catch { return false }
}

type Step = 'niche' | 'platform' | 'adspend' | 'revenue' | 'ticket' | 'url'
const STEPS: Step[] = ['niche', 'platform', 'adspend', 'revenue', 'ticket', 'url']

export default function LandingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('niche')
  const [context, setContext] = useState<Partial<StoreContext>>({})
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const stepIndex = STEPS.indexOf(step)

  function selectNiche(value: StoreNiche) { setContext(c => ({ ...c, niche: value })); setStep('platform') }
  function selectPlatform(value: StorePlatform) { setContext(c => ({ ...c, platform: value })); setStep('adspend') }
  function selectAdSpend(value: AdSpend) { setContext(c => ({ ...c, adSpend: value })); setStep('revenue') }
  function selectRevenue(value: MonthlyRevenue) { setContext(c => ({ ...c, monthlyRevenue: value })); setStep('ticket') }
  function selectTicket(value: AverageTicket) { setContext(c => ({ ...c, averageTicket: value })); setStep('url') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const normalizedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
    if (!isValidUrl(normalizedUrl)) { setError('Informe uma URL válida, ex: https://sujaloja.com.br'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, context }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok || !data.id) { setError(data.error ?? 'Erro ao iniciar análise. Tente novamente.'); setLoading(false); return }
      localStorage.setItem(`analysis_${data.id}`, JSON.stringify({ url: normalizedUrl, context }))
      router.push(`/analisando/${data.id}`)
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  const backButton = (target: Step) => (
    <button
      onClick={() => setStep(target)}
      style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-sans), DM Sans, sans-serif' }}
    >
      ← Voltar
    </button>
  )

  const optionStyle = {
    base: {
      padding: '13px 16px', borderRadius: '10px',
      background: '#162033', border: '1px solid rgba(255,255,255,0.07)',
      color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 500,
      textAlign: 'left' as const, cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
      width: '100%', fontFamily: 'var(--font-sans), DM Sans, sans-serif',
    },
    hover: { background: '#1e2d45', borderColor: 'rgba(0,230,118,0.35)', color: '#f1f5f9' },
  }

  function addHover(el: HTMLButtonElement | null) {
    if (!el) return
    el.addEventListener('mouseenter', () => { el.style.background = '#1e2d45'; el.style.borderColor = 'rgba(0,230,118,0.35)'; el.style.color = '#f1f5f9' })
    el.addEventListener('mouseleave', () => { el.style.background = '#162033'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.65)' })
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 14px 32px' : '48px 16px',
      background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,230,118,0.08) 0%, transparent 65%), #080c14',
      position: 'relative',
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ maxWidth: '580px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
            color: '#00e676', fontSize: '11px', fontWeight: 700,
            padding: '5px 14px', borderRadius: '100px', marginBottom: '20px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <span style={{ width: '6px', height: '6px', background: '#00e676', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #00e676' }} />
            Diagnóstico de Receita · Gratuito
          </div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: 'clamp(26px, 6vw, 46px)', fontWeight: 800,
            lineHeight: 1.1, color: '#f1f5f9', marginBottom: '14px',
          }}>
            Descubra o que está{' '}
            <span style={{ color: '#ff3366' }}>custando vendas</span>{' '}
            no seu e-commerce
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.6 }}>
            {STEPS.length - 1} perguntas rápidas. Diagnóstico técnico real — personalizado para o seu nicho e faturamento.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '22px' }}>
          {STEPS.map((s, idx) => (
            <div key={s} style={{
              width: idx === stepIndex ? '28px' : '8px', height: '8px', borderRadius: '4px',
              backgroundColor: idx < stepIndex ? '#00e676' : idx === stepIndex ? '#00e676' : 'rgba(255,255,255,0.1)',
              boxShadow: idx === stepIndex ? '0 0 8px rgba(0,230,118,0.6)' : 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#0f1624',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: isMobile ? '22px 16px' : '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>

          {step === 'niche' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Qual é o nicho da sua loja?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Cada nicho tem benchmarks diferentes de conversão, abandono e ROAS — o diagnóstico vai comparar sua loja com os líderes do seu segmento
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                {NICHES.map(n => (
                  <button key={n.value} ref={addHover} onClick={() => selectNiche(n.value)}
                    style={{ ...optionStyle.base, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px' }}>{n.emoji}</span>
                    <span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'platform' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Qual plataforma você usa?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Shopify, Nuvemshop, VTEX — cada uma tem falhas típicas que o diagnóstico vai checar especificamente
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                {PLATFORMS.map(p => (
                  <button key={p.value} ref={addHover} onClick={() => selectPlatform(p.value)} style={optionStyle.base}>
                    {p.label}
                  </button>
                ))}
              </div>
              {backButton('niche')}
            </div>
          )}

          {step === 'adspend' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Quanto você investe em anúncios por mês?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Sites com problemas técnicos desperdiçam em média 30–50% da verba de anúncios — vamos calcular o quanto você está perdendo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AD_SPENDS.map(a => (
                  <button key={a.value} ref={addHover} onClick={() => selectAdSpend(a.value)} style={optionStyle.base}>
                    {a.label}
                  </button>
                ))}
              </div>
              {backButton('platform')}
            </div>
          )}

          {step === 'revenue' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Qual é o faturamento mensal aproximado?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Confidencial — usado para estimar o valor em reais que está sendo perdido por problemas no site
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REVENUES.map(r => (
                  <button key={r.value} ref={addHover} onClick={() => selectRevenue(r.value)} style={optionStyle.base}>
                    {r.label}
                  </button>
                ))}
              </div>
              {backButton('adspend')}
            </div>
          )}

          {step === 'ticket' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Qual é o ticket médio das suas vendas?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Com ticket alto, cada venda perdida por abandono de carrinho dói mais — vamos identificar exatamente onde isso acontece
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TICKETS.map(t => (
                  <button key={t.value} ref={addHover} onClick={() => selectTicket(t.value)}
                    style={{ ...optionStyle.base, justifyContent: 'space-between' }}>
                    <span>{t.label}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>{t.hint}</span>
                  </button>
                ))}
              </div>
              {backButton('revenue')}
            </div>
          )}

          {step === 'url' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '19px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                Qual é a URL da sua loja?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', marginBottom: '20px' }}>
                Nossa IA vai auditar performance, SEO, mobile, conversão, confiança e UX — resultado em até 30 segundos
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text" placeholder="https://sujaloja.com.br" value={url}
                  onChange={e => setUrl(e.target.value)} disabled={loading} autoFocus
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: '12px',
                    background: '#162033', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9', fontSize: '14px', outline: 'none',
                    fontFamily: 'var(--font-mono), Space Mono, monospace',
                    opacity: loading ? 0.6 : 1, boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                />
                {error && <p style={{ color: '#ff3366', fontSize: '13px' }}>{error}</p>}
                <button
                  type="submit" disabled={loading || !url.trim()}
                  style={{
                    background: loading || !url.trim()
                      ? '#162033'
                      : 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                    color: loading || !url.trim() ? 'rgba(255,255,255,0.25)' : '#001a0e',
                    border: 'none', borderRadius: '12px',
                    padding: '15px 24px', fontSize: '15px', fontWeight: 700,
                    cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-syne), sans-serif',
                    boxShadow: !loading && url.trim() ? '0 0 32px rgba(0,230,118,0.22)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {loading ? 'Iniciando análise...' : 'Analisar agora →'}
                </button>
              </form>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {context.niche && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>{NICHES.find(n => n.value === context.niche)?.label}</span>}
                {context.platform && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>{PLATFORMS.find(p => p.value === context.platform)?.label}</span>}
                {context.adSpend && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>{AD_SPENDS.find(a => a.value === context.adSpend)?.label}</span>}
                {context.monthlyRevenue && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>{REVENUES.find(r => r.value === context.monthlyRevenue)?.label}</span>}
                {context.averageTicket && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>Ticket: {TICKETS.find(t => t.value === context.averageTicket)?.label}</span>}
              </div>
              {backButton('ticket')}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '12px', marginTop: '20px' }}>
          🔒 100% gratuito · Sem cadastro · Resultado personalizado em até 30 segundos
        </p>
      </div>
    </main>
  )
}
