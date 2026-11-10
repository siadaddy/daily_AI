export type AutoTopic =
  | 'ev_aftersales'
  | 'ev_industry'
  | 'import_market'
  | 'sdv'
  | 'ai_auto'
  | 'bmw_group'
  | 'regulation'
  | 'other'

/** auto_digest 한 행 — 주제별(또는 'all') 오늘의 요약. 건수는 코드가 센 값이다. */
export interface AutoDigest {
  date: string
  topic: AutoTopic | 'all'
  headline: string
  points: string[]
  article_count: number
}

export type CompetitorItem = 'service_policy' | 'price' | 'campaign' | 'recall'

/** auto_articles 한 행 — pipeline/sql/auto_insight.sql 과 같은 모양 */
export interface AutoArticle {
  id: number
  date: string
  title: string
  title_original: string
  summary_ko: string
  link: string
  source: string
  source_type: 'naver' | 'global' | 'trade' | 'google' | 'gov'
  topic: AutoTopic
  brands: string[]
  importance: number
  is_breaking: boolean
  lang: string
  published_at: string | null
  so_what: string
}

export interface CompetitorRow {
  id: number
  date: string
  brand: string
  item: CompetitorItem
  note: string
  source_link: string
}

export interface AutoReport {
  id: number
  period_type: 'weekly' | 'monthly'
  period_start: string
  period_end: string
  content: AutoReportContent
}

/** 리포트 본문 JSON. 건수·분포는 코드가 채우고 LLM 은 서술(headline·sections)만 쓴다. */
export interface AutoReportContent {
  headline: string
  summary: string
  /** 코드로 집계한 값 — LLM 이 만든 값이 아니다 */
  stats: {
    total: number
    byTopic: { topic: AutoTopic; count: number }[]
    byBrand: { brand: string; count: number }[]
    breakingCount: number
  }
  sections: { topic: AutoTopic; title: string; body: string }[]
  /** 서비스본부 관점 시사점(해석) */
  implications: string[]
  /** 근거가 된 기사 — 보고서에서 출처를 따라갈 수 있게 */
  sources: { title: string; link: string; source: string }[]
}
