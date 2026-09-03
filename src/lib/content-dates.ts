import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

/**
 * 조회 실패 시 빈 배열로 떨어진다.
 * 이 fetcher들은 빌드 타임 generateStaticParams/sitemap에서도 호출되므로,
 * Supabase에 닿지 못한다고 해서 빌드 전체가 실패하면 안 된다.
 */
async function selectDates(limit?: number): Promise<string[]> {
  try {
    let query = createPublicClient()
      .from('card_news')
      .select('date')
      .order('date', { ascending: false })
    if (limit !== undefined) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data?.map((r: { date: string }) => r.date) ?? []
  } catch (e) {
    console.error('[content-dates] card_news 조회 실패:', e)
    return []
  }
}

/** DateNav 칩 스트립용 최근 날짜 목록 */
export const fetchAvailableDates = unstable_cache(
  (limit = 60): Promise<string[]> => selectDates(limit),
  ['available-dates'],
  { revalidate: 3600 }
)

/** sitemap / generateStaticParams용 — 콘텐츠가 존재하는 전체 날짜 */
export const fetchAllContentDates = unstable_cache(
  (): Promise<string[]> => selectDates(),
  ['all-content-dates'],
  { revalidate: 3600 }
)
