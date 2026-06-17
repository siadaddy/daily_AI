import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractKeywords } from '@/lib/utils/keywords'
import dayjs from 'dayjs'
import type { AnalyticsPayload, CategoryStat, SourceStat, DailyVolume, Top3Item } from '@/lib/types'

type Period = 'day' | 'week' | 'month'

function getSince(period: Period): string {
  const days = period === 'day' ? 0 : period === 'week' ? 6 : 29
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD')
}

function getCacheTtl(period: Period): number {
  return period === 'day' ? 600 : period === 'week' ? 3600 : 7200
}

function getPeriodLabel(period: Period): string {
  return period === 'day' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('period') ?? 'week'
  const period: Period = raw === 'day' || raw === 'month' ? raw : 'week'
  const since = getSince(period)

  try {
    const supabase = await createClient()

    const [newsResult, articlesResult, trendsResult] = await Promise.all([
      supabase
        .from('news_cards')
        .select('title, category, source, date')
        .gte('date', since)
        .order('date', { ascending: true }),
      supabase.from('articles').select('content, date').gte('date', since),
      supabase.from('news_trends').select('top3, date').gte('date', since),
    ])

    const newsCards = newsResult.data ?? []
    const articles = articlesResult.data ?? []
    const trends = trendsResult.data ?? []

    // Keywords
    const titles = newsCards.map((c) => c.title ?? '')
    const trendTitles = trends.flatMap((t) =>
      Array.isArray(t.top3) ? (t.top3 as Top3Item[]).map((i) => i.title ?? '') : [],
    )
    const articleContents = articles.map((a) => a.content ?? '')
    const keywords = extractKeywords({ titles, trendTitles, articleContents, topN: 20 })

    // Category stats
    const catMap: Record<string, number> = {}
    for (const c of newsCards) {
      const cat = c.category ?? '기타'
      catMap[cat] = (catMap[cat] ?? 0) + 1
    }
    const categoryStats: CategoryStat[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, trend: 'flat' as const }))

    // Source stats
    const srcMap: Record<string, number> = {}
    for (const c of newsCards) {
      const src = c.source ?? '출처 미상'
      srcMap[src] = (srcMap[src] ?? 0) + 1
    }
    const allSources: SourceStat[] = Object.entries(srcMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }))
    const topSources = allSources.slice(0, 8)
    const etcCount = allSources.slice(8).reduce((s, v) => s + v.count, 0)
    const sources: SourceStat[] = etcCount > 0
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
    const days = volumeSeries.length || 1
    const avgPerDay = Math.round((totalArticles / days) * 10) / 10
    const topDate = volumeSeries.reduce(
      (best, v) => (v.count > (best.count ?? 0) ? v : best),
      { date: '', count: 0 },
    ).date

    const payload: AnalyticsPayload = {
      keywords,
      categoryStats,
      sources,
      volumeSeries,
      totalArticles,
      avgPerDay,
      topDate,
      periodLabel: getPeriodLabel(period),
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
