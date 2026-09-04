import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import {
  Newspaper,
  Bot,
  PenLine,
  ClipboardList,
  Inbox,
  MessagesSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FeaturedCard } from './FeaturedCard'
import { NewsCard } from './NewsCard'
import { BlogArticle } from './BlogArticle'
import { RawNewsSection } from './RawNewsSection'
import { AiPicksSection } from './AiPicksSection'
import { PreparingBanner } from './PreparingBanner'
import { TalkingPointsSection } from './TalkingPointsSection'
import { FactSummary } from './FactSummary'
import type {
  ContentCard,
  NewsCard as NewsCardType,
  NewsTrend,
} from '@/lib/types'
import { isExcludedNews } from '@/lib/utils/exclude'
import { plainTextExcerpt } from '@/lib/utils/caption'
import { getSiteUrl } from '@/lib/site-url'
import { newsHref, getToday } from '@/lib/dates'
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

/**
 * 지면 섹션 머리 — 굵은 괘선 위에 모노 키커, 그 아래 세리프 제목.
 * 아이콘은 타입에 종속된 보조 표시라 muted + 14px로 낮춰 둔다.
 */
function SectionTitle({
  icon: Icon,
  kicker,
  title,
  sub,
}: {
  icon: LucideIcon
  kicker: string
  title: string
  sub?: string
}) {
  return (
    <header className="ed-section-head">
      <Icon
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="translate-y-px"
        style={{ color: 'var(--muted)' }}
      />
      <span className="kicker">{kicker}</span>
      <h2 className="ed-section-title w-full">{title}</h2>
      {sub && <span className="ed-section-count">{sub}</span>}
    </header>
  )
}

/**
 * 발행 정보 제자(題字). 날짜·발행 시각·수록 건수를 모노 한 줄로 고정해
 * 매일 같은 자리에서 같은 폭으로 읽히게 한다.
 */
function IssueLine({
  date,
  cardCount,
  rawCount,
}: {
  date: string
  cardCount: number
  rawCount: number
}) {
  const [y, m, d] = date.split('-')
  return (
    <div className="ed-issue-bar">
      <time dateTime={date} className="kicker kicker-accent">
        {y}.{m}.{d}
      </time>
      <span className="kicker">발행 06:00 KST</span>
      <span className="kicker ml-auto">
        카드 {cardCount} · 수집 {rawCount}
      </span>
    </div>
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

export const fetchTodayArticle = unstable_cache(
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
      return (data ?? []).filter((n) => !isExcludedNews(n))
    } catch {
      return []
    }
  },
  ['news_cards', 'v2'],
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
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 border-t-2 border-[var(--rule-strong)] px-6 py-16 text-center">
        <Inbox
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
          style={{ color: 'var(--muted)' }}
        />
        <p className="ed-headline text-[length:var(--fs-lead)]">
          해당 날짜의 지면이 없습니다
        </p>
        <p className="kicker">시스템 오류 또는 미운영일</p>
      </div>
    )
  }

  const featured = cards[0] ?? null
  const grid = cards.slice(1)
  const talkingPoints = trend?.talking_points?.talking_points ?? []

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: plainTextExcerpt(article.content),
        datePublished: `${targetDate}T06:00:00+09:00`,
        dateModified: `${targetDate}T06:00:00+09:00`,
        image: featured?.image_url ? [featured.image_url] : undefined,
        url: `${getSiteUrl()}${newsHref(targetDate)}`,
        publisher: {
          '@type': 'Organization',
          name: '시아아빠의 AI 데일리',
        },
        author: {
          '@type': 'Organization',
          name: '시아아빠의 AI 데일리',
        },
      }
    : null

  return (
    <div className="flex flex-col gap-14">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="flex flex-col gap-4">
        <IssueLine
          date={targetDate}
          cardCount={cards.length}
          rawCount={rawNews.length}
        />
        <FactSummary
          date={targetDate}
          cardCount={cards.length}
          rawNews={rawNews}
        />
      </div>

      {/* 1. 카드뉴스 — 리드 기사 1건 + 번호 매긴 후속 기사 */}
      <section className="flex flex-col gap-7">
        <SectionTitle icon={Newspaper} kicker="Card News" title="카드뉴스" />
        {featured && (
          <div className="flex flex-col gap-3">
            <FeaturedCard card={featured} />
            <ContentInteraction contentKey={`card_news:${targetDate}:0`} />
          </div>
        )}
        {grid.length > 0 && (
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
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
        <section className="flex flex-col gap-5">
          <SectionTitle
            icon={Bot}
            kicker="Editor's Pick"
            title="오늘의 TOP 3"
          />
          <AiPicksSection
            picks={trend.top3}
            insight={trend.talking_points?.one_line_insight}
          />
          <ContentInteraction contentKey={`ai_picks:${targetDate}`} />
        </section>
      )}

      {/* 3. 오늘의 대화 소재 */}
      {talkingPoints.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionTitle
            icon={MessagesSquare}
            kicker="Talking Points"
            title="오늘의 대화 소재"
            sub={`${talkingPoints.length}건`}
          />
          <TalkingPointsSection points={talkingPoints} />
          <ContentInteraction contentKey={`talking_points:${targetDate}`} />
        </section>
      )}

      {/* 4. AI 편집장의 리뷰 */}
      {article && (
        <section className="flex flex-col gap-5">
          <SectionTitle
            icon={PenLine}
            kicker="Editorial"
            title="AI 편집장의 리뷰"
          />
          <BlogArticle
            title={article?.title}
            content={article?.content}
            date={targetDate}
          />
          <ContentInteraction contentKey={`article:${targetDate}`} />
        </section>
      )}

      {/* 5. 수집 뉴스 */}
      {rawNews.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionTitle
            icon={ClipboardList}
            kicker="Wire"
            title="수집 뉴스"
            sub={`${rawNews.length}건`}
          />
          <RawNewsSection news={rawNews} />
        </section>
      )}
    </div>
  )
}
