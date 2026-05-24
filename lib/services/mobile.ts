import * as cheerio from 'cheerio'
import type { CategoryResult, Issue } from '@/lib/types'

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function analyzeMobile(url: string, html: string): Promise<CategoryResult> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  let score = 100
  const deduct = (pts: number) => { score = Math.max(0, score - pts) }

  // --- Score mobile via PageSpeed ---
  let mobileScore = -1
  let mobileFcp = 0
  let mobileLcp = 0
  try {
    const params = new URLSearchParams({ url, strategy: 'mobile', category: 'performance' })
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
    if (apiKey) params.set('key', apiKey)
    const res = await fetch(`${PAGESPEED_API}?${params}`, { signal: AbortSignal.timeout(30000) })
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>
      const lr = data.lighthouseResult as Record<string, Record<string, unknown>> | undefined
      const cats = lr?.categories as Record<string, { score: number }> | undefined
      const audits = lr?.audits as Record<string, unknown> | undefined
      const metricsAudit = audits?.metrics as { details?: { items?: Record<string, number>[] } } | undefined
      const metrics = metricsAudit?.details?.items?.[0] ?? {}
      mobileScore = Math.round((cats?.performance?.score ?? 0) * 100)
      mobileFcp = (metrics.firstContentfulPaint ?? 0) / 1000
      mobileLcp = (metrics.largestContentfulPaint ?? 0) / 1000
    }
  } catch { /* use html-based checks only */ }

  // Usa o score mobile como base se disponível, senão mantém 100 para cheques por HTML
  if (mobileScore >= 0) {
    score = mobileScore
  }

  if (mobileScore >= 0 && mobileScore < 50) {
    issues.push({
      title: `Loja muito lenta no celular — score ${mobileScore}/100`,
      description: `Mais de 65% dos brasileiros compram pelo celular. Uma loja com score mobile abaixo de 50 demora mais de 5 segundos para carregar — pesquisa do Google mostra que 53% dos visitantes abandonam após 3 segundos de espera. Você está perdendo mais da metade dos seus clientes mobile.`,
      severity: mobileScore < 30 ? 'critical' : 'warning',
      cause: 'Imagens não otimizadas para mobile, JavaScript bloqueante ou ausência de CDN',
      metric: `Score mobile: ${mobileScore}/100`,
    })
  } else if (mobileScore >= 0 && mobileScore < 75) {
    issues.push({
      title: `Performance mobile abaixo do ideal — score ${mobileScore}/100`,
      description: 'Sua loja está razoável no mobile, mas ainda há espaço para melhorar. Cada segundo a mais de carregamento reduz conversões em ~7% no mobile. Otimizar imagens e remover scripts desnecessários costuma subir esse score rapidamente.',
      severity: 'warning',
      cause: 'Oportunidades de otimização: imagens, scripts de terceiros, cache',
      metric: `Score mobile: ${mobileScore}/100`,
    })
  }

  if (mobileScore >= 0 && mobileLcp > 4) {
    issues.push({
      title: 'Imagem principal carrega muito devagar no celular',
      description: 'O banner ou imagem principal da sua loja demora mais de 4 segundos para aparecer no celular. Isso é tudo que o comprador vê enquanto espera — e a maioria já abandonou antes.',
      severity: 'critical',
      cause: 'Imagem hero sem compressão, sem lazy-load ou sem versão mobile (srcset)',
      metric: `Imagem principal: ${mobileLcp.toFixed(1)}s — ideal: menos de 2,5s`,
    })
  }

  // --- Viewport meta (crítico para renderização mobile) ---
  const viewport = $('meta[name="viewport"]').attr('content') ?? ''
  if (!viewport.includes('width=device-width')) {
    deduct(25)
    issues.push({
      title: 'Viewport mobile não configurado — loja aparece minúscula no celular',
      description: 'Sem a meta viewport correta, seu site é exibido como versão desktop miniaturizada no celular. O comprador precisa dar zoom para ler qualquer coisa — e 80% abandona imediatamente nessa situação.',
      severity: 'critical',
      cause: 'Tag <meta name="viewport" content="width=device-width, initial-scale=1"> ausente ou incorreta',
    })
  }

  // --- Fontes legíveis no mobile (mínimo 16px para não forçar zoom no iOS) ---
  const inlineStyles = $('style').text()
  const fontSizeMatches = inlineStyles.match(/font-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)/g) ?? []
  const hasSmallFont = fontSizeMatches.some(s => {
    const match = s.match(/font-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)/)
    if (!match) return false
    const value = parseFloat(match[1])
    const unit = match[2]
    if (unit === 'px') return value < 14
    if (unit === 'rem' || unit === 'em') return value < 0.875
    return false
  })
  if (hasSmallFont) {
    deduct(10)
    issues.push({
      title: 'Textos muito pequenos no mobile — força zoom involuntário',
      description: 'Fontes abaixo de 14px em mobile forçam o comprador a dar zoom para ler preços, descrições e botões. O iOS Safari aumenta automaticamente fontes pequenas, quebrando o layout. Isso aumenta a taxa de rejeição em dispositivos Apple.',
      severity: 'warning',
      cause: 'font-size inferior a 14px detectado nos estilos inline da página',
    })
  }

  // --- Menu mobile (hamburguer ou equivalente) ---
  const hasMobileMenu = /hamburger|menu-mobile|mobile-menu|nav-toggle|menu-toggle|burger|offcanvas|sidebar/i.test(html) ||
    $('[aria-label*="menu"], [aria-label*="Menu"], [aria-controls*="menu"], [data-toggle="collapse"]').length > 0
  const navCount = $('nav a, header a').length
  if (!hasMobileMenu && navCount > 5) {
    deduct(10)
    issues.push({
      title: 'Menu mobile possivelmente ausente para navegação por celular',
      description: 'Em telas pequenas, um menu com muitos itens sem versão mobile (hamburguer) ocupa espaço valioso da vitrine ou fica inacessível. Compradores no celular precisam encontrar categorias com 1 toque.',
      severity: 'warning',
      cause: 'Nenhum padrão de menu mobile (hamburguer) detectado — pode ser renderizado por JavaScript',
    })
  }

  // --- Imagens com dimensões definidas (evita layout shift) ---
  const imagesWithoutDimensions = $('img').filter((_, el) => {
    const hasWidth = $(el).attr('width') || $(el).attr('style')?.includes('width')
    const hasHeight = $(el).attr('height') || $(el).attr('style')?.includes('height')
    return !hasWidth || !hasHeight
  }).length
  const totalImages = $('img').length
  if (totalImages > 0) {
    const pct = Math.round((imagesWithoutDimensions / totalImages) * 100)
    if (pct > 50) {
      deduct(8)
      issues.push({
        title: `${pct}% das imagens sem dimensões definidas — layout quebrado no mobile`,
        description: 'Imagens sem tamanho definido fazem a página pular de posição enquanto carrega no celular. Isso é extremamente frustrante e causa cliques errados — especialmente no botão de compra, que se move na hora do toque.',
        severity: 'warning',
        cause: `${imagesWithoutDimensions} de ${totalImages} imagens sem atributos width e height explícitos`,
        metric: `${pct}% sem dimensões — recomendado: 0%`,
      })
    }
  }

  // --- Formulários otimizados para mobile ---
  const inputs = $('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]')
  const inputsWithoutType = inputs.filter((_, el) => {
    const type = $(el).attr('type') ?? 'text'
    return type === 'text' && !$(el).attr('inputmode') && !$(el).attr('autocomplete')
  }).length
  if (inputs.length > 0 && inputsWithoutType > 0) {
    deduct(5)
    issues.push({
      title: 'Campos de formulário sem otimização para teclado mobile',
      description: 'Campos de CEP, telefone e e-mail sem o tipo correto abrem o teclado alfanumérico padrão no celular, dificultando o preenchimento. O teclado numérico para CEP e telefone reduz erros e acelera o checkout.',
      severity: 'warning',
      cause: `${inputsWithoutType} campo(s) de texto sem inputmode ou autocomplete configurados para mobile`,
    })
  }

  return { category: 'mobile', score: Math.max(0, score), issues }
}
