'use client'

import { useState, useEffect } from 'react'
import type { CategoryResult } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'

type Props = {
  category: CategoryResult
}

function scoreColor(s: number) {
  return s <= 39 ? '#ff3366' : s <= 69 ? '#ffb020' : '#00e676'
}

function getGrade(s: number): { letter: string; color: string } {
  if (s >= 85) return { letter: 'A', color: '#00e676' }
  if (s >= 70) return { letter: 'B', color: '#34d399' }
  if (s >= 55) return { letter: 'C', color: '#ffb020' }
  if (s >= 40) return { letter: 'D', color: '#fb923c' }
  return { letter: 'F', color: '#ff3366' }
}

const CATEGORY_ICONS: Record<string, string> = {
  performance: '⚡',
  seo: '🔍',
  mobile: '📱',
  conversion: '🛒',
  trust: '🔒',
  ux: '🧭',
}

const CATEGORY_SUBTITLES: Record<string, string> = {
  performance: 'Velocidade de carga',
  seo: 'Visibilidade no Google',
  mobile: 'Experiência no celular',
  conversion: 'Elementos de venda',
  trust: 'Credibilidade da loja',
  ux: 'Navegação e usabilidade',
}

// Semi-circle gauge constants
const R = 50
const SW = 8
const SVG_W = 132
const CY = 66
const CIRC = Math.PI * R  // ≈ 157.08

export function CategoryCard({ category }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const color = scoreColor(category.score)
  const grade = getGrade(category.score)
  const criticalCount = category.issues.filter(i => i.severity === 'critical').length
  const warningCount = category.issues.filter(i => i.severity === 'warning').length
  const dashoffset = CIRC * (1 - category.score / 100)

  return (
    <div style={{
      backgroundColor: '#0f1624',
      border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `3px solid ${color}`,
      borderRadius: '14px',
      padding: '18px 14px 14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      position: 'relative',
    }}>
      {/* Top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '56px',
        background: `linear-gradient(180deg, ${color}12 0%, transparent 100%)`,
        borderRadius: '14px 14px 0 0',
        pointerEvents: 'none',
      }} />

      {/* Grade badge */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px',
        width: '27px', height: '27px',
        background: `${grade.color}18`, border: `1px solid ${grade.color}35`,
        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '13px', color: grade.color,
        fontFamily: 'var(--font-syne), sans-serif',
        zIndex: 1,
      }}>
        {grade.letter}
      </div>

      {/* Semi-circle gauge + score */}
      <div style={{ position: 'relative', width: `${SVG_W}px`, height: '108px' }}>
        <svg
          width={SVG_W} height={SVG_W / 2 + 10}
          viewBox={`0 0 ${SVG_W} ${CY + 4}`}
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
        >
          {/* Track */}
          <path
            d={`M ${SVG_W / 2 - R} ${CY} A ${R} ${R} 0 0 1 ${SVG_W / 2 + R} ${CY}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={SW}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M ${SVG_W / 2 - R} ${CY} A ${R} ${R} 0 0 1 ${SVG_W / 2 + R} ${CY}`}
            fill="none"
            stroke={color}
            strokeWidth={SW}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={mounted ? dashoffset : CIRC}
            style={{
              filter: `drop-shadow(0 0 6px ${color}90)`,
              transition: 'stroke-dashoffset 1.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </svg>

        {/* Score text in the mouth of the gauge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '36px', fontWeight: 700, color, lineHeight: 1,
          }}>
            {category.score}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>/100</span>
        </div>
      </div>

      {/* Category label */}
      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px' }}>{CATEGORY_ICONS[category.category]}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>
            {CATEGORY_LABELS[category.category]}
          </span>
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '3px' }}>
          {CATEGORY_SUBTITLES[category.category]}
        </p>
      </div>

      {/* Issue badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {criticalCount > 0 && (
          <span style={{
            fontSize: '10px', color: '#ff3366',
            background: '#ff336614', border: '1px solid #ff336628',
            fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
          }}>
            {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
          </span>
        )}
        {warningCount > 0 && (
          <span style={{
            fontSize: '10px', color: '#ffb020',
            background: '#ffb02014', border: '1px solid #ffb02028',
            fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
          }}>
            {warningCount} alerta{warningCount > 1 ? 's' : ''}
          </span>
        )}
        {criticalCount === 0 && warningCount === 0 && (
          <span style={{
            fontSize: '10px', color: '#00e676',
            background: '#00e67614', border: '1px solid #00e67628',
            fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
          }}>
            ✓ Sem problemas
          </span>
        )}
      </div>
    </div>
  )
}
