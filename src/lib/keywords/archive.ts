import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { fetchAllPages } from '@/lib/reports/generate'
import { extractKeywords } from '@/lib/utils/keywords'
import { isExcludedNews } from '@/lib/utils/exclude'
import type { KeywordStat, Top3Item } from '@/lib/types'

/** 아카이브 페이지를 만들 상위 키워드 수 */
export const TOP_KEYWORD_COUNT = 200

/** 키워드로 인정하는 문자 집합 — tokenize()가 만들어내는 토큰과 동일한 모양 */
const KEYWORD_PATTERN = /^[가-힣ᄀ-ᇿ㄰-㆏\w]{2,40}$/

/**
 * 키워드가 안전한 토큰인지 검사.
 * PostgREST의 `or(...)` 필터는 쉼표·괄호·`%`를 구문으로 해석하므로
 * 쿼리에 넣기 전에 반드시 통과시켜야 한다.
 */
export function isSafeKeyword(value: string): boolean {
  return KEYWORD_PATTERN.test(value)
}

export interface KeywordNewsItem {
  date: string
  title: string
  summary: string | null
  link: string | null
  source: string | null
  category: string | null
}

interface CardRow {
  title: string | null
  summary: string | null
  category: string | null
  date: string | null
}

/**
 * 전 기간 뉴스에서 뽑은 상위 키워드.
 * `/keyword/[keyword]` 페이지 생성과 허용 목록 검증에 함께 쓰인다.
 */
export const getTopKeywords = unstable_cache(
  async (limit = TOP_KEYWORD_COUNT): Promise<KeywordStat[]> => {
    const supabase = createPublicClient()

    const [cards, trends, articles] = await Promise.all([
      fetchAllPages<CardRow>((from, to) =>
        supabase
          .from('news_cards')
          .select('title, summary, category, date')
          .order('date', { ascending: false })
          .range(from, to)
      ),
      supabase.from('news_trends').select('top3'),
      supabase
        .from('articles')
        .select('content')
        .order('date', { ascending: false })
        .limit(180),
    ])

    const visible = cards.filter((c) => !isExcludedNews(c))

    const trendTitles = ((trends.data ?? []) as { top3: Top3Item[] | null }[])
      .flatMap((t) => t.top3 ?? [])
      .map((i) => i.title)

    return extractKeywords({
      titles: visible.map((c) => c.title ?? ''),
      trendTitles,
      articleContents: ((articles.data ?? []) as { content: string }[]).map(
        (a) => a.content
      ),
      topN: limit,
    })
  },
  ['top-keywords'],
  { revalidate: 3600 }
)

/** 해당 키워드가 등장한 전 기간 뉴스 (최신순) */
export const getNewsByKeyword = unstable_cache(
  async (keyword: string): Promise<KeywordNewsItem[]> => {
    if (!isSafeKeyword(keyword)) return []

    const supabase = createPublicClient()
    const rows = await fetchAllPages<KeywordNewsItem>((from, to) =>
      supabase
        .from('news_cards')
        .select('date, title, summary, link, source, category')
        .or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
        .order('date', { ascending: false })
        .range(from, to)
    )

    return rows.filter((r) => !isExcludedNews(r))
  },
  ['news-by-keyword'],
  { revalidate: 3600 }
)
