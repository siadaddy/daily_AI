import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { PeriodReport, PeriodType, Top3Item } from '@/lib/types'

/** 기간 타입별 리포트 목록 (최신순) */
export const fetchReports = unstable_cache(
  async (periodType: PeriodType, limit = 26): Promise<PeriodReport[]> => {
    const { data } = await createPublicClient()
      .from('weekly_reports')
      .select('*')
      .eq('period_type', periodType)
      .order('week_start', { ascending: false })
      .limit(limit)
    return data ?? []
  },
  ['weekly-reports'],
  { revalidate: 3600 }
)

/** sitemap / generateStaticParams용 — 전체 리포트의 (period_type, week_start) */
export const fetchAllReportKeys = unstable_cache(
  async (): Promise<{ period_type: string; week_start: string }[]> => {
    const { data } = await createPublicClient()
      .from('weekly_reports')
      .select('period_type, week_start')
      .order('week_start', { ascending: false })
    return data ?? []
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
    const { data } = await createPublicClient()
      .from('news_trends')
      .select('date, top3')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
    return data ?? []
  },
  ['news-trends-range'],
  { revalidate: 3600 }
)
