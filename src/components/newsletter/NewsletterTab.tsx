import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { FeaturedCard } from './FeaturedCard'
import { NewsCard } from './NewsCard'
import { BlogArticle } from './BlogArticle'
import { RawNewsSection } from './RawNewsSection'
import { AiPicksSection } from './AiPicksSection'
import { PreparingBanner } from './PreparingBanner'
import type {
  ContentCard,
  NewsCard as NewsCardType,
  NewsTrend,
} from '@/lib/types'
import nextDynamic from 'next/dynamic'

const ContentInteraction = nextDynamic(
  () =>
    import('./ContentInteraction').then((m) => ({
      default: m.ContentInteraction,
    })),
  { loading: () => null }
)

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function SectionTitle({
  icon,
  title,
  sub,
}: {
  icon: string
  title: string
  sub?: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background:
          'linear-gradient(135deg, rgba(28,105,212,0.08) 0%, rgba(167,139,250,0.04) 100%)',
        border: '1px solid rgba(28,105,212,0.15)',
        borderLeft: '3px solid var(--bmw)',
      }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </span>
      {sub && (
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--muted2)',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date()
  )
}

const fetchCardNews = unstable_cache(
  async (date: string): Promise<ContentCard[]> => {
    try {
      const { data } = await getSupabase()
        .from('card_news')
        .select('cards')
        .eq('date', date)
        .limit(1)
        .single()
      return (data?.cards as ContentCard[]) ?? []
    } catch {
      return []
    }
  },
  ['card_news'],
  { revalidate: 300 }
)

const fetchTodayArticle = unstable_cache(
  async (date: string): Promise<{ title: string; content: string } | null> => {
    try {
      const { data } = await getSupabase()
        .from('articles')
        .select('title, content')
        .eq('date', date)
        .limit(1)
        .single()
      return data ?? null
    } catch {
      return null
    }
  },
  ['articles'],
  { revalidate: 300 }
)

const fetchTodayRawNews = unstable_cache(
  async (date: string): Promise<NewsCardType[]> => {
    try {
      const { data } = await getSupabase()
        .from('news_cards')
        .select('*')
        .eq('date', date)
        .order('id', { ascending: true })
      return data ?? []
    } catch {
      return []
    }
  },
  ['news_cards'],
  { revalidate: 300 }
)

const fetchTodayTrend = unstable_cache(
  async (date: string): Promise<NewsTrend | null> => {
    try {
      const { data } = await getSupabase()
        .from('news_trends')
        .select('*')
        .eq('date', date)
        .limit(1)
        .single()
      return data ?? null
    } catch {
      return null
    }
  },
  ['news_trends'],
  { revalidate: 300 }
)

export async function NewsletterTab({ date }: { date?: string }) {
  const today = getToday()
  const targetDate = date ?? today
  const isToday = targetDate === today

  const [cards, article, rawNews, trend] = await Promise.all([
    fetchCardNews(targetDate),
    fetchTodayArticle(targetDate),
    fetchTodayRawNews(targetDate),
    fetchTodayTrend(targetDate),
  ])

  // 오늘인데 콘텐츠 미생성 → 준비중 배너
  if (isToday && cards.length === 0) {
    return <PreparingBanner date={targetDate} rawNews={rawNews} />
  }

  // 과거 날짜인데 데이터 없음 → 빈 상태
  if (!isToday && cards.length === 0) {
    return (
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <span className="text-4xl">📭</span>
        <p style={{ color: 'var(--muted)' }}>해당 날짜의 콘텐츠가 없습니다</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          시스템 오류 또는 미운영일입니다
        </p>
      </div>
    )
  }

  const featured = cards[0] ?? null
  const grid = cards.slice(1)

  return (
    <div className="flex flex-col gap-8">
      {/* 1. 카드뉴스 */}
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
                <ContentInteraction
                  contentKey={`card_news:${targetDate}:${i + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. AI Pick TOP3 */}
      {trend?.top3 && trend.top3.length > 0 && (
        <>
          <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />
          <section className="flex flex-col gap-4">
            <SectionTitle icon="🤖" title="AI Pick — 오늘의 TOP 3" />
            <AiPicksSection
              picks={trend.top3}
              insight={trend.talking_points?.one_line_insight}
            />
            <ContentInteraction contentKey={`ai_picks:${targetDate}`} />
          </section>
        </>
      )}

      {/* 3. AI 편집장의 리뷰 */}
      {article && (
        <>
          <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />
          <section className="flex flex-col gap-4">
            <SectionTitle icon="✍️" title="AI 편집장의 리뷰" />
            <BlogArticle
              title={article?.title}
              content={article?.content}
              date={targetDate}
            />
            <ContentInteraction contentKey={`article:${targetDate}`} />
          </section>
        </>
      )}

      {/* 4. 수집 뉴스 */}
      {rawNews.length > 0 && (
        <>
          <hr style={{ borderColor: 'var(--border)', borderTopWidth: '1px' }} />
          <section className="flex flex-col gap-4">
            <SectionTitle
              icon="📋"
              title="수집 뉴스"
              sub={`${rawNews.length}건`}
            />
            <RawNewsSection news={rawNews} />
          </section>
        </>
      )}
    </div>
  )
}
