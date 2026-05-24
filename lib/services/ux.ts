import * as cheerio from 'cheerio'
import type { CategoryResult, Issue } from '@/lib/types'

export async function analyzeUx(url: string, html: string): Promise<CategoryResult> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  let score = 100
  const deduct = (pts: number) => { score = Math.max(0, score - pts) }

  const fullText = $('body').text().replace(/\s+/g, ' ').toLowerCase()
  const fullHtml = $('body').html()?.toLowerCase() ?? ''
  const origin = new URL(url).origin

  // --- Menu de navegação ---
  const navLinks = $('nav a, header a, [role="navigation"] a, [class*="menu"] a, [class*="nav"] a, [class*="navbar"] a, [class*="header"] a')
  const navCount = navLinks.length
  if (navCount < 3) {
    deduct(10) // Reduzido de 20 para 10
    issues.push({
      title: 'Menu de categorias ausente ou muito simples',
      description: 'Sem categorias claras no menu, o visitante não sabe por onde começar e abandona a loja. Pesquisa da Nielsen Norman Group mostra que 38% dos usuários desistem quando não encontram o que procuram em 3 cliques.',
      severity: 'critical',
      cause: `Apenas ${navCount} link(s) de navegação encontrado(s) — pode estar sendo renderizado por JavaScript`,
      metric: `${navCount} link(s) no menu`,
    })
  }

  // --- Breadcrumbs (migalha de pão) ---
  const hasBreadcrumb = $('[aria-label*="breadcrumb"], [class*="breadcrumb"], [class*="breadcrumbs"], nav[aria-label*="Breadcrumb"], [itemtype*="BreadcrumbList"], [class*="migalha"]').length > 0 ||
    /"BreadcrumbList"/i.test(html)
  if (!hasBreadcrumb) {
    deduct(4) // Reduzido de 8 para 4
    issues.push({
      title: 'Breadcrumbs ausentes — cliente se perde na loja',
      description: 'Breadcrumbs (ex: "Home > Camisetas > Masculino") mostram ao comprador onde ele está e facilitam a navegação entre categorias. Sem eles, clientes pressionam "voltar" e saem da loja ao invés de explorar mais produtos.',
      severity: 'warning',
      cause: 'Nenhum elemento de breadcrumb ou Schema.org BreadcrumbList encontrado',
    })
  }

  // --- Rodapé completo ---
  const footerLinks = $('footer a, [class*="footer"] a, [id*="footer"] a').length
  const hasFooter = footerLinks >= 4
  if (!hasFooter) {
    deduct(6) // Reduzido de 10 para 6
    issues.push({
      title: `Rodapé incompleto — ${footerLinks === 0 ? 'sem links institucionais' : 'poucos links'}`,
      description: 'O rodapé é onde compradores procuram políticas, contatos, formas de pagamento e links de segurança antes de decidir comprar. Um rodapé pobre aumenta a desconfiança e o abandono.',
      severity: footerLinks === 0 ? 'critical' : 'warning',
      cause: `${footerLinks} link(s) no rodapé — pode estar sendo renderizado por JavaScript`,
      metric: `${footerLinks} link(s) — recomendado: 5+`,
    })
  }

  // --- Favicon ---
  const hasFavicon = $('link[rel*="icon"], link[rel*="shortcut"], link[rel*="apple-touch-icon"]').length > 0
  if (!hasFavicon) {
    deduct(3) // Reduzido de 5 para 3
    issues.push({
      title: 'Favicon ausente — loja sem identidade na aba do navegador',
      description: 'Lojas sem favicon parecem inacabadas ou falsas. Na aba do navegador, aparece um ícone genérico que reduz a credibilidade e dificulta o cliente que tem várias abas abertas de encontrar sua loja.',
      severity: 'warning',
      cause: 'Nenhuma tag <link rel="icon"> ou <link rel="shortcut icon"> encontrada',
    })
  }

  // --- Links de redes sociais ---
  const hasSocial = /instagram|facebook|tiktok|youtube|twitter|linkedin|pinterest/i.test(fullHtml) ||
    $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="t.me"], a[href*="youtube.com"], a[href*="pinterest.com"], a[href*="tiktok.com"]').length > 0
  
  if (!hasSocial) {
    deduct(4) // Reduzido de 5 para 4
    issues.push({
      title: 'Redes sociais não linkadas na página',
      description: 'Links para Instagram, Facebook ou TikTok aumentam a confiança (prova de que a loja existe e é ativa) e permitem que o visitante siga a marca. Lojas ativas em redes sociais convertem mais porque constroem relacionamento com o cliente.',
      severity: 'warning',
      cause: 'Nenhum link para redes sociais encontrado na página',
    })
  }

  // --- Newsletter / captura de e-mail ---
  const hasNewsletter = /newsletter|inscreva|assine|receba.*e-mail|cadastre.*email|receba.*novidade|desconto.*e-mail|assinar|cadastrar/i.test(fullText) ||
    $('input[type="email"], input[placeholder*="email"], input[placeholder*="e-mail"], input[name*="email"]').length > 0
  
  if (!hasNewsletter) {
    deduct(4) // Reduzido de 5 para 4
    issues.push({
      title: 'Sem captura de e-mail para remarketing',
      description: '97% dos visitantes saem sem comprar na primeira visita. Capturar o e-mail (com desconto ou brinde) permite que você traga esse visitante de volta via e-mail marketing — que tem ROI de 36x para cada R$1 investido.',
      severity: 'warning',
      cause: 'Nenhum formulário de newsletter ou captura de e-mail encontrado na página',
    })
  }

  // --- Links quebrados (amostra de 8 links internos) ---
  const internalLinks = $('a[href]')
    .map((_, el) => $(el).attr('href') ?? '')
    .get()
    .filter(href => href.startsWith('/') || href.startsWith(origin))
    .filter(href => !href.includes('#') && href !== '/')
    .slice(0, 8)

  let brokenCount = 0
  if (internalLinks.length > 0) {
    await Promise.all(
      internalLinks.map(async (href) => {
        try {
          const fullUrl = href.startsWith('/') ? `${origin}${href}` : href
          const res = await fetch(fullUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(4000),
            redirect: 'follow',
          })
          if (res.status === 404) brokenCount++
        } catch { /* ignore timeout */ }
      })
    )

    if (brokenCount > 0) {
      deduct(Math.min(brokenCount * 5, 15)) // Reduzido de brokenCount * 8 e max 25 para brokenCount * 5 e max 15
      issues.push({
        title: `${brokenCount} link(s) quebrado(s) levando a páginas de erro`,
        description: 'Links quebrados interrompem a jornada de compra no momento mais crítico. Quando o cliente clica em uma categoria ou produto e cai numa página de erro 404, a taxa de saída é próxima de 90%.',
        severity: brokenCount > 2 ? 'critical' : 'warning',
        cause: `${brokenCount} de ${internalLinks.length} links internos verificados retornaram erro 404`,
        metric: `${brokenCount} link(s) com 404`,
      })
    }
  }

  // --- Página 404 customizada ---
  try {
    const notFoundRes = await fetch(`${origin}/pagina-404-${Date.now()}`, {
      signal: AbortSignal.timeout(5000),
    })
    const notFoundText = await notFoundRes.text()
    const hasMenu = /menu|navega|produto|categoria|home|voltar/i.test(notFoundText)
    if (!hasMenu || notFoundText.length < 1000) {
      deduct(3) // Reduzido de 5 para 3
      issues.push({
        title: 'Página de erro 404 não direciona para produtos',
        description: 'Quando alguém acessa um link errado ou antigo (de anúncio, Google ou WhatsApp), uma página 404 sem navegação significa venda perdida. Uma página 404 com menu, busca e produtos sugeridos recupera parte desse tráfego.',
        severity: 'warning',
        cause: 'Página 404 sem menu de navegação ou redirecionamento para produtos',
      })
    }
  } catch { /* skip */ }

  return { category: 'ux', score: Math.max(0, score), issues }
}
