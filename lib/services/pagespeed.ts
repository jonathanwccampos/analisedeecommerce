import type { CategoryResult, Issue } from '@/lib/types'

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

interface PageSpeedResult {
  score: number
  lcp: number
  inp: number
  cls: number
  fcp: number
  ttfb: number
  screenshot?: string
}

export async function analyzePageSpeed(url: string): Promise<{ result: CategoryResult; screenshot?: string }> {
  const params = new URLSearchParams({ url, strategy: 'desktop', category: 'performance' })
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
  if (apiKey) params.set('key', apiKey)

  let data: Record<string, unknown>
  try {
    const res = await fetch(`${PAGESPEED_API}?${params}`, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`PageSpeed HTTP ${res.status}`)
    data = await res.json() as Record<string, unknown>
  } catch (err) {
    console.warn('PageSpeed API indisponível, usando fallback:', err)
    return {
      result: {
        category: 'performance',
        score: 50,
        issues: [],
        measurementFailed: true,
      },
      screenshot: undefined,
    }
  }

  type LH = Record<string, Record<string, unknown>>
  const lr = data.lighthouseResult as LH | undefined
  const categories = lr?.categories as Record<string, { score: number }> | undefined
  const audits = lr?.audits as Record<string, unknown> | undefined
  const metricsAudit = audits?.metrics as { details?: { items?: Record<string, number>[] } } | undefined
  const metrics = metricsAudit?.details?.items?.[0] ?? {}

  const score = Math.round((categories?.performance?.score ?? 0) * 100)
  const lcp = (metrics.largestContentfulPaint ?? 0) / 1000
  const inp = (metrics.interactive ?? 0) / 1000
  const cls = metrics.cumulativeLayoutShift ?? 0
  const fcp = (metrics.firstContentfulPaint ?? 0) / 1000
  const ttfb = (metrics.timeToFirstByte ?? 0) / 1000

  const screenshotAudit = audits?.['final-screenshot'] as { details?: { data?: string } } | undefined
  const screenshot = screenshotAudit?.details?.data

  const issues: Issue[] = []

  if (lcp > 2.5) {
    issues.push({
      title: lcp > 4
        ? 'Produto principal demora mais de 4 segundos para aparecer — perda grave de vendas'
        : 'Produto principal demora para aparecer na tela',
      description: lcp > 4
        ? `Sua loja leva ${lcp.toFixed(1)} segundos para mostrar o conteúdo principal. O Google registrou que 53% dos visitantes abandonam páginas que demoram mais de 3 segundos. Você está perdendo mais da metade dos cliques dos seus anúncios antes de mostrar um único produto.`
        : `O conteúdo principal da sua loja leva ${lcp.toFixed(1)} segundos para aparecer. O ideal é menos de 2,5 segundos. Cada segundo a mais reduz conversões em cerca de 7%.`,
      severity: lcp > 4 ? 'critical' : 'warning',
      cause: 'Imagens pesadas, hospedagem lenta ou scripts atrasando o carregamento',
      metric: `${lcp.toFixed(1)}s para carregar — ideal: menos de 2,5s`,
    })
  }

  if (fcp > 1.8) {
    issues.push({
      title: 'Tela em branco por muito tempo — visitante vê nada ao entrar na loja',
      description: `Sua loja leva ${fcp.toFixed(1)} segundos até mostrar qualquer conteúdo na tela. Isso é a "tela em branco" que faz o visitante achar que o site está fora do ar e fechar a aba.`,
      severity: fcp > 3 ? 'critical' : 'warning',
      cause: 'Scripts e estilos carregando antes do conteúdo visível',
      metric: `${fcp.toFixed(1)}s para primeiro conteúdo — ideal: menos de 1,8s`,
    })
  }

  if (ttfb > 0.8) {
    issues.push({
      title: 'Hospedagem respondendo devagar — atrasa tudo na sua loja',
      description: `Seu servidor demora ${(ttfb * 1000).toFixed(0)}ms para começar a responder. Uma hospedagem lenta atrasa toda a experiência do cliente, aumenta o custo por clique nos anúncios e prejudica seu posicionamento no Google.`,
      severity: ttfb > 1.8 ? 'critical' : 'warning',
      cause: 'Hospedagem compartilhada lenta, ausência de cache ou servidor distante dos visitantes',
      metric: `${ttfb.toFixed(2)}s de resposta do servidor — ideal: menos de 0,8s`,
    })
  }

  if (cls > 0.1) {
    issues.push({
      title: 'Botões e produtos se movem enquanto a página carrega',
      description: 'Elementos da sua loja pulam de posição enquanto carregam — isso faz o cliente clicar no lugar errado (geralmente o botão de compra se move na hora exata do clique). Além de frustrante, prejudica sua nota no Google.',
      severity: cls > 0.25 ? 'critical' : 'warning',
      cause: 'Imagens sem tamanho definido, banners ou fontes carregando após o layout',
      metric: `Instabilidade visual: ${cls.toFixed(3)} — ideal: menos de 0,1`,
    })
  }

  if (score < 50 && issues.length === 0) {
    issues.push({
      title: 'Velocidade geral da loja abaixo do mínimo aceitável',
      description: 'Sua loja está lenta de forma geral. Uma loja lenta afeta diretamente o custo dos seus anúncios (Google penaliza sites lentos com CPC mais alto) e o ranqueamento orgânico.',
      severity: score < 30 ? 'critical' : 'warning',
      cause: 'Combinação de imagens pesadas, scripts desnecessários e hospedagem inadequada',
      metric: `Velocidade geral: ${score}/100`,
    })
  }

  return {
    result: { category: 'performance', score, issues },
    screenshot,
  }
}
