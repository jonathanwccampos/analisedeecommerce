'use client'

type Props = {
  score: number
  size?: 'sm' | 'lg'
}

const MATURITY = [
  { max: 39, label: 'Iniciante', sublabel: 'Sua loja precisa de atenção nos fundamentos', color: '#ff3366', glow: 'rgba(255,51,102,0.25)' },
  { max: 69, label: 'Em Crescimento', sublabel: 'Boa base, mas há perdas significativas acontecendo', color: '#ffb020', glow: 'rgba(255,176,32,0.25)' },
  { max: 100, label: 'Avançado', sublabel: 'Loja saudável, foco em otimização fina', color: '#00e676', glow: 'rgba(0,230,118,0.25)' },
]

function getMaturity(score: number) {
  return MATURITY.find(m => score <= m.max) ?? MATURITY[2]
}

export function ScoreGauge({ score, size = 'lg' }: Props) {
  const { label, sublabel, color, glow } = getMaturity(score)
  const isLg = size === 'lg'

  const radius = isLg ? 72 : 40
  const stroke = isLg ? 9 : 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const svgSize = (radius + stroke) * 2 + 12

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative' }}>
        {isLg && (
          <div style={{
            position: 'absolute', inset: '-12px',
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
        )}
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
          />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontWeight: 700, color,
            fontSize: isLg ? '46px' : '22px',
            lineHeight: 1,
          }}>
            {score}
          </span>
          {isLg && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>/100</span>
          )}
        </div>
      </div>

      {isLg && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 16px', borderRadius: '100px',
            fontSize: '13px', fontWeight: 700, marginBottom: '6px',
            color, backgroundColor: `${color}14`, border: `1px solid ${color}30`,
            fontFamily: 'var(--font-syne), sans-serif',
          }}>
            {label}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', maxWidth: '260px' }}>{sublabel}</p>
        </div>
      )}
    </div>
  )
}
