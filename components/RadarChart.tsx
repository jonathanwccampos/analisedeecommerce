'use client'

import { memo } from 'react'
import type { CategoryResult } from '@/lib/types'

const CATEGORY_ORDER = ['performance', 'seo', 'mobile', 'conversion', 'trust', 'ux'] as const

const LABELS: Record<string, string> = {
  performance: 'Velocidade',
  seo: 'SEO',
  mobile: 'Mobile',
  conversion: 'Conversão',
  trust: 'Confiança',
  ux: 'UX',
}

type Props = { categories: CategoryResult[] }

export const RadarChart = memo(function RadarChart({ categories }: Props) {
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const maxR = 78
  const labelR = maxR + 32
  const n = 6
  const step = (2 * Math.PI) / n
  const start = -Math.PI / 2

  function pt(i: number, r: number) {
    return {
      x: cx + r * Math.cos(start + i * step),
      y: cy + r * Math.sin(start + i * step),
    }
  }

  const scoreMap = Object.fromEntries(categories.map(c => [c.category, c.score]))
  const avgScore = categories.reduce((s, c) => s + c.score, 0) / Math.max(categories.length, 1)
  const fillColor = avgScore <= 39 ? '#ff3366' : avgScore <= 69 ? '#ffb020' : '#00e676'

  const dataPts = CATEGORY_ORDER.map((cat, i) => pt(i, ((scoreMap[cat] ?? 0) / 100) * maxR))
  const dataPoly = dataPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Grid rings */}
        {[25, 50, 75, 100].map(lvl => {
          const r = (lvl / 100) * maxR
          const pts = Array.from({ length: n }, (_, i) => pt(i, r)).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
          return (
            <polygon
              key={lvl} points={pts}
              fill="none"
              stroke={lvl === 100 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}
              strokeWidth="1"
            />
          )
        })}

        {/* Axes */}
        {CATEGORY_ORDER.map((_, i) => {
          const end = pt(i, maxR)
          return (
            <line key={i}
              x1={cx.toFixed(1)} y1={cy.toFixed(1)}
              x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1"
            />
          )
        })}

        {/* Data fill */}
        <polygon
          points={dataPoly}
          fill={`${fillColor}16`}
          stroke={fillColor}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 10px ${fillColor}50)` }}
        />

        {/* Dots */}
        {dataPts.map((p, i) => {
          const s = scoreMap[CATEGORY_ORDER[i]] ?? 0
          const c = s <= 39 ? '#ff3366' : s <= 69 ? '#ffb020' : '#00e676'
          return (
            <circle key={i}
              cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4.5"
              fill={c} stroke="#080c14" strokeWidth="2"
              style={{ filter: `drop-shadow(0 0 5px ${c})` }}
            />
          )
        })}

        {/* Labels */}
        {CATEGORY_ORDER.map((cat, i) => {
          const lp = pt(i, labelR)
          const s = scoreMap[cat] ?? 0
          const c = s <= 39 ? '#ff3366' : s <= 69 ? '#ffb020' : '#00e676'
          const anchor = lp.x < cx - 8 ? 'end' : lp.x > cx + 8 ? 'start' : 'middle'
          return (
            <g key={i}>
              <text
                x={lp.x.toFixed(1)} y={(lp.y - 7).toFixed(1)}
                textAnchor={anchor} fontSize="9.5"
                fill="rgba(255,255,255,0.38)"
                fontFamily="DM Sans, system-ui, sans-serif"
              >
                {LABELS[cat]}
              </text>
              <text
                x={lp.x.toFixed(1)} y={(lp.y + 7).toFixed(1)}
                textAnchor={anchor} fontSize="11"
                fill={c} fontWeight="700"
                fontFamily="Space Mono, monospace"
              >
                {s}
              </text>
            </g>
          )
        })}
      </svg>

      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Perfil da loja
      </p>
    </div>
  )
})
