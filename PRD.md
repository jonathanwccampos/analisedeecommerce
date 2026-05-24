# PRD — Analisador de E-commerce
**Versão:** 1.2  
**Data:** 23 de maio de 2026  
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

### Problema
Donos de e-commerce no Brasil perdem vendas todo dia por problemas técnicos, de SEO e de experiência do usuário que eles não sabem que existem. Sem um diagnóstico claro, eles não sabem por onde começar a melhorar — e raramente procuram consultoria por conta própria.

### Solução
Uma ferramenta web gratuita que analisa qualquer e-commerce automaticamente a partir da URL, gera um relatório de auditoria profissional com score, problemas detalhados e impacto financeiro estimado, e converte o dono da loja em lead qualificado para uma consultoria gratuita.

### Objetivo de negócio
Capturar leads de donos de e-commerce interessados em melhorar suas lojas e convertê-los em clientes de consultoria via WhatsApp. O relatório é o argumento de venda — mostra credibilidade e urgência antes de qualquer conversa.

---

## 2. Público-alvo

Donos e gestores de e-commerces brasileiros de pequeno e médio porte que:
- Têm loja própria (Shopify, WooCommerce, Tray, Nuvemshop, VTEX, loja customizada)
- Sentem que as vendas estão abaixo do esperado mas não sabem o motivo técnico
- Não têm equipe de tecnologia ou marketing especializada

---

## 3. Jornada do Usuário

```
[Landing Page]
    ↓ digita URL
[Loading — ~20s]
    ↓ análise concluída
[Score Reveal]
    Score + notas por categoria visíveis
    Detalhes bloqueados
    ↓ preenche nome + email
[Gate de Email]
    ↓ lead salvo no Supabase
[Relatório Completo]
    Auditoria detalhada por categoria
    Top 3 prioridades
    Estimativa de impacto financeiro
    ↓ clica no CTA
[WhatsApp]
    Mensagem pré-preenchida abre conversa de consultoria
```

### Regras da jornada
- O score geral e as notas de cada categoria são **sempre visíveis** sem email
- O detalhamento dos problemas (causa, impacto, severidade) só é revelado **após captura de email**
- O 3º problema de cada categoria aparece **borrado** mesmo no relatório completo — é revelado apenas na consultoria
- A análise é **por URL, não requer login ou cadastro prévio**
- Cada URL analisada gera um ID único — o resultado fica acessível pelo link por **7 dias**

---

## 4. Telas

### 4.1 Landing Page (`/`)
- Headline focada em dor: *"Descubra o que está travando as vendas do seu e-commerce"*
- Subcopy com prova social dinâmica: *"Análise gratuita em 30 segundos · Já analisamos +[contador real] e-commerces brasileiros"*
  - O contador é o número real de análises na tabela `analyses` do banco — começa em 0 e cresce organicamente
  - Exibir apenas quando atingir 10+ análises; antes disso, mostrar só *"Análise gratuita em 30 segundos"*
- Campo de input para URL + botão "Analisar agora →"
- Validação de URL antes de submeter (deve ser uma URL válida com http/https)

### 4.2 Loading (`/analisando/[id]`)
- Barra de progresso animada
- Lista de verificações sendo executadas em tempo real (via polling)
- Mensagens de progresso: *"Verificando velocidade... ✅ Analisando SEO... ⏳"*
- Tempo estimado: 15–25 segundos

### 4.3 Score Reveal (`/resultado/[id]`)
**Seção pública (sem email):**
- Score geral em destaque (0–100) com classificação: CRÍTICO (0–39) / ALERTA (40–69) / BOM (70–100)
- **Nível de maturidade** exibido junto ao score:
  - 0–39 → **Iniciante** — *"Sua loja precisa de atenção nos fundamentos"*
  - 40–69 → **Em Crescimento** — *"Boa base, mas há perdas significativas acontecendo"*
  - 70–100 → **Avançado** — *"Loja saudável, foco em otimização fina"*
- Benchmark: *"Sua loja está abaixo de X% dos e-commerces brasileiros"*
- Grade com os 6 scores de categoria e número de problemas encontrados
- Contador: *"Encontramos 24 problemas no seu e-commerce"*

**Gate de Email:**
- Título: *"Digite seu email para ver exatamente o que está custando suas vendas"*
- Campos:
  - Nome (obrigatório)
  - Email (obrigatório)
  - WhatsApp (opcional) — label: *"WhatsApp (opcional — para te avisarmos das prioridades)"*
- CTA: *"Ver relatório completo →"*
- Microcopy: *"Sem spam. Apenas seu relatório."*
- O WhatsApp capturado é salvo na tabela `leads` e permite contato direto antes mesmo do clique no botão final

### 4.4 Relatório Completo (`/resultado/[id]` — pós-email)

**Cabeçalho do documento:**
- URL analisada, data, total de problemas
- Score em destaque com cor por criticidade
- Benchmark vs. mercado

**Sumário Executivo:**
- Parágrafo descrevendo os principais achados
- Estimativa de perda de receita mensal em R$ (calculada com base nos problemas críticos encontrados)

**Seções por categoria** (repetidas para as 6 áreas):
- Nome da categoria + score + barra visual
- Cada problema contém:
  - Nível de severidade: `CRÍTICO` (vermelho) / `ALERTA` (laranja) / `OK` (verde)
  - Título do problema
  - Descrição do impacto no negócio (em linguagem não-técnica)
  - Causa identificada (técnica, mas explicada)
  - Dado mensurável quando disponível (ex: *"carrega em 7.2s — limite recomendado: 2.5s"*)
- Os **2 primeiros problemas** de cada categoria são exibidos em detalhe completo
- O **3º problema em diante** aparece borrado com texto: *"Revelado na consultoria gratuita"* — se a categoria tiver apenas 1 ou 2 problemas, nenhum fica borrado

**Top 3 Prioridades:**
- Os 3 problemas de maior impacto ordenados por retorno esperado
- Cada item mostra: o problema + o benefício de corrigir

**CTA Final:**
- Bloco em destaque (verde escuro)
- Título: *"Quer resolver esses [N] problemas?"*
- Subcopy: *"Em 30 minutos de consultoria gratuita, priorizamos o que vai gerar mais resultado no seu caso"*
- Botão: *"📱 Agendar consultoria gratuita no WhatsApp"*
- Abre `wa.me/[número]?text=` com mensagem pré-preenchida incluindo URL da loja e score
- Microcopy: *"Sem compromisso · 100% gratuito · Resposta em até 2h"*

---

## 5. Motor de Análise

### Como funciona (código + Gemini grátis)

A análise combina **verificações técnicas automatizadas** com **IA visual gratuita** via Gemini 1.5 Flash. O Gemini entra em dois momentos específicos, usando o tier gratuito do Google (1.500 req/dia).

```
Usuário digita URL
      ↓
[PARALELO]
├── PageSpeed API → velocidade, CWV, score, screenshot da página
├── Fetch + Cheerio → SEO, confiança, UX, conversão (código puro)
└── Fetch mobile → score mobile
      ↓
[GEMINI 1.5 FLASH — GRÁTIS]
├── Recebe o screenshot retornado pelo PageSpeed
│   └── Analisa visualmente: CTAs, design, imagens, prova social, checkout
└── Recebe todos os dados técnicos coletados
    └── Gera o Sumário Executivo personalizado em linguagem natural
      ↓
Relatório completo exibido ao usuário
```

**Por que o Gemini e não outra IA?**
- Tier gratuito generoso: **1.500 análises/dia sem custo**
- Suporta visão (análise de imagens/screenshots)
- Integração simples via `@google/generative-ai` npm package
- O usuário já tem acesso gratuito

A análise roda em servidor (Next.js API Route) com 6 serviços executados em paralelo via `Promise.all`. Tempo alvo: **15–25 segundos**.

### 5.1 PageSpeedService — Performance & Velocidade
**Fonte:** Google PageSpeed Insights API (gratuita)  
**Checks:**
- LCP (Largest Contentful Paint) — limite: 2.5s
- FID / INP (Interaction to Next Paint) — limite: 200ms
- CLS (Cumulative Layout Shift) — limite: 0.1
- FCP (First Contentful Paint) — limite: 1.8s
- TTFB (Time to First Byte) — limite: 800ms
- Score geral de performance (0–100)
- Imagens sem compressão (peso total acima de 500KB)
- Scripts bloqueantes contados

**Fórmula de score:** Baseada no score do PageSpeed + penalidades por cada CWV reprovado

### 5.2 SeoService — SEO Técnico
**Fonte:** Fetch da URL + parse HTML com Cheerio  
**Checks:**
- Meta title presente e entre 50–60 caracteres
- Meta description presente e entre 120–160 caracteres
- Tag H1 presente (exatamente 1)
- Canonical tag definida
- Open Graph tags (og:title, og:image, og:description)
- Arquivo sitemap.xml acessível em `/sitemap.xml`
- Arquivo robots.txt acessível em `/robots.txt`
- Imagens com atributo `alt` preenchido (% de imagens sem alt)
- URLs amigáveis (sem parâmetros excessivos ou IDs numéricos puros)

### 5.3 MobileService — Mobile & Responsividade
**Fonte:** Google PageSpeed Insights API (mobile) + parse HTML  
**Checks:**
- Score mobile do PageSpeed (0–100)
- Meta viewport presente e correto (`width=device-width, initial-scale=1`)
- Botões e links com tamanho mínimo de 48x48px (via análise do PageSpeed)
- Texto legível sem zoom (tamanho mínimo 16px para body)
- Elementos com largura maior que a tela (overflow horizontal)

### 5.4 ConversionService — Conversão & CRO
**Fonte:** Fetch + parse HTML  
**Checks:**
- Presença de botão de CTA visível na homepage (keywords: "comprar", "adicionar", "buy", "add to cart")
- Preços visíveis na listagem (elementos com classes comuns de preço)
- Imagens de produto presentes (mínimo 1 por item listado)
- Presença de elemento de urgência (countdown, "últimas unidades", "oferta")
- Presença de campo de busca no site
- Link para carrinho visível no header

### 5.5 TrustService — Confiança & Segurança
**Fonte:** Verificação HTTPS + fetch + parse HTML  
**Checks:**
- HTTPS ativo (certificado SSL válido)
- Política de privacidade linkada no rodapé
- Política de troca/devolução linkada
- Informações de contato visíveis (telefone, email ou chat)
- Presença de selos de segurança (Trustee, Site Blindado, Norton, McAfee — via texto ou imagem alt)
- Avaliações de clientes visíveis na homepage ou páginas de produto
- CNPJ visível no rodapé

### 5.6 UxService — UX & Navegação
**Fonte:** Fetch + parse HTML  
**Checks:**
- Menu de navegação presente e com múltiplas categorias
- Breadcrumb presente nas páginas internas
- Rodapé com links organizados
- Links quebrados na homepage (verificação de status HTTP dos links internos, amostragem de 10)
- Favicon definido
- Página 404 customizada (request para URL inexistente retorna conteúdo, não página em branco)

### 5.7 GeminiService — Análise Visual + Sumário Executivo
**Fonte:** Gemini 1.5 Flash API (gratuita — 1.500 req/dia)  
**Quando executa:** após todos os outros 6 serviços concluírem  
**Pacote npm:** `@google/generative-ai`  
**Variável de ambiente:** `GEMINI_API_KEY` (obtida gratuitamente em [aistudio.google.com](https://aistudio.google.com))

**Uso 1 — Análise visual do screenshot:**
- Recebe o screenshot da página retornado pela PageSpeed API (base64)
- Envia para o Gemini com prompt estruturado pedindo avaliação visual de:
  - Qualidade e visibilidade do botão de compra / CTA principal
  - Qualidade das imagens de produto (resolução, contexto, quantidade)
  - Presença e visibilidade de prova social (avaliações, depoimentos, logos)
  - Clareza da proposta de valor na homepage
  - Elementos de urgência visíveis (oferta, prazo, estoque)
  - Primeira impressão geral do design (confiança, profissionalismo)
- Resultado: até 6 observações visuais adicionadas ao relatório com label `👁️ ANÁLISE VISUAL`

**Uso 2 — Sumário Executivo personalizado:**
- Recebe todos os dados técnicos coletados (scores, problemas encontrados, URL)
- Gemini gera 2–3 parágrafos em linguagem natural, não-técnica, descrevendo:
  - O estado geral da loja
  - Os 2–3 problemas mais críticos com impacto em vendas
  - Uma frase de encerramento conectando ao valor da consultoria
- Substitui o sumário executivo template por texto gerado dinamicamente

**Prompt base para análise visual:**
```
Você é um especialista em e-commerce brasileiro. Analise este screenshot de loja virtual
e identifique até 6 problemas visuais que podem estar prejudicando as vendas.
Para cada problema, diga: o que está errado e qual o impacto nas vendas.
Seja direto, use linguagem não-técnica. Foque em: CTAs, imagens de produto,
prova social, proposta de valor, urgência e confiança visual.
```

**Tratamento de erro:** se o Gemini falhar ou atingir rate limit, o relatório é exibido normalmente sem a seção de análise visual — o produto não quebra.

### 5.8 Fórmula de Score Geral

```
Score Geral = (Performance × 0.20) + (SEO × 0.20) + (Mobile × 0.15)
            + (Conversão × 0.20) + (Confiança × 0.15) + (UX × 0.10)
```

**Classificação:**
- 0–39: CRÍTICO (vermelho)
- 40–69: ALERTA (laranja)
- 70–100: BOM (verde)

### 5.9 Benchmark vs. Mercado

O percentual exibido (*"sua loja está abaixo de X% dos e-commerces brasileiros"*) é calculado assim:

- **v1 (lançamento):** usa faixas fixas pré-definidas com base em estudos de mercado:
  - Score 0–30 → "abaixo de 92%"
  - Score 31–40 → "abaixo de 83%"
  - Score 41–55 → "abaixo de 68%"
  - Score 56–69 → "abaixo de 45%"
  - Score 70–84 → "acima de 60%"
  - Score 85–100 → "top 10%"
- **v2 (com dados):** percentil real calculado sobre todas as análises já realizadas na plataforma

### 5.8 Estimativa de Impacto Financeiro

Calculada no Sumário Executivo com base nos problemas críticos encontrados:

| Problema Crítico | Impacto Estimado/mês |
|---|---|
| Velocidade acima de 5s | R$ 2.000–5.000 (52% abandono) |
| Score mobile < 40 | R$ 1.000–3.000 (60%+ do tráfego é mobile) |
| Sem HTTPS | R$ 500–1.500 (aviso do Chrome afasta usuários) |
| CWV reprovados | R$ 800–2.000 (queda no ranking do Google) |
| Sem meta descriptions | R$ 300–800 (CTR orgânico reduzido) |

O total é a soma dos problemas críticos encontrados, apresentado como range: *"entre R$ X e R$ Y/mês"*.

---

## 6. Arquitetura Técnica

### 6.1 Stack
| Camada | Tecnologia | Custo |
|---|---|---|
| Frontend + Backend | Next.js 14 (App Router) + TypeScript | Grátis |
| Estilização | Tailwind CSS | Grátis |
| Deploy | Vercel (free tier) | Grátis |
| Banco de dados | Supabase (PostgreSQL) | Grátis até 50k rows |
| API de análise técnica | Google PageSpeed Insights API | Grátis |
| Scraping | Fetch nativo + Cheerio | Grátis |
| **IA visual + sumário** | **Gemini 1.5 Flash API** | **Grátis (1.500 req/dia)** |

### 6.2 Estrutura de Rotas (Next.js App Router)

```
app/
├── page.tsx                    # Landing page (input de URL)
├── analisando/
│   └── [id]/page.tsx           # Loading screen
├── resultado/
│   └── [id]/page.tsx           # Score reveal + gate + relatório
└── api/
    ├── analisar/route.ts       # POST — inicia análise
    ├── analise/[id]/route.ts   # GET — status e resultado
    └── lead/route.ts           # POST — salva lead
```

### 6.3 API Routes

**POST `/api/analisar`**
```
Body: { url: string }
Response: { id: string }
Ação: valida URL, cria registro em analyses (status: "processing"),
      dispara análise assíncrona, retorna id imediatamente
```

**GET `/api/analise/[id]`**
```
Response: {
  status: "processing" | "completed" | "error",
  progress: { category: string, done: boolean }[],
  result?: AnalysisResult
}
```

**POST `/api/lead`**
```
Body: { analysis_id: string, name: string, email: string, whatsapp?: string }
Response: { ok: boolean }
Ação: salva lead no Supabase (whatsapp pode ser null), marca análise como "lead_captured"
```

### 6.4 Banco de Dados (Supabase)

**Tabela `analyses`**
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
url          TEXT NOT NULL
status       TEXT DEFAULT 'processing'  -- processing | completed | error
overall_score INTEGER
expires_at   TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
created_at   TIMESTAMP DEFAULT NOW()
```

**Tabela `analysis_results`**
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
analysis_id  UUID REFERENCES analyses(id)
category     TEXT  -- performance | seo | mobile | conversion | trust | ux
score        INTEGER
issues       JSONB  -- array de Issue objects
```

**Tabela `leads`**
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
analysis_id       UUID REFERENCES analyses(id)
name              TEXT
email             TEXT
whatsapp          TEXT  -- número capturado no gate (opcional, pode ser NULL)
whatsapp_clicked  BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP DEFAULT NOW()
```

### 6.5 Tipos TypeScript Principais

```typescript
type Issue = {
  title: string
  description: string      // linguagem não-técnica
  severity: 'critical' | 'warning' | 'ok'
  cause: string            // causa técnica explicada
  metric?: string          // dado mensurável (ex: "7.2s vs 2.5s limite")
}

type CategoryResult = {
  category: 'performance' | 'seo' | 'mobile' | 'conversion' | 'trust' | 'ux'
  score: number
  issues: Issue[]
}

type AnalysisResult = {
  overallScore: number
  classification: 'critical' | 'warning' | 'good'
  benchmark: number        // % de lojas abaixo desta nota
  revenueImpact: { min: number; max: number }
  categories: CategoryResult[]
  topPriorities: Issue[]   // top 3 de maior impacto
}
```

---

## 7. Regras de Negócio

- **Rate limiting:** máximo 5 análises por IP por hora (evita abuso)
- **URLs inválidas:** retornar erro amigável se a URL não for acessível ou não for um e-commerce
- **Tempo máximo de análise:** 45 segundos; após isso, retornar erro com mensagem *"O site demorou muito para responder"*
- **Resultados expiram em 7 dias:** após isso, a URL do resultado redireciona para a landing com mensagem *"Esta análise expirou. Faça uma nova."*
- **Mesmo URL analisada 2x:** gera nova análise (não reutiliza resultado antigo)
- **WhatsApp:** número configurado via variável de ambiente `NEXT_PUBLIC_WHATSAPP_NUMBER`
- **Mensagem pré-preenchida do WhatsApp:**
  ```
  Olá! Acabei de analisar minha loja [URL] e tirei [SCORE]/100.
  Quero agendar a consultoria gratuita.
  ```

---

## 8. Métricas de Sucesso

| Métrica | Meta v1 |
|---|---|
| Taxa de conversão URL → email | > 40% |
| Taxa de conversão email → clique no WhatsApp | > 25% |
| Tempo médio de análise | < 25 segundos |
| Taxa de erro na análise | < 5% |
| Leads capturados/semana | > 10 nas primeiras 4 semanas |

---

## 9. Fora de Escopo (v1)

- Análise visual com IA (screenshot + Claude API) — planejado para v2
- Comparação com concorrentes diretos
- Relatório em PDF para download
- Dashboard do consultor (admin) para ver todos os leads
- Email automático com o relatório
- Login / área do usuário
- Análise de múltiplas páginas (apenas homepage na v1)
- Monitoramento recorrente (análise agendada)

---

## 10. Roadmap

### v1 — MVP (foco deste PRD)
Stack 100% gratuita: Next.js + Vercel + Supabase + PageSpeed API + Cheerio + **Gemini 1.5 Flash**.
Análise técnica automatizada + análise visual via IA gratuita + sumário executivo gerado por IA + gate de email + CTA WhatsApp.

### v2 — Enriquecimento
- Dashboard admin para visualizar e gerenciar leads
- PDF do relatório para download
- Análise de páginas internas (produto, carrinho, checkout) com Gemini

### v3 — Escala
- Email automático com o relatório + sequência de nurturing
- Análise de páginas internas (produto, carrinho, checkout)
- Benchmark por nicho (moda, eletrônicos, alimentos, etc.)
