import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

/** DateNav 칩 스트립용 최근 날짜 목록 */
export const fetchAvailableDates = unstable_cache(
  async (limit = 60): Promise<string[]> => {
    const { data } = await createPublicClient()
      .from('card_news')
      .select('date')
      .order('date', { ascending: false })
      .limit(limit)
    return data?.map((r: { date: string }) => r.date) ?? []
  },
  ['available-dates'],
  { revalidate: 3600 }
)

/** sitemap / generateStaticParams용 — 콘텐츠가 존재하는 전체 날짜 */
export const fetchAllContentDates = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await createPublicClient()
      .from('card_news')
      .select('date')
      .order('date', { ascending: false })
    return data?.map((r: { date: string }) => r.date) ?? []
  },
  ['all-content-dates'],
  { revalidate: 3600 }
)
