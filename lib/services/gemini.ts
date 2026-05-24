import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CategoryResult, Issue, AdAnalysis, AdRecommendation, CreativeIdea, StoreContext, TicketStrategy } from '@/lib/types'

// ─── Labels ──────────────────────────────────────────────────────────────────

const NICHE_LABELS: Record<string, string> = {
  moda: 'Moda & Vestuário',
  fitness: 'Fitness & Suplementos',
  beleza: 'Beleza & Cosméticos',
  eletronicos: 'Eletrônicos & Tech',
  alimentos: 'Alimentos & Bebidas',
  casa: 'Casa & Decoração',
  infantil: 'Produtos Infantis',
  esportes: 'Esportes & Aventura',
  pets: 'Pets',
  outro: 'Outro segmento',
}

const AD_SPEND_LABELS: Record<string, string> = {
  nenhum: 'não investe em anúncios',
  'menos-1k': 'investe menos de R$1.000/mês em anúncios',
  '1k-5k': 'investe entre R$1.000 e R$5.000/mês em anúncios',
  '5k-20k': 'investe entre R$5.000 e R$20.000/mês em anúncios',
  'mais-20k': 'investe mais de R$20.000/mês em anúncios',
}

const REVENUE_LABELS: Record<string, string> = {
  'menos-10k': 'fatura menos de R$10.000/mês',
  '10k-50k': 'fatura entre R$10.000 e R$50.000/mês',
  '50k-200k': 'fatura entre R$50.000 e R$200.000/mês',
  'mais-200k': 'fatura mais de R$200.000/mês',
}

const TICKET_LABELS: Record<string, string> = {
  'menos-100': 'ticket médio abaixo de R$100 (compra por impulso)',
  '100-250': 'ticket médio entre R$100 e R$250 (compra consciente)',
  '250-500': 'ticket médio entre R$250 e R$500 (compra planejada)',
  'mais-500': 'ticket médio acima de R$500 (alto valor)',
}

// ─── Benchmarks por nicho ────────────────────────────────────────────────────

const NICHE_BENCHMARKS: Record<string, {
  conversionRate: string
  cartAbandonment: string
  mobileTraffic: string
  avgTicket: string
  roasBenchmark: { min: number; max: number }
  topStores: string
}> = {
  moda: {
    conversionRate: '1.5–2.5%',
    cartAbandonment: '82%',
    mobileTraffic: '76%',
    avgTicket: 'R$180–R$280',
    roasBenchmark: { min: 3, max: 6 },
    topStores: 'Amaro, Farm, Renner, Shein BR',
  },
  fitness: {
    conversionRate: '2.0–3.5%',
    cartAbandonment: '75%',
    mobileTraffic: '72%',
    avgTicket: 'R$150–R$350',
    roasBenchmark: { min: 4, max: 8 },
    topStores: 'Growth, Max Titanium, Integral Médica',
  },
  beleza: {
    conversionRate: '2.5–4.0%',
    cartAbandonment: '72%',
    mobileTraffic: '78%',
    avgTicket: 'R$120–R$250',
    roasBenchmark: { min: 4, max: 8 },
    topStores: 'Sephora BR, O Boticário, Natura',
  },
  eletronicos: {
    conversionRate: '0.8–1.5%',
    cartAbandonment: '68%',
    mobileTraffic: '65%',
    avgTicket: 'R$500–R$1.500',
    roasBenchmark: { min: 5, max: 10 },
    topStores: 'KaBuM!, Magazine Luiza, Positivo',
  },
  alimentos: {
    conversionRate: '3.0–5.0%',
    cartAbandonment: '70%',
    mobileTraffic: '74%',
    avgTicket: 'R$80–R$200',
    roasBenchmark: { min: 3, max: 5 },
    topStores: 'Mundo Verde, Loja do Chá, Pão de Açúcar online',
  },
  casa: {
    conversionRate: '1.5–2.5%',
    cartAbandonment: '80%',
    mobileTraffic: '68%',
    avgTicket: 'R$250–R$600',
    roasBenchmark: { min: 3, max: 6 },
    topStores: 'Tok&Stok, Etna, Westwing BR',
  },
  infantil: {
    conversionRate: '2.0–3.5%',
    cartAbandonment: '74%',
    mobileTraffic: '73%',
    avgTicket: 'R$100–R$300',
    roasBenchmark: { min: 3, max: 6 },
    topStores: 'Ri Happy, PBKids, Baby Store',
  },
  esportes: {
    conversionRate: '1.8–3.0%',
    cartAbandonment: '76%',
    mobileTraffic: '70%',
    avgTicket: 'R$200–R$500',
    roasBenchmark: { min: 4, max: 7 },
    topStores: 'Decathlon BR, Netshoes, Centauro',
  },
  pets: {
    conversionRate: '2.5–4.0%',
    cartAbandonment: '71%',
    mobileTraffic: '72%',
    avgTicket: 'R$100–R$250',
    roasBenchmark: { min: 3, max: 6 },
    topStores: 'Petz, Cobasi, PetLove',
  },
  outro: {
    conversionRate: '1.5–3.0%',
    cartAbandonment: '78%',
    mobileTraffic: '73%',
    avgTicket: 'R$150–R$350',
    roasBenchmark: { min: 3, max: 6 },
    topStores: 'referências do segmento',
  },
}

// ─── Contexto brasileiro (injetado em todos os prompts) ──────────────────────

const BR_MARKET_CONTEXT = `
CONTEXTO DO MERCADO BRASILEIRO DE E-COMMERCE (dados 2024):
- 73% do tráfego em e-commerces BR vem do celular — mobile-first é obrigatório
- PIX é o método de pagamento preferido (43% das compras); presença visível aumenta conversão
- 58% dos consumidores abandonam se não há condições de frete claras (grátis ou prazo explícito)
- CNPJ visível no rodapé aumenta conversão em até 12% (dado Ebit/Nielsen)
- WhatsApp como canal de suporte é esperado por 67% dos compradores brasileiros
- Parcelamento visível no produto reduz abandono em até 20%
- Avaliações com foto têm 3x mais impacto que avaliações só com texto
- Consumidor BR leva em média 2,3 sessões para converter — remarketing é crítico
- Checkout com menos de 3 etapas converte 35% mais que checkouts longos
- Boleto ainda representa 18% dos pagamentos — não pode ser ignorado
`

// ─── Foco visual por nicho ───────────────────────────────────────────────────

const NICHE_VISUAL_FOCUS: Record<string, string> = {
  moda: 'Foque em: hero com produto + preço visível, vitrine com mínimo 6 produtos, tabela de medidas, política de troca clara, parcelamento no card do produto, identidade visual da marca.',
  fitness: 'Foque em: tabela nutricional e ingredientes, selos de qualidade/certificações, depoimentos de resultados reais com foto, CTAs urgentes, credibilidade científica.',
  beleza: 'Foque em: fotos de antes/depois, ingredientes em destaque, selos vegano/cruelty-free, avaliações com foto de clientes reais, ANVISA/registros visíveis.',
  eletronicos: 'Foque em: specs técnicas em tabela, garantia em destaque imediato, comparação de modelos, fotos com contexto de uso, certificações (Anatel, etc.).',
  alimentos: 'Foque em: informação nutricional, ingredientes, selos orgânico/sem glúten/etc., fotos apetitosas do produto pronto, data de validade/frescor em destaque.',
  casa: 'Foque em: fotos em ambiente real (não só fundo branco), dimensões visíveis, variações de cor/material, prazo de entrega, avaliações com foto.',
  infantil: 'Foque em: certificados de segurança (Inmetro), faixa etária, fotos de criança usando o produto, garantia/política de devolução clara.',
  esportes: 'Foque em: specs técnicas (peso, material, tamanho), avaliações de performance, vídeos de uso, compatibilidade com outros equipamentos.',
  pets: 'Foque em: tamanho/raça indicada, ingredientes (se alimento), fotos de pets usando o produto, indicação veterinária, frete para produtos pesados.',
  outro: 'Foque em: CTA principal, qualidade das imagens, prova social, proposta de valor, urgência e confiança geral.',
}

// ─── Midpoints para cálculo de ROAS ─────────────────────────────────────────

const AD_SPEND_MIDPOINTS: Record<string, number> = {
  nenhum: 0,
  'menos-1k': 500,
  '1k-5k': 3000,
  '5k-20k': 12500,
  'mais-20k': 35000,
}

const REVENUE_MIDPOINTS: Record<string, number> = {
  'menos-10k': 7000,
  '10k-50k': 30000,
  '50k-200k': 125000,
  'mais-200k': 300000,
}

// ─── Gemini fallback helper ──────────────────────────────────────────────────

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite']

const GEMINI_CALL_TIMEOUT_MS = 15000

async function generateWithFallback(
  genAI: GoogleGenerativeAI,
  prompt: string | (string | { inlineData: { data: string; mimeType: string } })[],
): Promise<string> {
  let lastError: unknown = null
  for (const modelName of GEMINI_MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName })
    try {
      const result = await Promise.race([
        model.generateContent(prompt as Parameters<typeof model.generateContent>[0]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini call timeout')), GEMINI_CALL_TIMEOUT_MS)
        ),
      ])
      const text = result.response.text().trim()
      if (text) return text
    } catch (e: unknown) {
      lastError = e
      const status = (e as { status?: number })?.status
      if (status === 503 || status === 429) continue
    }
  }
  throw lastError || new Error('All Gemini models unavailable')
}

function buildContextText(context: Partial<StoreContext>): string {
  const parts: string[] = []
  if (context.niche) parts.push(`Nicho: ${NICHE_LABELS[context.niche] ?? context.niche}`)
  if (context.platform) parts.push(`Plataforma: ${context.platform}`)
  if (context.adSpend) parts.push(AD_SPEND_LABELS[context.adSpend] ?? context.adSpend)
  if (context.monthlyRevenue) parts.push(REVENUE_LABELS[context.monthlyRevenue] ?? context.monthlyRevenue)
  if (context.averageTicket) parts.push(TICKET_LABELS[context.averageTicket] ?? context.averageTicket)
  return parts.join(' | ')
}

// ─── Chamada 4: estratégia de ticket médio ────────────────────────────────────

async function generateTicketStrategy(
  genAI: GoogleGenerativeAI,
  context: Partial<StoreContext>,
): Promise<TicketStrategy | undefined> {
  if (!context.averageTicket || !context.niche) return undefined

  const niche = NICHE_LABELS[context.niche] ?? context.niche
  const ticketLabel = TICKET_LABELS[context.averageTicket] ?? context.averageTicket
  const revenueLabel = context.monthlyRevenue ? REVENUE_LABELS[context.monthlyRevenue] : null
  const platform = context.platform ?? null

  const prompt = `Você é um consultor de crescimento especializado em e-commerce brasileiro, focado em aumentar o valor médio por pedido.

Perfil da loja:
- Nicho: ${niche}
- Ticket médio atual: ${ticketLabel}
${platform ? `- Plataforma: ${platform}` : ''}
${revenueLabel ? `- Faturamento: ${revenueLabel}` : ''}

Crie 4 estratégias práticas e específicas para aumentar o ticket médio dessa loja.

REGRAS ABSOLUTAS:
- Escreva em português claro, para o dono da loja — não para um consultor
- ZERO termos técnicos em inglês sem explicação (sem "upsell", "cross-sell", "bundle", "capsule wardrobe", etc.)
- Se precisar usar um conceito, explique com palavras simples: "venda conjunta de produtos" ao invés de "cross-sell"
- Cada estratégia deve ser concreta e específica para o nicho de ${niche}
- Use números reais: percentuais, faixas de preço, quantidade de itens
- A meta deve ser realista: aumentar o ticket em 30–60%

Responda APENAS em JSON válido:
{
  "goal": "Meta: de R$X → R$Y por pedido (calcule baseado no ticket atual)",
  "tips": [
    { "title": "título curto (máximo 6 palavras)", "description": "2-3 frases práticas e específicas para ${niche} com números concretos" },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}`

  try {
    const text = await generateWithFallback(genAI, prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return undefined
    const parsed = JSON.parse(jsonMatch[0]) as { goal?: string; tips?: { title: string; description: string }[] }
    if (!parsed.goal || !Array.isArray(parsed.tips)) return undefined
    return {
      goal: parsed.goal,
      tips: parsed.tips.slice(0, 4).map(t => ({ title: t.title, description: t.description })),
    }
  } catch (e) {
    console.warn('Gemini ticket strategy failed:', e)
    return undefined
  }
}

// ─── Resultado final ─────────────────────────────────────────────────────────

type GeminiResult = {
  visualIssues: Issue[]
  executiveSummary: string
  adAnalysis?: AdAnalysis
  correctedCategories: CategoryResult[]
  ticketStrategy?: TicketStrategy
}

// ─── Validação Técnica de Falsos Positivos via IA ────────────────────────────

async function correctTechnicalAnalysisWithGemini(
  genAI: GoogleGenerativeAI,
  screenshot: string,
  categories: CategoryResult[],
  context: Partial<StoreContext>,
): Promise<CategoryResult[]> {
  const niche = context.niche ?? 'outro'
  const contextText = buildContextText(context)
  const imageData = screenshot.replace(/^data:image\/\w+;base64,/, '')

  // Filtramos apenas as categorias que analisamos via crawler estático na homepage e que dependem do DOM visual
  const categoriesToValidate = categories.filter(c => ['conversion', 'trust', 'ux'].includes(c.category))
  if (categoriesToValidate.length === 0) return categories

  const technicalAuditText = categoriesToValidate.map(cat => {
    const catIssues = cat.issues.map(i => `- [${i.severity.toUpperCase()}] Título: "${i.title}" | Descrição: "${i.description}" | Causa: "${i.cause}"`).join('\n')
    return `Categoria: ${cat.category} (Pontuação Estática Atual: ${cat.score}/100)\nProblemas apontados pelo crawler estático:\n${catIssues || '- Nenhum problema apontado'}`
  }).join('\n\n')

  const prompt = `Você é um Engenheiro de QA Visual e Especialista em CRO (Otimização de Conversão) sênior para e-commerce brasileiro.
Sua tarefa é analisar o screenshot real da homepage de uma loja virtual e validar se os problemas apontados pelo crawler técnico estático abaixo são REAIS ou FALSOS POSITIVOS.

Contexto da Loja: ${contextText || 'Não informado'}

SOBRE FALSOS POSITIVOS:
O crawler lê apenas o HTML estático bruto enviado pelo servidor. Ele gera muitos FALSOS POSITIVOS em sites dinâmicos (feitos em Shopify, Nuvemshop, React/Next.js, Loja Integrada), alegando que elementos básicos estão ausentes (como botão de compra, preços, sacola no menu, CNPJ, telefone de contato, etc.) apenas porque esses elementos são carregados via JavaScript ou imagens após o carregamento inicial. O screenshot mostra a página 100% carregada e renderizada para um usuário humano.

INSTRUÇÕES DE ANÁLISE:
1. Examine com atenção o screenshot.
2. Para cada problema listado na auditoria estática abaixo, avalie se ele contradiz o que está visível na captura de tela:
   - "Nenhum botão de compra claro" é FALSO POSITIVO se você enxergar algum botão de "Comprar", "Adicionar ao carrinho", "Adicionar", "Escolher opções" ou similar nos produtos ou no banner.
   - "Preços não aparecem" é FALSO POSITIVO se você enxergar valores em R$ na tela da homepage (em vitrines ou banners).
   - "Ícone de carrinho não identificado" é FALSO POSITIVO se você visualizar um ícone de sacola, carrinho ou cesta no cabeçalho.
   - "Sem telefone ou WhatsApp visível" é FALSO POSITIVO se você vir um botão flutuante de WhatsApp, ou um número de WhatsApp/telefone escrito no cabeçalho ou rodapé.
   - "CNPJ não encontrado" é FALSO POSITIVO se você enxergar o CNPJ escrito no rodapé do site.
   - "Redes sociais não linkadas" é FALSO POSITIVO se existirem links/ícones visíveis para Instagram, Facebook, etc.
3. Se um problema for FALSO POSITIVO:
   - Remova-o da lista de problemas.
   - Restaure os pontos associados a ele, elevando a pontuação (score) daquela categoria.
4. Se o problema for REAL (ex: o site realmente não exibe preços ou realmente não tem WhatsApp visível de nenhuma forma na imagem), mantenha o problema e a respectiva dedução de pontuação.
5. Se o site estiver totalmente em branco, quebrado ou bloqueado no screenshot (imagem cinza ou de erro), NÃO marque como falso positivo e mantenha os alertas técnicos.
6. Decida o score corrigido final (0 a 100) para cada categoria auditada (conversion, trust, ux) com base no estado visual real. Se a categoria estiver excelente, atribua uma nota alta (90 a 100).

Relatório Técnico Estático a Validar:
${technicalAuditText}

Responda APENAS com um objeto JSON válido, sem texto introdutório ou explicativo. Respeite estritamente este formato:
{
  "categories": [
    {
      "category": "conversion",
      "score": 95,
      "issues": [
        {
          "title": "título curto do problema real mantido",
          "description": "descrição simples do impacto real",
          "severity": "critical|warning",
          "cause": "causa técnica real identificada"
        }
      ]
    },
    {
      "category": "trust",
      "score": 88,
      "issues": [...]
    },
    {
      "category": "ux",
      "score": 92,
      "issues": [...]
    }
  ]
}`

  try {
    const text = await generateWithFallback(genAI, [
      prompt,
      { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
    ])
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return categories

    const parsed = JSON.parse(jsonMatch[0]) as {
      categories?: {
        category: string
        score: number
        issues: { title: string; description: string; severity: string; cause: string }[]
      }[]
    }

    if (!parsed.categories || !Array.isArray(parsed.categories)) return categories

    // Map back into original categories list, replacing the validated ones
    return categories.map(cat => {
      const corrected = parsed.categories!.find(c => c.category === cat.category)
      if (corrected) {
        return {
          category: cat.category,
          score: Math.min(100, Math.max(0, corrected.score)),
          issues: corrected.issues.map(item => ({
            title: item.title,
            description: item.description,
            severity: (['critical', 'warning', 'ok'].includes(item.severity) ? item.severity : 'warning') as Issue['severity'],
            cause: item.cause,
          }))
        }
      }
      return cat
    })
  } catch (e) {
    console.warn('Gemini technical validation layer failed, using raw results:', e)
    return categories
  }
}

// ─── Chamada 1: análise visual ───────────────────────────────────────────────

async function generateVisualAnalysis(
  genAI: GoogleGenerativeAI,
  screenshot: string,
  context: Partial<StoreContext>,
): Promise<Issue[]> {
  const niche = context.niche ?? 'outro'
  const contextText = buildContextText(context)
  const nicheFocus = NICHE_VISUAL_FOCUS[niche] ?? NICHE_VISUAL_FOCUS.outro
  const benchmarks = NICHE_BENCHMARKS[niche] ?? NICHE_BENCHMARKS.outro
  const imageData = screenshot.replace(/^data:image\/\w+;base64,/, '')

  const prompt = `Você é um consultor de elite em CRO (Otimização de Conversão) e Design de E-commerce brasileiro, com 15 anos de experiência auditando lojas virtuais no nicho de ${NICHE_LABELS[niche] ?? 'varejo'}.

Sua missão é fazer uma auditoria visual de alta profundidade no screenshot da homepage deste e-commerce.

Contexto da loja: ${contextText || 'não informado'}

Evite conselhos genéricos e superficiais. Faça críticas específicas sobre a estrutura que você enxerga no screenshot, comparando diretamente com os benchmarks do mercado e as referências do segmento: ${benchmarks.topStores}.

Examine minuciosamente:
1. PRIMEIRA IMPRESSÃO (Hero Section) — A proposta de valor é clara em 3 segundos? O banner comunica claramente o produto principal? Existe um botão de CTA em destaque "above the fold" (visível sem rolar)?
2. VITRINE E PRODUTOS — As fotos dos produtos são profissionais, têm contraste e mostram o produto com clareza? O preço e a facilidade de parcelamento estão visualmente destacados? A disposição dos produtos é organizada ou parece bagunçada?
3. SINALIZAÇÃO E DESIGN — O menu de navegação é limpo e legível? Os ícones (carrinho, busca) são fáceis de encontrar? Há um excesso de banners ou pop-ups poluindo a tela e dispersando a atenção do comprador?
4. CONFIANÇA VISUAL — O design passa profissionalismo e segurança ou parece amador? A paleta de cores é harmoniosa?
5. GATILHOS VISUAIS — Há elementos de prova social (estrelas, depoimentos com fotos, selos de segurança) ou de escassez (banners de oferta, tags de desconto) que chamam a atenção visualmente?

${nicheFocus}

REGRAS CRÍTICAS:
- Seja extremamente específico. Em vez de "melhore seus banners", diga: "O banner principal não tem botão de CTA com cor contrastante acima da dobra — visitantes que chegam pelo anúncio não encontram o próximo passo e saem."
- Para cada problema, conecte ao impacto de receita: "isso eleva o abandono de carrinho", "reduz o ROAS dos anúncios", "diminui a taxa de conversão em X pontos percentuais".
- NÃO mencione a palavra "screenshot" ou "imagem". Fale como se estivesse navegando na loja: "Sua vitrine de produtos..."
- Responda apenas em português brasileiro, tom consultivo profissional e direto ao ponto.

Responda APENAS em JSON (um array de objetos):
[
  {
    "title": "título curto e impactante em maiúsculas (máximo 5 palavras)",
    "description": "explicação profunda e em linguagem de negócio sobre como esse problema visual prejudica as vendas e o ROAS",
    "severity": "critical|warning",
    "cause": "detalhamento visual do que está incorreto ou ausente na interface"
  }
]`

  try {
    const text = await generateWithFallback(genAI, [
      prompt,
      { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
    ])
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0]) as { title: string; description: string; severity: string; cause: string }[]
    return parsed.slice(0, 6).map(item => ({
      title: `👁️ ANÁLISE VISUAL: ${item.title}`,
      description: item.description,
      severity: (['critical', 'warning', 'ok'].includes(item.severity) ? item.severity : 'warning') as Issue['severity'],
      cause: item.cause,
    }))
  } catch (e) {
    console.warn('Gemini visual analysis failed:', e)
    return []
  }
}

// ─── Chamada 2: sumário executivo ────────────────────────────────────────────

async function generateExecutiveSummary(
  genAI: GoogleGenerativeAI,
  categories: CategoryResult[],
  url: string,
  context: Partial<StoreContext>,
): Promise<string> {
  const niche = context.niche ?? 'outro'
  const contextText = buildContextText(context)
  const benchmarks = NICHE_BENCHMARKS[niche] ?? NICHE_BENCHMARKS.outro

  const criticalIssues = categories
    .flatMap(c => c.issues.filter(i => i.severity === 'critical'))
    .slice(0, 6)
    .map(i => `- ${i.title}: ${i.description}`)
    .join('\n')

  const warningIssues = categories
    .flatMap(c => c.issues.filter(i => i.severity === 'warning'))
    .slice(0, 4)
    .map(i => `- ${i.title}`)
    .join('\n')

  const scoresText = categories.map(c => `${c.category}: ${c.score}/100`).join(', ')

  const hasAdSpend = context.adSpend && context.adSpend !== 'nenhum'
  const adSpendContext = hasAdSpend
    ? `A loja ${AD_SPEND_LABELS[context.adSpend!]} — os problemas identificados estão diretamente reduzindo a eficiência e o ROAS (Retorno sobre Investimento em Anúncios) desse investimento diário.`
    : 'A loja não investe em anúncios pagos no momento.'

  const prompt = `Você é um Consultor de Crescimento e Especialista em E-commerce brasileiro sênior, reconhecido por análises que combinam dados técnicos com impacto financeiro real.

Escreva um diagnóstico comercial direto e contundente para o dono da loja com base na auditoria profunda realizada.

Dados da Loja:
- URL: ${url}
- ${contextText || 'Contexto de faturamento e nicho não informado'}
- Pontuações por categoria obtidas na auditoria: ${scoresText}

Métricas de Referência para ${NICHE_LABELS[niche]}:
- Taxa de Conversão ideal do segmento: ${benchmarks.conversionRate}
- Abandono de carrinho típico: ${benchmarks.cartAbandonment}
- Ticket Médio do mercado: ${benchmarks.avgTicket}
- ROAS médio do setor: ${benchmarks.roasBenchmark.min}x a ${benchmarks.roasBenchmark.max}x

Problemas Críticos Identificados no Site:
${criticalIssues || 'Nenhum problema crítico detectado.'}

Alertas Importantes:
${warningIssues || 'Nenhum alerta relevante.'}

${adSpendContext}

REGRAS ABSOLUTAS DE ESCRITA:
- NUNCA comece com saudações como "Prezado(a)", "Olá" ou "Caro lojista". Vá direto ao ponto.
- Escreva EXATAMENTE 3 parágrafos curtos, densos e profissionais, em português brasileiro.
- NÃO use listas, tópicos ou títulos. Apenas parágrafos corridos.
- ZERO frases genéricas ou clichês. Cada frase precisa de dado ou número concreto.
- Ao citar problemas críticos, estime o custo financeiro: "o que representa uma perda estimada de R$X–Y mensais".
- O parágrafo 3 deve terminar com uma frase de urgência inequívoca conectando a correção ao ROI dos anúncios.

Estrutura obrigatória dos parágrafos:
1. **Parágrafo 1 — O Diagnóstico Competitivo (comece com um dado de mercado ou benchmark):** Compare diretamente o estado atual da loja com os benchmarks reais do nicho de ${NICHE_LABELS[niche]} e com referências líderes como ${benchmarks.topStores}. Nomeie explicitamente onde a loja está abaixo da média competitiva.
2. **Parágrafo 2 — O Custo do Problema:** Destaque os 2–3 problemas mais severos e quantifique o impacto financeiro real: CAC elevado, ROAS abaixo do benchmark, visitantes que chegam pelo anúncio e saem sem comprar, tráfego orgânico desperdiçado. Use lógica de números: "com X visitantes/mês e taxa de conversão Y% abaixo do mercado, isso representa...".
3. **Parágrafo 3 — O Quick Win de Maior ROI:** Aponte a correção de maior retorno imediato e explique com precisão como ela recupera receita e aumenta o ROAS. Feche com urgência: cada semana sem corrigir é dinheiro saindo da conta para anúncios que não convertem.`

  try {
    return await generateWithFallback(genAI, prompt)
  } catch (e) {
    console.warn('Gemini summary failed:', e)
    return ''
  }
}

// ─── Chamada 3: análise de tráfego pago ──────────────────────────────────────

async function generateAdAnalysis(
  genAI: GoogleGenerativeAI,
  categories: CategoryResult[],
  context: Partial<StoreContext>,
  overallScore: number,
): Promise<AdAnalysis | undefined> {
  const niche = context.niche ?? 'outro'
  const benchmarks = NICHE_BENCHMARKS[niche] ?? NICHE_BENCHMARKS.outro
  const noAdSpend = !context.adSpend || context.adSpend === 'nenhum'

  const adSpendMid = context.adSpend ? (AD_SPEND_MIDPOINTS[context.adSpend] ?? 0) : 0
  const revenueMid = context.monthlyRevenue ? (REVENUE_MIDPOINTS[context.monthlyRevenue] ?? 0) : 0
  const roas = adSpendMid > 0 && revenueMid > 0 ? parseFloat((revenueMid / adSpendMid).toFixed(1)) : null

  const roasBenchmark = benchmarks.roasBenchmark

  let roasAssessment: AdAnalysis['roasAssessment'] = 'regular'
  if (roas !== null) {
    if (roas >= roasBenchmark.max * 1.2) roasAssessment = 'excelente'
    else if (roas >= roasBenchmark.min) roasAssessment = 'bom'
    else if (roas >= roasBenchmark.min * 0.6) roasAssessment = 'regular'
    else roasAssessment = 'ruim'
  }

  const topIssues = categories
    .flatMap(c => c.issues.filter(i => i.severity === 'critical'))
    .slice(0, 5)
    .map(i => `- ${i.title}: ${i.description}`)
    .join('\n')

  const contextText = buildContextText(context)

  const prompt = noAdSpend
    ? `Você é um Especialista em Tráfego Pago e Growth de e-commerce brasileiro, especializado em Meta Ads e Google Shopping.

Esta loja ainda não investe em anúncios pagos. Crie um guia de entrada em tráfego pago personalizado para o nicho de ${NICHE_LABELS[niche]}.

Contexto da loja: ${contextText || 'não informado'}
Score do site: ${overallScore}/100
Problemas identificados no site que devem ser corrigidos ANTES de iniciar anúncios:
${topIssues || 'Nenhum problema crítico identificado.'}

${BR_MARKET_CONTEXT}

REGRAS ABSOLUTAS:
- ZERO termos técnicos sem explicação. Explique "CBO" como "orçamento centralizado no nível da campanha", "remarketing" como "anúncios para quem já visitou a loja", etc.
- Seja específico para o nicho de ${NICHE_LABELS[niche]} — nomes de produtos, situações reais de compra, linguagem do consumidor deste segmento
- Use números reais: ROAS médio do setor, custo por clique estimado, orçamento de teste

Responda EXATAMENTE em formato JSON (objeto), sem texto introdutório ou explicativo:
{
  "roasComment": "Por que vale a pena anunciar neste nicho: cite o ROAS médio de ${roasBenchmark.min}x–${roasBenchmark.max}x do setor de ${NICHE_LABELS[niche]}, o que significa em reais (ex: para cada R$1.000 investido, a loja pode faturar R$X.000), e quais problemas do site precisam ser corrigidos antes de ligar os anúncios para não perder dinheiro. 2–3 frases com números concretos.",
  "adLandingFixes": [
    { "title": "Primeiro ponto a corrigir antes de anunciar (máximo 5 palavras)", "description": "Problema específico identificado no site que vai desperdiçar verba publicitária se não for corrigido primeiro — explique o impacto em conversão.", "priority": "alta" },
    { "title": "Segundo ponto crítico pré-anúncio", "description": "Segundo ajuste necessário para não queimar orçamento de teste.", "priority": "alta" },
    { "title": "Canal inicial recomendado para ${NICHE_LABELS[niche]}", "description": "Qual plataforma de anúncios começar (Meta Ads, Google Shopping, TikTok Ads) e por que faz sentido para este nicho — com orçamento mínimo recomendado para teste.", "priority": "média" }
  ],
  "creativeIdeas": [
    { "concept": "Ideia de vídeo para o primeiro anúncio em ${NICHE_LABELS[niche]}", "description": "Roteiro específico: o que mostrar nos primeiros 3 segundos, o gancho principal e a frase de encerramento com chamada para ação — adaptado para o consumidor deste nicho.", "format": "video" },
    { "concept": "Carrossel de produtos em destaque para ${NICHE_LABELS[niche]}", "description": "Como estruturar o carrossel: qual produto colocar primeiro, o que mostrar em cada card (foto + preço + parcelas) para gerar cliques qualificados neste segmento.", "format": "carrossel" },
    { "concept": "Anúncio de oferta de entrada para atrair o primeiro cliente", "description": "Imagem simples com oferta irresistível (frete grátis na primeira compra, desconto especial ou brinde) — linguagem e visual específicos para ${NICHE_LABELS[niche]}.", "format": "imagem" }
  ],
  "audienceStrategy": [
    "Público inicial para Meta Ads em ${NICHE_LABELS[niche]}: tamanho recomendado de público, interesses principais, faixa etária e localização para o primeiro teste.",
    "Orçamento e duração do teste: quanto investir por dia no início, quanto tempo rodar antes de avaliar os resultados, e como saber se o anúncio está funcionando."
  ]
}`
    : `Você é um Gestor de Tráfego e Especialista em Growth de alta performance, especializado no ecossistema de e-commerce brasileiro (Meta Ads, Google Shopping, CBO, Advantage+, campanhas de catálogo dinâmico).

Faça uma análise estratégica de anúncios reais baseada nos dados comerciais fornecidos.

Dados Comerciais da Loja:
- Nicho: ${NICHE_LABELS[niche]}
- Plataforma do site: ${context.platform ?? 'Não informada'}
- Segmentação do lojista: ${contextText}
- Score da auditoria do site: ${overallScore}/100 (um score baixo significa que o tráfego pago está vazando pelo site sem converter)
- ROAS Atual Estimado (MER): ${roas !== null ? `${roas}x` : 'Não calculável'}
- ROAS Médio de Referência no Mercado: ${roasBenchmark.min}x a ${roasBenchmark.max}x
- Avaliação de ROAS: ${roasAssessment.toUpperCase()}

${BR_MARKET_CONTEXT}

Problemas Técnicos e de Conversão no site que estão prejudicando a performance dos anúncios:
${topIssues || 'Nenhum problema crítico apontado.'}

REGRAS ABSOLUTAS:
- ZERO termos técnicos sem explicação (explique "CBO" como "orçamento centralizado", "DPA" como "anúncio dinâmico de catálogo", etc.)
- Seja específico para o nicho de ${NICHE_LABELS[niche]} — cite produtos reais, situações de compra, linguagem do consumidor
- Use números reais em R$: calcule o desperdício de verba baseado no gasto declarado

Responda EXATAMENTE em formato JSON (objeto), sem texto introdutório ou explicativo:
{
  "roasComment": "Diagnóstico financeiro direto sobre o ROAS atual: compare com o benchmark do setor de ${NICHE_LABELS[niche]} (${roasBenchmark.min}x–${roasBenchmark.max}x), calcule o desperdício estimado em reais por mês com base no gasto declarado, e explique por que os problemas do site estão inflando o custo por venda. 2–3 frases com números concretos.",
  "adLandingFixes": [
    { "title": "Mudança prioritária no site para anúncios (máximo 5 palavras)", "description": "Como essa correção específica vai reduzir o custo por clique não convertido e aumentar o retorno sobre o investimento em anúncios.", "priority": "alta" },
    { "title": "Ajuste para mobile ou checkout", "description": "Correção para capturar o tráfego mobile que hoje clica no anúncio e abandona a loja por fricção — com estimativa de recuperação.", "priority": "alta" },
    { "title": "Gatilho ou oferta para remarketing", "description": "Ajuste na homepage para reativar quem clicou no anúncio e não comprou — retargeting é 3x mais barato que tráfego frio neste nicho.", "priority": "média" }
  ],
  "creativeIdeas": [
    { "concept": "Ideia de vídeo específica para ${NICHE_LABELS[niche]}", "description": "Roteiro concreto: gancho nos primeiros 3 segundos, o que mostrar no meio (prova social, produto em uso, resultado) e chamada para ação final — adaptado para o consumidor deste nicho.", "format": "video" },
    { "concept": "Carrossel de oferta ou comparativo para ${NICHE_LABELS[niche]}", "description": "Estrutura do carrossel: qual produto destacar primeiro, o que mostrar em cada card (benefício + preço + prova) para gerar cliques qualificados neste segmento.", "format": "carrossel" },
    { "concept": "Anúncio de gancho/dor do cliente", "description": "Imagem impactante focada na dor que o produto resolve para o consumidor de ${NICHE_LABELS[niche]} — linguagem e visual que geram desejo antes mesmo de entrar no site.", "format": "imagem" }
  ],
  "audienceStrategy": [
    "Estrutura de campanha recomendada para ${NICHE_LABELS[niche]}: como organizar públicos frios (interesses amplos) e quentes (visitantes e compradores anteriores) para maximizar o ROAS com o orçamento atual.",
    "Campanha de reengajamento para quem clicou no anúncio mas não comprou: qual oferta usar (desconto, frete grátis, bônus), duração da janela de remarketing e orçamento recomendado."
  ]
}`

  try {
    const text = await generateWithFallback(genAI, prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return buildFallbackAdAnalysis(roas, roasBenchmark, roasAssessment)

    const parsed = JSON.parse(jsonMatch[0]) as {
      roasComment?: string
      adLandingFixes?: { title: string; description: string; priority: string }[]
      creativeIdeas?: { concept: string; description: string; format: string }[]
      audienceStrategy?: string[]
    }

    return {
      roas,
      roasBenchmark,
      roasAssessment,
      roasComment: parsed.roasComment ?? '',
      adLandingFixes: (parsed.adLandingFixes ?? []).slice(0, 3).map(f => ({
        title: f.title,
        description: f.description,
        priority: (['alta', 'média'].includes(f.priority) ? f.priority : 'média') as AdRecommendation['priority'],
      })),
      creativeIdeas: (parsed.creativeIdeas ?? []).slice(0, 3).map(c => ({
        concept: c.concept,
        description: c.description,
        format: (['video', 'carrossel', 'imagem'].includes(c.format) ? c.format : 'imagem') as CreativeIdea['format'],
      })),
      audienceStrategy: (parsed.audienceStrategy ?? []).slice(0, 3),
    }
  } catch (e) {
    console.warn('Gemini ad analysis failed, using fallback:', e)
    return buildFallbackAdAnalysis(roas, roasBenchmark, roasAssessment)
  }
}

function buildFallbackAdAnalysis(
  roas: number | null,
  roasBenchmark: { min: number; max: number },
  roasAssessment: AdAnalysis['roasAssessment'],
): AdAnalysis {
  return {
    roas,
    roasBenchmark,
    roasAssessment,
    roasComment: '',
    adLandingFixes: [],
    creativeIdeas: [],
    audienceStrategy: [],
  }
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function analyzeWithGemini(
  screenshot: string | undefined,
  categories: CategoryResult[],
  url: string,
  context: Partial<StoreContext> = {},
  overallScore: number = 0,
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { visualIssues: [], executiveSummary: '', adAnalysis: undefined, correctedCategories: categories }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Todos os 5 calls Gemini em paralelo para minimizar latência.
  const [correctedCategories, visualIssues, executiveSummary, adAnalysis, ticketStrategy] = await Promise.all([
    screenshot
      ? correctTechnicalAnalysisWithGemini(genAI, screenshot, categories, context)
      : Promise.resolve(categories),
    screenshot
      ? generateVisualAnalysis(genAI, screenshot, context)
      : Promise.resolve([]),
    generateExecutiveSummary(genAI, categories, url, context),
    generateAdAnalysis(genAI, categories, context, overallScore),
    generateTicketStrategy(genAI, context),
  ])

  return { visualIssues, executiveSummary, adAnalysis, correctedCategories, ticketStrategy }
}
