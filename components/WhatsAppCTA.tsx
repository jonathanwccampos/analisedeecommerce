'use client'

import { useEffect, useState } from 'react'

type Props = {
  storeUrl: string
  score: number
  totalIssues: number
  revenueImpact?: { min: number; max: number }
}

export function WhatsAppCTA({ score, totalIssues, revenueImpact }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const hasRevenue = revenueImpact && revenueImpact.max > 0

  return (
    <div style={{
      background: 'linear-gradient(145deg, #00290f 0%, #001a09 100%)',
      border: '1px solid rgba(0,230,118,0.15)',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '160px', height: '2px',
        background: 'linear-gradient(90deg, transparent, #00e676, transparent)',
      }} />

      <div style={{ padding: isMobile ? '28px 16px' : '36px 28px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)',
          color: '#00e676', fontSize: '11px', fontWeight: 700,
          padding: '4px 14px', borderRadius: '100px', marginBottom: '20px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          📞 Próximo passo
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: 'var(--font-syne), sans-serif',
          fontSize: isMobile ? '20px' : '22px',
          fontWeight: 800, color: '#f1f5f9',
          marginBottom: '12px', lineHeight: 1.25,
        }}>
          Em breve, um especialista da{' '}
          <span style={{ color: '#00e676' }}>Seven Blue</span>{' '}
          vai entrar em contato com você
        </h2>

        {/* Body */}
        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: '14px',
          maxWidth: '440px', margin: '0 auto 28px', lineHeight: 1.6,
        }}>
          {hasRevenue
            ? `Sua análise já chegou até a nossa equipe. Um especialista vai revisar os ${totalIssues} problemas encontrados e apresentar um plano de ação personalizado para recuperar até R$ ${revenueImpact!.max.toLocaleString('pt-BR')}/mês — sem custo, sem compromisso.`
            : `Sua análise já chegou até a nossa equipe. Um especialista vai revisar os ${totalIssues} problemas encontrados e apresentar um plano de ação personalizado para a sua loja — sem custo, sem compromisso.`
          }
        </p>

        {/* What they'll get */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          maxWidth: '360px', margin: '0 auto 28px',
          textAlign: 'left',
        }}>
          {[
            'Uma leitura humana do seu diagnóstico',
            `Priorização do que resolve mais rápido no seu caso`,
            'Estratégia personalizada para o seu nicho e plataforma',
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.12)',
            }}>
              <span style={{ color: '#00e676', fontSize: '14px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>✓</span>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.45 }}>{item}</p>
            </div>
          ))}
        </div>

        {/* Score context pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,230,118,0.15)',
          borderRadius: '100px', padding: '10px 20px', marginBottom: '16px',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '22px', fontWeight: 900, lineHeight: 1,
            color: score <= 39 ? '#ff3366' : score <= 69 ? '#ffb020' : '#00e676',
          }}>
            {score}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: 500 }}>/100 — análise em revisão</span>
        </div>

        {/* Footer note */}
        <p style={{
          color: 'rgba(0,230,118,0.4)', fontSize: '12px', marginTop: '4px',
        }}>
          Fique de olho no seu WhatsApp e e-mail. A consultoria é gratuita.
        </p>
      </div>
    </div>
  )
}
