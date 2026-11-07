import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { AutoArticle, AutoReport, CompetitorRow } from './types'

/**
 * 자동차 인사이트 조회. 전부 익명(public) 클라이언트 + unstable_cache.
 *
 * 테이블이 아직 없거나(SQL 미적용) 조회가 실패하면 빈 값을 돌려준다 —
 * 화면은 "아직 데이터가 없습니다"로 떨어지고, 사이트 나머지는 영향이 없다.
 */

/** 데이터가 있는 날짜(최신순, 최대 limit개) */
export const fetchAutoDates = unstable_cache(
  async (limit = 14): Promise<string[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('auto_articles')
        .select('date')
        .order('date', { ascending: false })
        .limit(1000)
      if (error) throw new Error(error.message)
      return [...new Set((data ?? []).map((r) => r.date as string))].slice(
        0,
        limit
      )
    } catch (e) {
      console.error('[auto/query] 날짜 조회 실패:', e)
      return []
    }
  },
  ['auto-dates', 'v1'],
  { revalidate: 300 }
)

export const fetchAutoArticles = unstable_cache(
  async (date: string): Promise<AutoArticle[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('auto_articles')
        .select('*')
        .eq('date', date)
        .gte('importance', 2)
        .order('importance', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(300)
      if (error) throw new Error(error.message)
      return (data ?? []) as AutoArticle[]
    } catch (e) {
      console.error('[auto/query] 기사 조회 실패:', e)
      return []
    }
  },
  ['auto-articles', 'v1'],
  { revalidate: 300 }
)

/** 기간 안의 기사(리포트·집계용). 페이지네이션으로 1000행 상한을 넘겨 읽는다. */
export async function fetchAutoArticlesInRange(
  start: string,
  end: string
): Promise<AutoArticle[]> {
  const supabase = createPublicClient()
  const rows: AutoArticle[] = []
  const PAGE = 1000
  try {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('auto_articles')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .gte('importance', 2)
        .order('date', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw new Error(error.message)
      rows.push(...((data ?? []) as AutoArticle[]))
      if (!data || data.length < PAGE) break
    }
  } catch (e) {
    console.error('[auto/query] 기간 기사 조회 실패:', e)
    return []
  }
  return rows
}

export const fetchCompetitorLog = unstable_cache(
  async (sinceDays = 90): Promise<CompetitorRow[]> => {
    const since = new Date(Date.now() - sinceDays * 86400000)
      .toISOString()
      .slice(0, 10)
    try {
      const { data, error } = await createPublicClient()
        .from('auto_competitor_log')
        .select('*')
        .gte('date', since)
        .order('date', { ascending: false })
        .limit(500)
      if (error) throw new Error(error.message)
      return (data ?? []) as CompetitorRow[]
    } catch (e) {
      console.error('[auto/query] 경쟁사 기록 조회 실패:', e)
      return []
    }
  },
  ['auto-competitors', 'v1'],
  { revalidate: 3600 }
)

export const fetchAutoReports = unstable_cache(
  async (
    periodType: 'weekly' | 'monthly',
    limit = 26
  ): Promise<AutoReport[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('auto_reports')
        .select('*')
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data ?? []) as AutoReport[]
    } catch (e) {
      console.error('[auto/query] 리포트 조회 실패:', e)
      return []
    }
  },
  ['auto-reports', 'v1'],
  { revalidate: 3600 }
)
