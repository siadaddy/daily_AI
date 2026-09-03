import type { CategoryStat } from '@/lib/types'

/** 증감률(%). 직전 기간이 0이면 현재 값 유무로만 판단한다. */
export function deltaPct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prev) / prev) * 1000) / 10
}

/** ±10%를 넘어야 상승/하락으로 본다 */
const TREND_THRESHOLD = 10

interface CategorizedRow {
  category?: string | null
}

/**
 * 카테고리별 건수와 직전 동일 기간 대비 추세를 **코드로** 집계한다.
 *
 * 리포트 생성 시 이 값을 LLM에게 세게 하면 안 된다 —
 * 실제로 건수·카테고리명·추세를 모두 지어내는 것이 확인됐다.
 * 대시보드(/api/analytics)와 리포트 생성이 같은 구현을 공유한다.
 */
export function buildCategoryStats(
  cards: CategorizedRow[],
  prevCards: CategorizedRow[]
): CategoryStat[] {
  const count = (rows: CategorizedRow[]) => {
    const map: Record<string, number> = {}
    for (const r of rows) {
      const cat = r.category ?? '기타'
      map[cat] = (map[cat] ?? 0) + 1
    }
    return map
  }

  const catMap = count(cards)
  const prevCatMap = count(prevCards)

  return Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const pct = deltaPct(count, prevCatMap[name] ?? 0)
      const trend: CategoryStat['trend'] =
        pct > TREND_THRESHOLD ? 'up' : pct < -TREND_THRESHOLD ? 'down' : 'flat'
      return { name, count, trend, deltaPct: pct }
    })
}
