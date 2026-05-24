'use client'

import type { Issue } from '@/lib/types'

type Props = {
  issue: Issue
  blurred?: boolean
  index?: number
}

const SEVERITY_CONFIG = {
  critical: { label: 'CRÍTICO', color: '#ff3366', bg: 'rgba(255,51,102,0.05)', border: 'rgba(255,51,102,0.2)' },
  warning:  { label: 'ALERTA',  color: '#ffb020', bg: 'rgba(255,176,32,0.05)',  border: 'rgba(255,176,32,0.2)'  },
  ok:       { label: 'OK',      color: '#00e676', bg: 'rgba(0,230,118,0.05)',   border: 'rgba(0,230,118,0.2)'   },
}

export function IssueItem({ issue, blurred = false, index }: Props) {
  const cfg = SEVERITY_CONFIG[issue.severity]

  if (blurred) {
    return (
      <div style={{ position: 'relative', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', backgroundColor: '#0f1624' }}>
        <div style={{ padding: '14px 16px', filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '4px' }}>{issue.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{issue.description}</p>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(2px)', backgroundColor: 'rgba(8,12,20,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>🔒 Revelado na consultoria gratuita</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: '10px',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {index !== undefined && (
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 900,
            color: cfg.color, backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
          }}>
            {index + 1}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'inline-block', fontSize: '10px', fontWeight: 700,
            padding: '2px 8px', borderRadius: '100px', marginBottom: '6px',
            color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
            letterSpacing: '0.05em',
          }}>
            {cfg.label}
          </span>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginBottom: '4px' }}>{issue.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.55 }}>{issue.description}</p>
          {issue.cause && (
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontWeight: 600 }}>Causa:</span> {issue.cause}
            </p>
          )}
          {issue.metric && (
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', marginTop: '4px' }}>
              <span style={{ fontWeight: 600 }}>Medição:</span>{' '}
              <code style={{ backgroundColor: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono), monospace' }}>
                {issue.metric}
              </code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
