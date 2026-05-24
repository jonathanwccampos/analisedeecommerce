export type StoreNiche =
  | 'moda' | 'fitness' | 'beleza' | 'eletronicos' | 'alimentos'
  | 'casa' | 'infantil' | 'esportes' | 'pets' | 'outro'

export type StorePlatform =
  | 'shopify' | 'woocommerce' | 'nuvemshop' | 'vtex' | 'tray' | 'outro'

export type AdSpend =
  | 'menos-1k' | '1k-5k' | '5k-20k' | 'mais-20k' | 'nenhum'

export type MonthlyRevenue =
  | 'menos-10k' | '10k-50k' | '50k-200k' | 'mais-200k'

export type AverageTicket =
  | 'menos-100' | '100-250' | '250-500' | 'mais-500'

export type StoreContext = {
  niche: StoreNiche
  platform: StorePlatform
  adSpend: AdSpend
  monthlyRevenue: MonthlyRevenue
  averageTicket: AverageTicket
}

export type IssueSeverity = 'critical' | 'warning' | 'ok'
export type CategoryName = 'performance' | 'seo' | 'mobile' | 'conversion' | 'trust' | 'ux'
export type AnalysisStatus = 'processing' | 'completed' | 'error' | 'expired'
export type Classification = 'critical' | 'warning' | 'good'

export type Issue = {
  title: string
  description: string
  severity: IssueSeverity
  cause: string
  metric?: string
}

export type CategoryResult = {
  category: CategoryName
  score: number
  issues: Issue[]
  measurementFailed?: boolean
}

export type AdRecommendation = {
  title: string
  description: string
  priority: 'alta' | 'média'
}

export type CreativeIdea = {
  concept: string
  description: string
  format: 'video' | 'carrossel' | 'imagem'
}

export type AdAnalysis = {
  roas: number | null
  roasBenchmark: { min: number; max: number }
  roasAssessment: 'excelente' | 'bom' | 'regular' | 'ruim'
  roasComment: string
  adLandingFixes: AdRecommendation[]
  creativeIdeas: CreativeIdea[]
  audienceStrategy: string[]
}

export type TicketTip = {
  title: string
  description: string
}

export type TicketStrategy = {
  goal: string
  tips: TicketTip[]
}

export type AnalysisResult = {
  overallScore: number
  classification: Classification
  benchmark: number
  revenueImpact: { min: number; max: number }
  executiveSummary: string
  categories: CategoryResult[]
  topPriorities: Issue[]
  adAnalysis?: AdAnalysis
  ticketStrategy?: TicketStrategy
}

export type AnalysisProgress = {
  category: CategoryName | 'gemini'
  label: string
  done: boolean
}

export type AnalysisResponse =
  | { status: 'processing'; progress: AnalysisProgress[] }
  | { status: 'completed'; result: AnalysisResult }
  | { status: 'error'; message: string }
  | { status: 'expired' }

export const CATEGORY_LABELS: Record<CategoryName, string> = {
  performance: 'Velocidade',
  seo: 'Google & SEO',
  mobile: 'Mobile',
  conversion: 'Gatilhos de Venda',
  trust: 'Confiança',
  ux: 'Navegação',
}

export const CATEGORY_WEIGHTS: Record<CategoryName, number> = {
  performance: 0.20,
  seo: 0.20,
  mobile: 0.15,
  conversion: 0.20,
  trust: 0.15,
  ux: 0.10,
}
