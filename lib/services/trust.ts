import * as cheerio from 'cheerio'
import type { CategoryResult, Issue } from '@/lib/types'

export async function analyzeTrust(url: string, html: string): Promise<CategoryResult> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  let score = 100
  const deduct = (pts: number) => { score = Math.max(0, score - pts) }

  // Use full page text — many stores render footer content outside <footer> tag
  const fullText = $('body').text().replace(/\s+/g, ' ').toLowerCase()
  const fullHtml = $('body').html()?.toLowerCase() ?? ''

  // --- HTTPS ---
  if (!url.startsWith('https://')) {
    deduct(20) // Reduzido de 30 para 20
    issues.push({
      title: 'Loja sem HTTPS — Chrome exibe "Site não seguro"',
      description: 'Compradores veem um aviso de segurança antes de chegar nos seus produtos. Isso afasta clientes antes mesmo de verem o que você vende.',
      severity: 'critical',
      cause: 'Certificado SSL ausente ou não configurado no domínio',
    })
  }

  // --- CNPJ: check body inteiro com múltiplos formatos ---
  const cnpjRegex = /\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}/
  const hasCnpj = cnpjRegex.test(fullText) || /cnpj/i.test(fullText) || $('[class*="cnpj"], [id*="cnpj"]').length > 0
  
  if (!hasCnpj) {
    deduct(6) // Reduzido de 10 para 6
    issues.push({
      title: 'CNPJ não encontrado na página',
      description: 'Exibir o CNPJ transmite que é uma empresa real e séria. Consumidores brasileiros verificam isso antes de comprar de lojas desconhecidas.',
      severity: 'warning',
      cause: 'CNPJ não identificado no HTML da página — pode estar oculto por JavaScript ou ausente',
    })
  }

  // --- Política de privacidade ---
  const hasPrivacy = /privacidade|privacy policy|lgpd|dados pessoais|proteção de dados/i.test(fullText) ||
    $('a[href*="privacidade"], a[href*="privacy"], a[href*="lgpd"], a[href*="termos"], [class*="privacy"], [class*="privacidade"]').length > 0
  
  if (!hasPrivacy) {
    deduct(10) // Reduzido de 15 para 10
    issues.push({
      title: 'Política de privacidade não encontrada',
      description: 'Sem política de privacidade a loja pode estar irregular com a LGPD e perde credibilidade — especialmente com compradores mais cuidadosos.',
      severity: 'critical',
      cause: 'Nenhum link de política de privacidade encontrado na página',
    })
  }

  // --- Política de troca/devolução ---
  const hasReturn = /troca|devolu|reembolso|garantia|return policy|política de compra/i.test(fullText) ||
    $('a[href*="troca"], a[href*="devolucao"], a[href*="devolução"], a[href*="garantia"], a[href*="return"], a[href*="reembolso"], [class*="troca"], [class*="devolu"]').length > 0
  
  if (!hasReturn) {
    deduct(10) // Reduzido de 15 para 10
    issues.push({
      title: 'Política de troca e devolução não visível',
      description: 'Estudos de CRO mostram que exibir a política de devolução de forma clara aumenta conversão em até 30%. Sem ela, o medo de "e se não gostar?" trava a compra.',
      severity: 'critical',
      cause: 'Nenhuma referência a política de troca/devolução encontrada',
    })
  }

  // --- Informações de contato ---
  const hasPhone = /\+?55?\s?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}|\d{2}\s\d{4,5}\s\d{4}/.test(fullText)
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(fullText)
  const hasWhatsApp = /whatsapp|wapp|wa\.me|api\.whatsapp/i.test(fullHtml) || $('[class*="whatsapp"], [id*="whatsapp"], a[href*="wa.me"], a[href*="api.whatsapp"]').length > 0
  const hasChat = /chat|atendimento|suporte|fale conosco|contato/i.test(fullText) || $('[class*="chat"], [class*="talk"], [id*="chat"]').length > 0
  const hasContact = hasPhone || hasEmail || hasWhatsApp || hasChat

  if (!hasContact) {
    deduct(10) // Reduzido de 15 para 10
    issues.push({
      title: 'Nenhuma forma de contato visível',
      description: 'Compradores hesitam em finalizar pedidos quando não sabem como falar com a loja se algo der errado. Contato visível reduz fricção na decisão de compra.',
      severity: 'critical',
      cause: 'Telefone, e-mail, WhatsApp e chat não encontrados na página',
    })
  } else if (!hasPhone && !hasWhatsApp) {
    deduct(4) // Reduzido de 5 para 4
    issues.push({
      title: 'Sem telefone ou WhatsApp visível',
      description: 'E-mail e chat são bons, mas telefone ou WhatsApp passam mais credibilidade e permitem fechar vendas mais complexas em tempo real.',
      severity: 'warning',
      cause: 'Apenas e-mail/chat encontrado — WhatsApp e telefone aumentam conversão especialmente em tickets mais altos',
    })
  }

  // --- Selos de segurança ---
  const securityTerms = ['site blindado', 'siteblindado', 'trustee', 'norton', 'mcafee', 'ssl', 'compra segura', 'pagamento seguro', 'ambiente seguro', 'safe', 'secure']
  const hasBadge = securityTerms.some(t => fullText.includes(t) || fullHtml.includes(t)) || 
    $('img[alt*="seguro"], img[alt*="blindado"], img[alt*="trust"], img[src*="selo"], img[src*="shield"], img[src*="seguradora"]').length > 0 ||
    $('[class*="selo"], [class*="shield"], [class*="seguranca"], [class*="secure"]').length > 0
  
  if (!hasBadge) {
    deduct(6) // Reduzido de 10 para 6
    issues.push({
      title: 'Sem selos de segurança de pagamento',
      description: 'Selos como "Compra Segura", Site Blindado ou ícones de SSL próximos ao botão de compra reduzem o medo de fraude e aumentam a taxa de finalização.',
      severity: 'warning',
      cause: 'Nenhum selo de segurança identificado — especialmente importante próximo ao CTA de compra',
    })
  }

  // --- Avaliações de clientes ---
  const reviewTerms = ['avaliação', 'avaliações', 'depoimento', 'depoimentos', 'review', 'reviews', '★', '⭐', 'estrelas', 'nota ', 'clientes satisfeitos', 'compraram', ' depoimentos']
  const hasReviews = reviewTerms.some(t => fullText.includes(t)) || 
    $('[class*="review"], [class*="rating"], [class*="star"], [class*="avaliacao"], [class*="depoimento"]').length > 0
  const hasSchemaReview = /"@type"\s*:\s*"Review"/i.test(html) || /"aggregateRating"/i.test(html)
  
  if (!hasReviews && !hasSchemaReview) {
    deduct(8) // Reduzido de 10 para 8
    issues.push({
      title: 'Avaliações de clientes não exibidas na homepage',
      description: '88% dos consumidores confiam em avaliações online tanto quanto em recomendações pessoais. Sem elas na homepage, você está desperdiçando o maior ativo de conversão.',
      severity: 'warning',
      cause: 'Nenhum elemento de avaliação, estrelas ou depoimento encontrado na página inicial',
    })
  }

  // --- Formas de pagamento visíveis ---
  const paymentTerms = ['pix', 'boleto', 'cartão', 'cartao', 'visa', 'mastercard', 'parcel', 'installment', 'pagamento']
  const hasPaymentInfo = paymentTerms.some(t => fullText.includes(t)) || 
    $('[class*="pagamento"], [class*="payment"], [class*="flags"], [class*="cartao"], [class*="visa"], [class*="mastercard"], [class*="pix"]').length > 0
  
  if (!hasPaymentInfo) {
    deduct(6) // Reduzido de 10 para 6
    issues.push({
      title: 'Formas de pagamento não visíveis antes do checkout',
      description: 'Compradores querem saber se podem pagar do jeito que preferem antes de ir ao carrinho. Mostrar Pix, parcelamento e carteiras aceitas reduz abandono.',
      severity: 'warning',
      cause: 'Nenhuma referência a formas de pagamento encontrada na homepage',
    })
  }

  return { category: 'trust', score: Math.max(0, score), issues }
}
