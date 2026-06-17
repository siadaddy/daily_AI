import { createClient } from '@/lib/supabase/server'
import { FeaturedCard } from './FeaturedCard'
import { NewsCard } from './NewsCard'
import { BlogArticle } from './BlogArticle'
import { RawNewsSection } from './RawNewsSection'
import { AiPicksSection } from './AiPicksSection'
import { PreparingBanner } from './PreparingBanner'
import type { ContentCard, NewsCard as NewsCardType, NewsTrend } from '@/lib/types'
import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'

const ContentInteraction = nextDynamic(
  () => import('./ContentInteraction').then((m) => ({ default: m.ContentInteraction })),
  { loading: () => null }
)

export const dynamic = 'force-dynamic'

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(28,105,212,0.08) 0%, rgba(167,139,250,0.04) 100%)',
        border: '1px solid rgba(28,105,212,0.15)',
        borderLeft: '3px solid var(--bmw)',
      }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</span>
      {sub && (
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--muted2)' }}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

// 정확한 날짜로 못 찾으면 가장 최근 데이터로 폴백
async function fetchCardNews(date: string): Promise<ContentCard[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('card_news')
      .select('cards')
      .lte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    return (data?.cards as ContentCard[]) ?? []
  } catch {
    return []
  }
}

// 오늘용: 정확한 날짜 일치만 (폴백 없음)
async function fetchCardNewsExact(date: string): Promise<ContentCard[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('card_news')
      .select('cards')
      .eq('date', date)
      .limit(1)
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
      .lte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

async function fetchTodayRawNews(date: string): Promise<NewsCardType[]> {
  try {
    const supabase = await createClient()
    // 정확한 날짜 먼저 시도, 없으면 가장 최근 날짜로
    const { data: exact } = await supabase
      .from('news_cards')
      .select('date')
      .eq('date', date)
      .limit(1)

    const targetDate = exact && exact.length > 0
      ? date
      : (await supabase.from('news_cards').select('date').lte('date', date).order('date', { ascending: false }).limit(1).single()).data?.date ?? date

    const { data } = await supabase
      .from('news_cards')
      .select('*')
      .eq('date', targetDate)
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
      .lte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

export async function NewsletterTab({ date }: { date?: string }) {
  const today = getToday()
  const targetDate = date ?? today
  const isToday = targetDate === today

  const [cards, article, rawNews, trend] = await Promise.all([
    // 오늘이면 exact match만 — 어제 콘텐츠를 오늘인 척 보여주지 않음
    isToday ? fetchCardNewsExact(targetDate) : fetchCardNews(targetDate),
    fetchTodayArticle(targetDate),
    fetchTodayRawNews(targetDate),
    fetchTodayTrend(targetDate),
  ])

  // 오늘인데 콘텐츠 미생성 → 준비중 배너
  if (isToday && cards.length === 0) {
    return <PreparingBanner date={targetDate} rawNews={rawNews} />
  }

  const featured = cards[0] ?? null
  const grid = cards.slice(1)

  return (
    <div className="flex flex-col gap-8">

      {cards.length === 0 && (
        <div
          className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-4xl">📭</span>
          <p style={{ color: 'var(--muted)' }}>해당 날짜의 카드뉴스가 없습니다</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            매일 06:40 KST에 업데이트됩니다
          </p>
        </div>
      )}

      {/* 1. 카드뉴스 */}
      {cards.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionTitle icon="📰" title="카드뉴스" />
          {featured && (
            <div className="flex flex-col gap-3">
              <FeaturedCard card={featured} />
              <ContentInteraction contentKey={`card_news:${targetDate}:0`} />
            </div>
          )}
          {grid.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {grid.map((card, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <NewsCard card={card} idx={i + 1} />
                  <ContentInteraction contentKey={`card_news:${targetDate}:${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />

      {/* 2. AI Pick TOP3 */}
      {trend?.top3 && trend.top3.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle icon="🤖" title="AI Pick — 오늘의 TOP 3" />
          <AiPicksSection
            picks={trend.top3}
            insight={trend.talking_points?.one_line_insight}
          />
          <ContentInteraction contentKey={`ai_picks:${targetDate}`} />
        </section>
      )}

      <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />

      {/* 3. AI 편집장의 리뷰 */}
      {article && (
        <section className="flex flex-col gap-4">
          <SectionTitle icon="✍️" title="AI 편집장의 리뷰" />
          <BlogArticle title={article?.title} content={article?.content} date={targetDate} />
          <ContentInteraction contentKey={`article:${targetDate}`} />
        </section>
      )}

      <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />

      {/* 4. 수집 뉴스 */}
      {rawNews.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle icon="📋" title="수집 뉴스" sub={`${rawNews.length}건`} />
          <RawNewsSection news={rawNews} />
        </section>
      )}
    </div>
  )
}
