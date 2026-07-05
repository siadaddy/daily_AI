import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractKeywords } from '@/lib/utils/keywords'
import { fetchAllPages } from '@/lib/reports/generate'
import dayjs from 'dayjs'
import type {
  AnalyticsComparison,
  AnalyticsPayload,
  CategoryStat,
  DailyVolume,
  KeywordTrend,
  SourceStat,
  Top3Item,
} from '@/lib/types'

type Period = 'day' | 'week' | 'month'

function getPeriodDays(period: Period): number {
  return period === 'day' ? 1 : period === 'week' ? 7 : 30
}

function getCacheTtl(period: Period): number {
  return period === 'day' ? 600 : period === 'week' ? 3600 : 7200
}

function getPeriodLabel(period: Period): string {
  return period === 'day' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'
}

function deltaPct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prev) / prev) * 1000) / 10
}

interface CardRow {
  title: string | null
  category: string | null
  source: string | null
  date: string | null
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('period') ?? 'week'
  const period: Period = raw === 'day' || raw === 'month' ? raw : 'week'
  const days = getPeriodDays(period)
  const since = dayjs()
    .subtract(days - 1, 'day')
    .format('YYYY-MM-DD')
  // 직전 동일 길이 기간 (비교용)
  const prevSince = dayjs()
    .subtract(days * 2 - 1, 'day')
    .format('YYYY-MM-DD')
  const prevUntil = dayjs().subtract(days, 'day').format('YYYY-MM-DD')

  try {
    const supabase = await createClient()

    const [newsCards, prevCards, articlesResult, trendsResult] =
      await Promise.all([
        fetchAllPages<CardRow>((from, to) =>
          supabase
            .from('news_cards')
            .select('title, category, source, date')
            .gte('date', since)
            .order('date', { ascending: true })
            .range(from, to)
        ),
        fetchAllPages<CardRow>((from, to) =>
          supabase
            .from('news_cards')
            .select('title, category, source, date')
            .gte('date', prevSince)
            .lte('date', prevUntil)
            .order('date', { ascending: true })
            .range(from, to)
        ),
        supabase.from('articles').select('content, date').gte('date', since),
        supabase.from('news_trends').select('top3, date').gte('date', since),
      ])

    const articles = articlesResult.data ?? []
    const trends = trendsResult.data ?? []

    // Keywords
    const titles = newsCards.map((c) => c.title ?? '')
    const trendTitles = trends.flatMap((t) =>
      Array.isArray(t.top3)
        ? (t.top3 as Top3Item[]).map((i) => i.title ?? '')
        : []
    )
    const articleContents = articles.map((a) => a.content ?? '')
    const keywords = extractKeywords({
      titles,
      trendTitles,
      articleContents,
      topN: 20,
    })

    // 직전 기간 키워드 (급상승/신규 판별용 — 제목만 사용)
    const prevKeywords = extractKeywords({
      titles: prevCards.map((c) => c.title ?? ''),
      trendTitles: [],
      articleContents: [],
      topN: 100,
    })
    const prevKeywordMap = new Map(prevKeywords.map((k) => [k.word, k.count]))

    const risingKeywords: KeywordTrend[] = keywords
      .map((k) => {
        const prevCount = prevKeywordMap.get(k.word) ?? 0
        return {
          word: k.word,
          count: k.count,
          prevCount,
          isNew: prevCount === 0,
        }
      })
      .filter((k) => k.isNew || k.count > k.prevCount)
      .slice(0, 8)

    // Category stats (직전 기간 대비 trend 포함)
    const catMap: Record<string, number> = {}
    for (const c of newsCards) {
      const cat = c.category ?? '기타'
      catMap[cat] = (catMap[cat] ?? 0) + 1
    }
    const prevCatMap: Record<string, number> = {}
    for (const c of prevCards) {
      const cat = c.category ?? '기타'
      prevCatMap[cat] = (prevCatMap[cat] ?? 0) + 1
    }
    const categoryStats: CategoryStat[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const prev = prevCatMap[name] ?? 0
        const pct = deltaPct(count, prev)
        const trend: CategoryStat['trend'] =
          pct > 10 ? 'up' : pct < -10 ? 'down' : 'flat'
        return { name, count, trend, deltaPct: pct }
      })

    // Source stats
    const srcMap: Record<string, number> = {}
    for (const c of newsCards) {
      const src = c.source ?? '출처 미상'
      srcMap[src] = (srcMap[src] ?? 0) + 1
    }
    const allSources: SourceStat[] = Object.entries(srcMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }))
    // 상위 5개 + 기타 — 차트 시리즈 색 슬롯(6개)에 맞춤
    const topSources = allSources.slice(0, 5)
    const etcCount = allSources.slice(5).reduce((s, v) => s + v.count, 0)
    const sources: SourceStat[] =
      etcCount > 0
        ? [...topSources, { source: '기타', count: etcCount }]
        : topSources

    // Daily volume
    const volMap: Record<string, number> = {}
    for (const c of newsCards) {
      const d = c.date ?? ''
      if (d) volMap[d] = (volMap[d] ?? 0) + 1
    }
    const volumeSeries: DailyVolume[] = Object.entries(volMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    // KPIs
    const totalArticles = newsCards.length
    const activeDays = volumeSeries.length || 1
    const avgPerDay = Math.round((totalArticles / activeDays) * 10) / 10
    const topDate = volumeSeries.reduce(
      (best, v) => (v.count > (best.count ?? 0) ? v : best),
      {
        date: '',
        count: 0,
      }
    ).date

    const prevTotal = prevCards.length
    const prevVolDays =
      new Set(prevCards.map((c) => c.date ?? '').filter(Boolean)).size || 1
    const prevAvg = prevTotal / prevVolDays

    const comparison: AnalyticsComparison = {
      prevTotal,
      totalDeltaPct: deltaPct(totalArticles, prevTotal),
      avgPerDayDeltaPct: deltaPct(avgPerDay, prevAvg),
      risingKeywords,
    }

    const payload: AnalyticsPayload = {
      keywords,
      categoryStats,
      sources,
      volumeSeries,
      totalArticles,
      avgPerDay,
      topDate,
      periodLabel: getPeriodLabel(period),
      comparison,
    }

    const ttl = getCacheTtl(period)
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
      },
    })
  } catch (err) {
    console.error('[analytics]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
