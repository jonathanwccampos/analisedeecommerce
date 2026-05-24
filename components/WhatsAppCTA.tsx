'use client'

import { useEffect, useState } from 'react'

type Props = {
  storeUrl: string
  score: number
  totalIssues: number
  revenueImpact?: { min: number; max: number }
}

export function WhatsAppCTA({ storeUrl, score, totalIssues, revenueImpact }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const message = encodeURIComponent(
    `Olá! Acabei de analisar minha loja ${storeUrl} e tirei ${score}/100 com ${totalIssues} problemas encontrados. Quero agendar a consultoria gratuita para resolver isso.`
  )
  const href = `https://wa.me/${whatsappNumber}?text=${message}`
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
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)',
          color: '#00e676', fontSize: '11px', fontWeight: 700,
          padding: '4px 14px', borderRadius: '100px', marginBottom: '20px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          🎁 Consultoria 100% gratuita
        </div>

        {hasRevenue ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '22px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px', lineHeight: 1.2 }}>
              Quer recuperar até{' '}
              <span style={{ color: '#00e676' }}>
                R$ {revenueImpact!.max.toLocaleString('pt-BR')}/mês?
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '28px', maxWidth: '420px', margin: '0 auto 28px', lineHeight: 1.5 }}>
              Em 30 minutos de consultoria gratuita, mapeamos exatamente o que está travando suas vendas e entregamos um plano de ação personalizado.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '22px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px', lineHeight: 1.2 }}>
              Quer resolver esses {totalIssues} problemas de uma vez?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px', lineHeight: 1.5 }}>
              Em 30 minutos de consultoria gratuita, priorizamos o que vai gerar mais resultado no seu caso.
            </p>
          </>
        )}

        <a
          href={href} target="_blank" rel="noopener noreferrer"
          style={{
            display: isMobile ? 'flex' : 'inline-flex',
            width: isMobile ? '100%' : 'auto',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: '#00e676', color: '#001a0e',
            fontWeight: 700, fontSize: '15px',
            padding: '16px 24px', borderRadius: '14px',
            textDecoration: 'none',
            boxShadow: '0 0 40px rgba(0,230,118,0.3)',
            fontFamily: 'var(--font-syne), sans-serif',
            transition: 'all 0.15s',
            boxSizing: 'border-box',
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#001a0e', flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Agendar consultoria gratuita
        </a>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px 16px' : '20px', marginTop: '18px', color: 'rgba(0,230,118,0.5)', fontSize: '12px' }}>
          <span>✓ Sem compromisso</span>
          <span>✓ 100% gratuito</span>
          <span>✓ Resposta em até 2h</span>
        </div>
      </div>
    </div>
  )
}
