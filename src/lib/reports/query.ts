import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { filterTop3, sanitizeReport } from '@/lib/utils/exclude'
import type { PeriodReport, PeriodType, Top3Item } from '@/lib/types'

/** 기간 타입별 리포트 목록 (최신순) */
export const fetchReports = unstable_cache(
  async (periodType: PeriodType, limit = 26): Promise<PeriodReport[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('weekly_reports')
        .select('*')
        .eq('period_type', periodType)
        .order('week_start', { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      // 저장된 리포트에는 과거 제외 대상(삼천리)이 남아 있다 — 읽는 시점에 도려낸다
      return (data ?? []).map(sanitizeReport)
    } catch (e) {
      console.error('[reports/query] weekly_reports 조회 실패:', e)
      return []
    }
  },
  ['weekly-reports', 'v2'],
  { revalidate: 3600 }
)

/** sitemap / generateStaticParams용 — 전체 리포트의 (period_type, week_start) */
export const fetchAllReportKeys = unstable_cache(
  async (): Promise<{ period_type: string; week_start: string }[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('weekly_reports')
        .select('period_type, week_start')
        .order('week_start', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    } catch (e) {
      console.error('[reports/query] 리포트 키 조회 실패:', e)
      return []
    }
  },
  ['all-report-keys'],
  { revalidate: 3600 }
)

/** 리포트 기간에 걸친 일별 TOP3 */
export const fetchTrendsInRange = unstable_cache(
  async (
    start: string,
    end: string
  ): Promise<{ date: string; top3: Top3Item[] | null }[]> => {
    try {
      const { data, error } = await createPublicClient()
        .from('news_trends')
        .select('date, top3')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
      if (error) throw new Error(error.message)
      // 제외 대상 항목을 빼고, 그 결과 비어버린 날짜는 행째 뺀다
      return (data ?? [])
        .map((row) => ({ ...row, top3: filterTop3(row.top3) }))
        .filter((row) => row.top3.length > 0)
    } catch (e) {
      console.error('[reports/query] news_trends 조회 실패:', e)
      return []
    }
  },
  ['news-trends-range', 'v2'],
  { revalidate: 3600 }
)
