export interface NewsCard {
  id: number
  date: string
  category: string
  title: string
  summary: string | null
  image_url: string | null
  link: string | null
  source: string | null
  created_at: string
}

// card_news 테이블 — AI 크루 생성 카드뉴스 (Supabase)
export interface ContentCard {
  headline: string
  caption: string
  image_url: string | null
  source_url: string
  source_name: string
}

// articles 테이블 — AI 편집장 블로그 글 (Supabase)
export interface Article {
  id: number
  date: string
  title: string | null
  content: string
  created_at: string
}

export interface Agent {
  id: number
  name: string
  role: string
  status: 'online' | 'idle' | 'offline'
  last_active: string
  avatar: string | null
  current_task: string | null
}

export interface ActivityLog {
  id: number
  agent_name: string
  action: string
  detail: string | null
  created_at: string
}

export interface Top3Item {
  rank: number
  title: string
  category: string
  why: string
}

export interface NewsTrend {
  id: number
  date: string
  top3: Top3Item[]
  category_summaries: Record<string, unknown>
  talking_points: {
    one_line_insight?: string
    talking_points?: Array<{
      topic: string
      context: string
      question: string
      business_impact: string
    }>
  }
  created_at: string
}

export interface WeeklyReport {
  id: number
  week_start: string
  week_end: string
  summary: string
  categories: CategoryStat[]
  insights: string
  next_focus: string[]
  created_at: string
}

export interface CategoryStat {
  name: string
  count: number
  trend: 'up' | 'down' | 'flat'
}

export type TabId = 'newsletter' | 'reports' | 'music' | 'office' | 'portfolio'

export interface CommunityPost {
  id: number
  user_id: string
  nickname: string
  title: string
  content: string
  view_count: number
  created_at: string
}

export interface CommunityComment {
  id: number
  post_id: number
  user_id: string
  nickname: string
  content: string
  created_at: string
}

export type Category =
  | '전체'
  | '🔥 오늘의 하이라이트'
  | '🤖 AI / 인공지능'
  | '💻 기술 / IT'
  | '💰 경제 / 금융'
  | '🚗 자동차'
  | '🚘 BMW'
  | '🏢 삼천리 그룹'
  | '🏙️ 사회'
  | '🚨 사건 / 사고'

// ─── Analytics / Reports ───────────────────────────────────────────────────

export type ReportPeriod = '일' | '주' | '월'

export interface KeywordStat {
  word: string
  count: number
}

export interface SourceStat {
  source: string
  count: number
}

export interface DailyVolume {
  date: string
  count: number
}

export interface AnalyticsPayload {
  keywords: KeywordStat[]
  categoryStats: CategoryStat[]
  sources: SourceStat[]
  volumeSeries: DailyVolume[]
  totalArticles: number
  avgPerDay: number
  topDate: string
  periodLabel: string
}
