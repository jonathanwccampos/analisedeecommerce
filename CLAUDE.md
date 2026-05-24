# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce analyzer tool for Brazilian store owners. User inputs a URL, the app runs a full technical + visual audit, shows a score, gates the detailed report behind email capture, and converts leads to WhatsApp consultations. See `PRD.md` for full product specification.

## Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Deploy | Vercel (free tier) |
| Database | Supabase (PostgreSQL) |
| Performance/Mobile | Google PageSpeed Insights API (free, no key needed) |
| HTML scraping | Fetch nativo + Cheerio |
| AI analysis | Gemini 1.5 Flash via `@google/generative-ai` |

## Development Commands

```bash
npm run dev       # start dev server
npm run build     # production build
npm run lint      # lint
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=               # from aistudio.google.com (free)
NEXT_PUBLIC_WHATSAPP_NUMBER=  # format: 5511999999999
```

## App Router Structure

```
app/
├── page.tsx                    # Landing — URL input
├── analisando/[id]/page.tsx    # Loading screen with polling
├── resultado/[id]/page.tsx     # Score reveal + email gate + full report
└── api/
    ├── analisar/route.ts       # POST — validates URL, creates analysis record, starts async analysis
    ├── analise/[id]/route.ts   # GET — returns status + progress + result
    └── lead/route.ts           # POST — saves lead to Supabase
```

## Analysis Engine

6 services run in parallel via `Promise.all`, then Gemini runs after all complete:

1. **PageSpeedService** — LCP, INP, CLS, FCP, TTFB, score (PageSpeed API)
2. **SeoService** — title/desc length, H1, canonical, OG tags, sitemap, robots.txt, alt attributes (Cheerio)
3. **MobileService** — mobile PageSpeed score, viewport meta, touch target sizes (PageSpeed API mobile)
4. **ConversionService** — CTA buttons, price elements, product images, urgency, search, cart link (Cheerio)
5. **TrustService** — HTTPS, privacy/return policy links, contact info, security badges, CNPJ (Cheerio)
6. **UxService** — nav menu, breadcrumbs, footer links, broken links (sample 10), favicon, 404 (Cheerio)
7. **GeminiService** — visual screenshot analysis + executive summary (runs after above 6)

**Score formula:**
```
Overall = (Performance × 0.20) + (SEO × 0.20) + (Mobile × 0.15)
        + (Conversion × 0.20) + (Trust × 0.15) + (UX × 0.10)
```

Target analysis time: 15–25s. Hard timeout: 45s.

## Core TypeScript Types

```typescript
type Issue = {
  title: string
  description: string       // non-technical language
  severity: 'critical' | 'warning' | 'ok'
  cause: string             // technical explanation
  metric?: string           // e.g. "7.2s vs 2.5s limit"
}

type CategoryResult = {
  category: 'performance' | 'seo' | 'mobile' | 'conversion' | 'trust' | 'ux'
  score: number
  issues: Issue[]
}

type AnalysisResult = {
  overallScore: number
  classification: 'critical' | 'warning' | 'good'
  benchmark: number         // % of stores below this score
  revenueImpact: { min: number; max: number }
  categories: CategoryResult[]
  topPriorities: Issue[]    // top 3 by expected ROI
}
```

## Database Schema

```sql
-- analyses: one row per URL analysis
id UUID PK, url TEXT, status TEXT (processing|completed|error),
overall_score INTEGER, expires_at TIMESTAMP (NOW + 7 days), created_at TIMESTAMP

-- analysis_results: one row per category per analysis
id UUID PK, analysis_id UUID FK, category TEXT, score INTEGER, issues JSONB

-- leads: captured via email gate
id UUID PK, analysis_id UUID FK, name TEXT, email TEXT,
whatsapp TEXT (nullable), whatsapp_clicked BOOLEAN DEFAULT FALSE, created_at TIMESTAMP
```

## Key Business Rules

- **Email gate**: score + category grades always visible; issue details only after email capture
- **Blur rule**: 3rd+ issue per category is blurred even in full report — revealed only in consultation
- **Report expiry**: 7 days; expired IDs redirect to landing with a message
- **Rate limiting**: 5 analyses per IP per hour
- **Deduplication**: same URL analyzed twice always creates a new analysis (no cache reuse)
- **Gemini fallback**: if Gemini fails or hits rate limit, report renders without the visual analysis section — never break the product
- **Counter on landing**: only show "Já analisamos +N e-commerces" when `analyses` table has ≥ 10 rows
- **WhatsApp message**: pre-filled with store URL + score (number from `NEXT_PUBLIC_WHATSAPP_NUMBER`)

## Gemini Integration

- Package: `@google/generative-ai`
- Model: `gemini-1.5-flash` (free tier: 1,500 req/day)
- Two calls per analysis: (1) visual screenshot from PageSpeed API (base64) → up to 6 visual issues labeled `👁️ ANÁLISE VISUAL`; (2) all technical data → 2–3 paragraph executive summary in plain Portuguese
- Both calls must be wrapped in try/catch; errors degrade gracefully

## Score Classification

| Range | Label | Color |
|---|---|---|
| 0–39 | CRÍTICO / Iniciante | Red |
| 40–69 | ALERTA / Em Crescimento | Orange |
| 70–100 | BOM / Avançado | Green |

## Out of Scope for v1

PDF export, admin dashboard, email automation, login/user area, multi-page analysis (homepage only), recurring monitoring, competitor comparison.
