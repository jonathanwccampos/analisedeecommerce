'use client'

import { useParams } from 'next/navigation'
import { useAnalysis } from '@/lib/hooks/useAnalysis'

const CHECKS = [
  { key: 'performance', label: 'Medindo velocidade — 1s de atraso = 7% menos em conversão' },
  { key: 'seo', label: 'Verificando visibilidade no Google' },
  { key: 'mobile', label: 'Testando no celular — 73% do tráfego BR é mobile' },
  { key: 'conversion', label: 'Mapeando barreiras de compra' },
  { key: 'trust', label: 'Checando sinais de confiança e segurança' },
  { key: 'ux', label: 'Identificando pontos de abandono' },
  { key: 'gemini', label: 'IA inspecionando o design e CRO visual' },
]

export default function LoadingPage() {
  const params = useParams()
  const id = params.id as string

  const { checkedCount, elapsed, error } = useAnalysis(id, { totalSteps: CHECKS.length })
  const progress = Math.round((checkedCount / CHECKS.length) * 100)

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px',
      background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,230,118,0.07) 0%, transparent 60%), #080c14',
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ maxWidth: '460px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px',
            boxShadow: '0 0 32px rgba(0,230,118,0.15)',
          }}>
            🔍
          </div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: '22px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px',
          }}>
            Encontrando onde sua loja perde dinheiro
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            Auditoria completa em andamento — isso leva entre 15 e 30 segundos
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #00e676, #00c853)',
            borderRadius: '2px',
            transition: 'width 0.7s ease',
            boxShadow: '0 0 12px rgba(0,230,118,0.5)',
          }} />
        </div>

        {/* Checks list */}
        <div style={{
          background: '#0f1624', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {CHECKS.map((check, idx) => {
            const done = idx < checkedCount
            const active = idx === checkedCount
            return (
              <div
                key={check.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 20px',
                  borderBottom: idx < CHECKS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: active ? 'rgba(0,230,118,0.04)' : 'transparent',
                  opacity: done ? 0.45 : active ? 1 : 0.25,
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>
                  {done ? '✅' : active ? '⏳' : '○'}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: active ? '#00e676' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 600 : 400,
                  fontFamily: active ? 'var(--font-mono), monospace' : 'var(--font-sans), sans-serif',
                  transition: 'color 0.3s',
                }}>
                  {check.label}
                </span>
                {active && (
                  <div style={{
                    marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%',
                    background: '#00e676', boxShadow: '0 0 8px #00e676',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {elapsed > 5 && !error && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '16px', fontFamily: 'var(--font-mono), monospace' }}>
            {elapsed}s · Auditando {CHECKS.length} dimensões da sua loja...
          </p>
        )}

        {error && (
          <div style={{
            marginTop: '20px', background: 'rgba(255,51,102,0.08)',
            border: '1px solid rgba(255,51,102,0.2)', borderRadius: '14px',
            padding: '18px', textAlign: 'center',
          }}>
            <p style={{ color: '#ff3366', fontSize: '13px', marginBottom: '10px' }}>{error}</p>
            <a href="/" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,51,102,0.8)', textDecoration: 'underline' }}>
              ← Voltar e tentar novamente
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
