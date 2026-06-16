import { createClient } from '@/lib/supabase/server'
import { DashboardBar } from '@/components/dashboard/DashboardBar'
import { FeaturedCard } from './FeaturedCard'
import { NewsCard } from './NewsCard'
import { BlogArticle } from './BlogArticle'
import { RawNewsSection } from './RawNewsSection'
import { AiPicksSection } from './AiPicksSection'
import { DateNav } from './DateNav'
import type { ContentCard, NewsCard as NewsCardType, NewsTrend } from '@/lib/types'
import { Suspense } from 'react'

export const revalidate = 3600

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchCardNews(date: string): Promise<ContentCard[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('card_news')
      .select('cards')
      .eq('date', date)
      .single()
    return (data?.cards as ContentCard[]) ?? []
  } catch {
    return []
  }
}

async function fetchTodayArticle(date: string): Promise<{ title: string; content: string } | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('articles')
      .select('title, content')
      .eq('date', date)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

async function fetchTodayRawNews(date: string): Promise<NewsCardType[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_cards')
      .select('*')
      .eq('date', date)
      .order('id', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

async function fetchTodayTrend(date: string): Promise<NewsTrend | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_trends')
      .select('*')
      .eq('date', date)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

export async function NewsletterTab({ date }: { date?: string }) {
  const targetDate = date ?? getToday()
  const [cards, article, rawNews, trend] = await Promise.all([
    fetchCardNews(targetDate),
    fetchTodayArticle(targetDate),
    fetchTodayRawNews(targetDate),
    fetchTodayTrend(targetDate),
  ])

  const featured = cards[0] ?? null
  const grid = cards.slice(1)

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <DateNav selectedDate={targetDate} />
      </Suspense>
      <DashboardBar />

      {cards.length === 0 && (
        <div
          className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-4xl">📭</span>
          <p style={{ color: 'var(--muted)' }}>오늘의 카드뉴스가 아직 준비되지 않았습니다</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            매일 06:40 KST에 업데이트됩니다
          </p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="flex flex-col gap-5">
          {featured && <FeaturedCard card={featured} />}
          {grid.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {grid.map((card, i) => (
                <NewsCard key={i} card={card} idx={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {trend?.top3 && trend.top3.length > 0 && (
        <AiPicksSection
          picks={trend.top3}
          insight={trend.talking_points?.one_line_insight}
        />
      )}

      <BlogArticle title={article?.title} content={article?.content} />

      {rawNews.length > 0 && <RawNewsSection news={rawNews} />}
    </div>
  )
}
