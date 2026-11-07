import type {
  AutoArticle,
  AutoTopic,
  CompetitorItem,
  CompetitorRow,
} from './types'

/** 화면 표시 순서 — 서비스본부 기획 관점의 우선순위 */
export const TOPIC_ORDER: AutoTopic[] = [
  'bmw_group',
  'ev_aftersales',
  'regulation',
  'import_market',
  'sdv',
  'ai_auto',
  'other',
]

export const TOPIC_LABEL: Record<AutoTopic, string> = {
  bmw_group: 'BMW 그룹',
  ev_aftersales: 'EV 애프터세일즈',
  regulation: '리콜 · 규제',
  import_market: '수입차 시장 · 경쟁사',
  sdv: '소프트웨어 정의 차량',
  ai_auto: 'AI × 자동차',
  other: '기타',
}

export const ITEM_ORDER: CompetitorItem[] = [
  'service_policy',
  'price',
  'campaign',
  'recall',
]

export const ITEM_LABEL: Record<CompetitorItem, string> = {
  service_policy: '서비스 정책',
  price: '가격',
  campaign: '캠페인',
  recall: '리콜',
}

export function isAutoTopic(value: string | undefined): value is AutoTopic {
  return TOPIC_ORDER.includes(value as AutoTopic)
}

function byImportanceThenRecent(a: AutoArticle, b: AutoArticle): number {
  if (b.importance !== a.importance) return b.importance - a.importance
  return (b.published_at ?? '').localeCompare(a.published_at ?? '')
}

/** 오늘의 핵심: 속보 우선, 그다음 중요도 4 이상. 없으면 중요도 상위. 최대 n건. */
export function pickLead(rows: AutoArticle[], n = 3): AutoArticle[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.is_breaking !== b.is_breaking) return a.is_breaking ? -1 : 1
    return byImportanceThenRecent(a, b)
  })
  const strong = sorted.filter((r) => r.is_breaking || r.importance >= 4)
  return (strong.length > 0 ? strong : sorted).slice(0, n)
}

/** 주제별 묶음. 표시 순서는 TOPIC_ORDER, 빈 주제는 생략, 섹션 안은 중요도 → 최신순. */
export function groupByTopic(
  rows: AutoArticle[]
): { topic: AutoTopic; rows: AutoArticle[] }[] {
  const map = new Map<AutoTopic, AutoArticle[]>()
  for (const r of rows) {
    const list = map.get(r.topic) ?? []
    list.push(r)
    map.set(r.topic, list)
  }
  return TOPIC_ORDER.filter((t) => map.has(t)).map((topic) => ({
    topic,
    rows: [...(map.get(topic) ?? [])].sort(byImportanceThenRecent),
  }))
}

export interface CompetitorMatrix {
  brands: string[]
  /** brand → item → 가장 최근 기록 */
  cells: Record<string, Partial<Record<CompetitorItem, CompetitorRow>>>
}

/** 브랜드 × 항목 비교표. 칸마다 가장 최근 기록 하나. 기록이 많은 브랜드가 앞. */
export function buildCompetitorMatrix(rows: CompetitorRow[]): CompetitorMatrix {
  const cells: CompetitorMatrix['cells'] = {}
  const counts = new Map<string, number>()
  for (const r of rows) {
    counts.set(r.brand, (counts.get(r.brand) ?? 0) + 1)
    const cur = cells[r.brand]?.[r.item]
    if (!cur || r.date > cur.date) {
      cells[r.brand] = { ...cells[r.brand], [r.item]: r }
    }
  }
  const brands = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([brand]) => brand)
  return { brands, cells }
}

/** 브랜드·주제 필터 (둘 다 선택 시 AND) */
export function filterArticles(
  rows: AutoArticle[],
  opts: { topic?: AutoTopic; brand?: string }
): AutoArticle[] {
  return rows.filter(
    (r) =>
      (!opts.topic || r.topic === opts.topic) &&
      (!opts.brand || r.brands.includes(opts.brand))
  )
}

const BMW_GROUP = ['BMW', 'MINI', '롤스로이스']

/** 화면에 쓸 브랜드 칩 목록: 등장 빈도순, 동률이면 BMW 그룹 먼저(로케일 정렬에 맡기지 않는다) */
export function brandCounts(
  rows: AutoArticle[]
): { brand: string; count: number }[] {
  const m = new Map<string, number>()
  for (const r of rows) for (const b of r.brands) m.set(b, (m.get(b) ?? 0) + 1)
  const own = (b: string) => (BMW_GROUP.includes(b) ? 0 : 1)
  return [...m.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1] || own(a[0]) - own(b[0]) || a[0].localeCompare(b[0], 'ko')
    )
    .map(([brand, count]) => ({ brand, count }))
}
