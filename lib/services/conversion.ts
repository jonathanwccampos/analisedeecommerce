import * as cheerio from 'cheerio'
import type { CategoryResult, Issue } from '@/lib/types'

export async function analyzeConversion(url: string, html: string): Promise<CategoryResult> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  let score = 100
  const deduct = (pts: number) => { score = Math.max(0, score - pts) }

  const fullText = $('body').text().replace(/\s+/g, ' ').toLowerCase()
  const fullHtml = $('body').html()?.toLowerCase() ?? ''

  // --- CTA principal de compra ---
  const buyKeywords = [
    'comprar', 'adicionar ao carrinho', 'add to cart', 'compre agora', 'buy now', 
    'adicionar', 'compre', 'adquira', 'pedir agora', 'quero', 'ver produto', 
    'sacola', 'carrinho', 'adicionar à sacola', 'quero comprar', 'eu quero', 
    'finalizar compra', 'checkout', 'ir para o carrinho'
  ]
  const buttons = $('button, a, [role="button"], input[type="submit"], [class*="btn"], [class*="button"], [class*="cta"], [class*="comprar"], [class*="adicionar"]')
  
  let ctaText = ''
  buttons.each((_, el) => {
    const $el = $(el)
    const text = $el.text().toLowerCase()
    const ariaLabel = ($el.attr('aria-label') ?? '').toLowerCase()
    const title = ($el.attr('title') ?? '').toLowerCase()
    const alt = $el.find('img').map((_, img) => $(img).attr('alt') ?? '').get().join(' ').toLowerCase()
    ctaText += ` ${text} ${ariaLabel} ${title} ${alt}`
  })
  
  const hasCTA = buyKeywords.some(kw => ctaText.includes(kw))

  if (!hasCTA) {
    deduct(15) // Reduzido de 25 para 15 (mais suave)
    issues.push({
      title: 'Nenhum botão de compra claro na homepage',
      description: 'Sem um CTA de compra visível na tela inicial, visitantes não sabem o próximo passo. Isso é o problema número 1 de CRO em e-commerces.',
      severity: 'critical',
      cause: 'Nenhum botão com linguagem de ação de compra encontrado no HTML estático da homepage',
    })
  }

  // --- Preços visíveis ---
  const pricePattern = /r\$\s*\d+([\.,]\d+)?/i
  const hasPrices = pricePattern.test(fullText) ||
    $('[class*="price"], [class*="preco"], [class*="preço"], [class*="valor"], [class*="prod-price"], [class*="product-price"], [class*="money"], [itemprop="price"]').length > 0
  
  if (!hasPrices) {
    deduct(15) // Reduzido de 20 para 15
    issues.push({
      title: 'Preços não aparecem na homepage',
      description: 'Quando o comprador precisa clicar em cada produto para ver o preço, 60% abandona antes de chegar ao carrinho. Exibir preço na vitrine aumenta cliques e compras.',
      severity: 'critical',
      cause: 'Nenhum elemento ou classe de preço identificado na página inicial',
    })
  }

  // --- Parcelamento visível ---
  const hasInstallment = /\d+x\s*(de\s*)?r?\$|parcel|sem juros|em até/i.test(fullText) || fullHtml.includes('sem juros') || fullHtml.includes('em até')
  if (hasPrices && !hasInstallment) {
    deduct(8) // Reduzido de 10 para 8
    issues.push({
      title: 'Parcelamento não exibido nos produtos',
      description: 'Mostrar "10x sem juros" ao lado do preço pode aumentar conversão em 15-25% — especialmente em produtos acima de R$150. O brasileiro pensa em parcela, não em preço total.',
      severity: 'warning',
      cause: 'Parcelamento não identificado na exibição de preços da homepage',
    })
  }

  // --- Elementos de urgência e escassez ---
  const urgencyKeywords = [
    'últimas unidades', 'última unidade', 'restam', 'só restam', 'acaba em', 
    'termina em', 'oferta por tempo', 'hoje', 'promoção', 'desconto', '%off', 
    '% off', 'frete grátis', 'corra', 'tempo limitado', 'estoque limitado', 'imperdível'
  ]
  const hasUrgency = urgencyKeywords.some(kw => fullText.includes(kw)) || 
    $('[class*="countdown"], [class*="timer"], [class*="urgency"], [class*="contador"]').length > 0
  
  if (!hasUrgency) {
    deduct(8) // Reduzido de 10 para 8
    issues.push({
      title: 'Sem gatilhos de urgência ou escassez',
      description: 'Sem uma razão para comprar agora, o comprador diz "vejo depois" — e não volta. Urgência (prazo) e escassez (estoque) são os gatilhos de conversão mais eficazes do e-commerce.',
      severity: 'warning',
      cause: 'Nenhum elemento de urgência ou escassez detectado na página',
    })
  }

  // --- Frete grátis em destaque ---
  const hasFreteGratis = /frete gr[aá]tis|frete free|entrega gr[aá]tis|free shipping/i.test(fullText)
  const hasFreteInfo = /frete|entrega|shipping/i.test(fullText) || $('[class*="frete"], [class*="shipping"]').length > 0
  
  if (!hasFreteGratis && !hasFreteInfo) {
    deduct(10) // Reduzido de 15 para 10
    issues.push({
      title: 'Nenhuma informação de frete visível',
      description: 'O custo de frete inesperado é a maior causa de abandono de carrinho no Brasil (68% dos abandonos). Mostrar o frete — mesmo que não seja grátis — desde a vitrine reduz surpresas e abandono.',
      severity: 'critical',
      cause: 'Nenhuma menção a frete ou prazo de entrega encontrada na homepage',
    })
  } else if (!hasFreteGratis && hasFreteInfo) {
    deduct(4) // Reduzido de 5 para 4
    issues.push({
      title: 'Frete grátis não comunicado (ou não existe)',
      description: 'Se você oferece frete grátis a partir de um valor, destacar isso na homepage é um dos CTAs mais eficazes para aumentar o ticket médio e reduzir abandono.',
      severity: 'warning',
      cause: 'Frete mencionado mas frete grátis não destacado na página inicial',
    })
  }

  // --- Campo de busca ---
  const hasSearch = $('input[type="search"], input[name="q"], input[name="search"], input[placeholder*="busca"], input[placeholder*="pesquisa"], [role="search"] input, [class*="search"], [class*="busca"], [class*="pesquisa"]').length > 0
  if (!hasSearch) {
    deduct(6) // Reduzido de 8 para 6
    issues.push({
      title: 'Campo de busca ausente ou não identificado',
      description: 'Compradores que usam a busca convertem 2-3x mais do que os que navegam por categorias. Sem busca acessível, você perde quem sabe o que quer.',
      severity: 'warning',
      cause: 'Campo de busca não encontrado — pode estar oculto ou renderizado por JavaScript',
    })
  }

  // --- Carrinho visível ---
  const headerHtml = $('header, nav, [class*="header"], [class*="menu"]').html() ?? ''
  const hasCart = /cart|carrinho|sacola|bag|basket/i.test(headerHtml) || 
    $('[class*="cart"], [class*="carrinho"], [class*="sacola"], [class*="bag"]').length > 0
  
  if (!hasCart) {
    deduct(6) // Reduzido de 8 para 6
    issues.push({
      title: 'Ícone de carrinho não identificado no cabeçalho',
      description: 'O carrinho no header é um elemento de confiança — mostra que a loja é funcional e permite que o comprador acompanhe o que escolheu sem se perder.',
      severity: 'warning',
      cause: 'Link/ícone de carrinho não encontrado no header — pode ser renderizado por JS',
    })
  }

  // --- Imagens de produto ---
  const totalImages = $('img').length
  if (totalImages < 3) {
    deduct(8) // Reduzido de 10 para 8
    issues.push({
      title: 'Poucas imagens na homepage',
      description: 'Uma homepage com poucas imagens passa a impressão de loja vazia ou abandonada. Imagens de produto e lifestyle aumentam o desejo de compra.',
      severity: 'warning',
      cause: `Apenas ${totalImages} imagem(ns) encontrada(s) no HTML estático`,
      metric: `${totalImages} imagem(ns) — recomendado: 6+`,
    })
  }

  return { category: 'conversion', score: Math.max(0, score), issues }
}
