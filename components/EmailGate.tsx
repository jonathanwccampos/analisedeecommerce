'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbqInited?: boolean
  }
}

type Props = {
  analysisId: string
  totalIssues: number
  onUnlock: () => void
}

export function EmailGate({ analysisId, totalIssues, onUnlock }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId, name, email, whatsapp: whatsapp || undefined }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) { setError(data.error ?? 'Erro ao salvar. Tente novamente.'); return }
      window.fbq?.('track', 'Lead', { content_name: 'Desbloqueio Relatorio' })
      window.fbq?.('trackCustom', 'DesbloqueioRelatorio')
      onUnlock()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '10px',
    background: '#162033', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', fontSize: '14px', outline: 'none',
    fontFamily: 'var(--font-sans), DM Sans, sans-serif',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0d1a2e 0%, #080f1e 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: isMobile ? '28px 16px' : '40px 32px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '200px', height: '2px',
        background: 'linear-gradient(90deg, transparent, #00e676, transparent)',
      }} />

      <div style={{
        width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 16px',
        background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
      }}>
        🔓
      </div>

      <h2 style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontSize: '22px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px', lineHeight: 1.2,
      }}>
        Veja exatamente o que está<br />custando suas vendas
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
        Encontramos <strong style={{ color: '#ff3366' }}>{totalIssues} problemas</strong> no seu e-commerce.
        {' '}Desbloqueie o relatório completo — é gratuito.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text" placeholder="Seu nome" value={name}
          onChange={e => setName(e.target.value)} required style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.4)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />
        <input
          type="email" placeholder="Seu melhor e-mail" value={email}
          onChange={e => setEmail(e.target.value)} required style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.4)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />

        {/* WhatsApp — highlighted as recommended */}
        <div style={{ position: 'relative' }}>
          <input
            type="tel"
            placeholder={isMobile ? 'WhatsApp (recomendado)' : 'WhatsApp — para receber o plano de ação'}
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            style={{ ...inputStyle, paddingRight: isMobile ? '16px' : '108px' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
          {!isMobile && (
            <div style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '10px', fontWeight: 700, color: '#00e676',
              background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.25)',
              padding: '2px 7px', borderRadius: '5px', whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}>
              recomendado
            </div>
          )}
        </div>

        {error && <p style={{ color: '#ff3366', fontSize: '13px', textAlign: 'left' }}>{error}</p>}

        <button
          type="submit" disabled={loading}
          style={{
            background: loading ? '#162033' : 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
            color: loading ? 'rgba(255,255,255,0.3)' : '#001a0e',
            border: 'none', borderRadius: '12px',
            padding: '15px 24px', fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-syne), sans-serif',
            boxShadow: !loading ? '0 0 30px rgba(0,230,118,0.2)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'Aguarde...' : 'Ver relatório completo →'}
        </button>

        {/* Trust signals */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
            🔒 Dados seguros
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
            📵 Sem spam, jamais
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
            ✅ Acesso imediato
          </span>
        </div>
      </form>
    </div>
  )
}
