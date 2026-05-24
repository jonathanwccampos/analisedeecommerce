import * as cheerio from 'cheerio'
import type { CategoryResult, Issue } from '@/lib/types'

export async function analyzeSeo(url: string, html: string): Promise<CategoryResult> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  let score = 100
  const deduct = (pts: number) => { score = Math.max(0, score - pts) }

  // --- Título da página no Google ---
  const title = $('title').first().text().trim()
  if (!title) {
    deduct(20)
    issues.push({
      title: 'Sua loja não tem título configurado no Google',
      description: 'Sem título, o Google não sabe o que sua loja vende e exibe URLs feias nos resultados de busca. Você perde cliques de compradores que já estão procurando seus produtos.',
      severity: 'critical',
      cause: 'Tag de título ausente no código da página',
    })
  } else if (title.length < 30) {
    deduct(10)
    issues.push({
      title: 'Título da loja no Google muito curto — oportunidade desperdiçada',
      description: 'Um título curto desperdiça espaço valioso nos resultados do Google. Você poderia incluir o nicho, diferencial ou cidade para atrair mais cliques de compradores.',
      severity: 'warning',
      cause: `Título com apenas ${title.length} caracteres — ideal entre 50 e 65 caracteres`,
      metric: `"${title}" — ${title.length} chars`,
    })
  } else if (title.length > 65) {
    deduct(8)
    issues.push({
      title: 'Título da loja aparece cortado nos resultados do Google',
      description: 'Títulos longos são cortados com "..." no Google. A parte mais importante da mensagem — geralmente o diferencial ou promoção — some antes do comprador ler.',
      severity: 'warning',
      cause: `Título com ${title.length} caracteres — Google corta em ~65`,
      metric: `${title.length} chars — limite: 65`,
    })
  }

  // --- Descrição nos resultados do Google ---
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() ?? ''
  if (!metaDesc) {
    deduct(15)
    issues.push({
      title: 'Sem texto de chamada nos resultados do Google',
      description: 'Sem uma descrição configurada, o Google escolhe qualquer trecho do seu site para exibir — geralmente código ou texto sem sentido. Uma boa descrição pode dobrar o número de cliques orgânicos.',
      severity: 'critical',
      cause: 'Tag de meta description ausente no código da página',
    })
  } else if (metaDesc.length < 100 || metaDesc.length > 160) {
    deduct(8)
    issues.push({
      title: metaDesc.length < 100
        ? 'Descrição no Google muito curta — não comunica seus diferenciais'
        : 'Descrição no Google muito longa — chamada para ação some cortada',
      description: metaDesc.length < 100
        ? 'Use esse espaço para destacar frete grátis, parcelamento, diferenciais do seu nicho. É a primeira coisa que o comprador lê antes de clicar.'
        : 'Descrições longas são cortadas com "..." — o comprador não vê o final da mensagem, onde geralmente fica o diferencial ou a promoção.',
      severity: 'warning',
      cause: `${metaDesc.length} caracteres — ideal entre 120 e 160`,
      metric: `${metaDesc.length} chars`,
    })
  }

  // --- Título principal da página ---
  const h1s = $('h1')
  const h1Count = h1s.length
  if (h1Count === 0) {
    deduct(15)
    issues.push({
      title: 'Página sem título principal — Google não identifica o que você vende',
      description: 'O título principal (H1) é o sinal mais forte para o Google sobre o tema da página. Sem ele, seu ranqueamento para os termos que seus clientes buscam fica comprometido.',
      severity: 'critical',
      cause: 'Título principal (H1) ausente na página',
    })
  } else if (h1Count > 1) {
    deduct(8)
    issues.push({
      title: `Página com ${h1Count} títulos principais — confunde o Google`,
      description: 'Uma página bem estruturada tem um único título principal. Múltiplos títulos diluem o sinal de relevância e o Google fica sem saber qual é o assunto principal da página.',
      severity: 'warning',
      cause: `${h1Count} títulos principais encontrados — deve haver exatamente 1`,
      metric: `${h1Count} títulos`,
    })
  }

  // --- Compartilhamento no WhatsApp e redes sociais ---
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')
  const ogDesc = $('meta[property="og:description"]').attr('content')
  const missingOg = [!ogTitle && 'título', !ogImage && 'imagem', !ogDesc && 'descrição'].filter(Boolean)

  if (missingOg.length > 0) {
    deduct(8)
    issues.push({
      title: 'Link da loja aparece sem imagem no WhatsApp e Instagram',
      description: 'Quando alguém compartilha sua loja no WhatsApp ou stories sem as configurações de compartilhamento corretas, aparece sem imagem e com texto aleatório. Links sem preview têm até 3x menos cliques.',
      severity: 'warning',
      cause: `Configurações de compartilhamento ausentes: ${missingOg.join(', ')}`,
    })
  }

  // --- Risco de conteúdo duplicado no Google ---
  if (!$('link[rel="canonical"]').attr('href')) {
    deduct(5)
    issues.push({
      title: 'Risco de conteúdo duplicado no Google',
      description: 'Se sua loja é acessível com e sem "www", ou com parâmetros de campanha (UTMs), o Google pode indexar múltiplas versões e dividir a força do seu ranqueamento.',
      severity: 'warning',
      cause: 'URL canônica não definida na página',
    })
  }

  // --- Mapa do site ---
  try {
    const origin = new URL(url).origin
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) })
    if (!sitemapRes.ok) {
      deduct(8)
      issues.push({
        title: 'Mapa do site ausente — Google descobre produtos mais devagar',
        description: 'Sem um mapa do site, o Google rastreia seus produtos pelos links — um processo lento. Com ele, novos produtos são indexados em horas, não dias, aparecendo mais rápido nas buscas.',
        severity: 'warning',
        cause: 'Arquivo sitemap.xml não encontrado',
      })
    }
  } catch { /* skip on timeout */ }

  // --- Arquivo de acesso para rastreadores ---
  try {
    const origin = new URL(url).origin
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    if (!robotsRes.ok) {
      deduct(5)
      issues.push({
        title: 'Arquivo de acesso para o Google ausente',
        description: 'Sem o arquivo robots.txt, o Google pode perder tempo indexando páginas internas desnecessárias (carrinho, checkout) e deixar seus produtos reais em segundo plano.',
        severity: 'warning',
        cause: 'Arquivo robots.txt não encontrado',
      })
    }
  } catch { /* skip */ }

  // --- Imagens sem descrição ---
  const images = $('img')
  const total = images.length
  if (total > 0) {
    const withoutAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length
    const pct = Math.round((withoutAlt / total) * 100)
    if (pct > 40) {
      deduct(8)
      issues.push({
        title: `${pct}% das fotos dos produtos invisíveis para o Google`,
        description: 'Fotos sem descrição de texto são invisíveis para o Google Imagens — você perde tráfego gratuito de clientes buscando fotos de produtos como os seus. Adicionar descrições curtas a cada foto resolve isso.',
        severity: pct > 70 ? 'critical' : 'warning',
        cause: `${withoutAlt} de ${total} imagens sem texto alternativo (alt)`,
        metric: `${pct}% sem descrição`,
      })
    }
  }

  return { category: 'seo', score: Math.max(0, score), issues }
}
