import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { DashboardBar } from '@/components/dashboard/DashboardBar'
import { DateNav } from '@/components/newsletter/DateNav'
import {
  NewsletterTab,
  fetchTodayArticle,
} from '@/components/newsletter/NewsletterTab'
import { ReportsTab } from '@/components/reports/ReportsTab'
import { OfficeTab } from '@/components/office/OfficeTab'
import { MusicUniverse } from '@/components/music/MusicUniverse'
import { PortfolioSection } from '@/components/portfolio/PortfolioCard'
import type { TabId } from '@/lib/types'

const TAB_META: Record<
  Exclude<TabId, 'newsletter'>,
  { title: string; description: string }
> = {
  reports: {
    title: '리포트',
    description: 'AI가 분석하는 주간·월간 트렌드 리포트와 비교 분석 대시보드',
  },
  music: {
    title: 'Music Universe',
    description: 'AI가 큐레이션하는 음악을 3D 우주에서 탐험하는 뮤직 유니버스',
  },
  office: {
    title: 'AI Office',
    description:
      '뉴스를 수집·기획·집필·디자인하는 AI 에이전트들의 실시간 활동 현황',
  },
  portfolio: {
    title: '포트폴리오',
    description: '이 사이트를 만든 AI 크리에이터 파이프라인 소개',
  },
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const tab = (params.tab ?? 'newsletter') as TabId

  if (tab !== 'newsletter') {
    const meta = TAB_META[tab]
    if (!meta) return {}
    const title = `${meta.title} | 시아아빠의 AI 데일리`
    return {
      title,
      description: meta.description,
      alternates: { canonical: `/?tab=${tab}` },
      openGraph: { title, description: meta.description },
    }
  }

  const date = params.date ?? getToday()
  const article = await fetchTodayArticle(date)
  const canonical = date === getToday() ? '/' : `/?tab=newsletter&date=${date}`

  if (!article) {
    return { alternates: { canonical } }
  }

  const title = `${article.title} | 시아아빠의 AI 데일리`
  const description = article.content
    .replace(/\\n/g, ' ')
    .replace(/[#>*_`-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description },
    twitter: { title, description },
  }
}

function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date()
  )
}

const fetchAvailableDates = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('card_news')
      .select('date')
      .order('date', { ascending: false })
      .limit(30)
    return data?.map((r: { date: string }) => r.date) ?? []
  },
  ['available-dates'],
  { revalidate: 3600 }
)

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl"
          style={{ background: 'var(--card)' }}
        />
      ))}
    </div>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    date?: string
    view?: string
    report?: string
  }>
}) {
  const params = await searchParams
  const tab = (params.tab ?? 'newsletter') as TabId
  const date = params.date
  const today = getToday()
  const selectedDate = date ?? today

  const availableDates = tab === 'newsletter' ? await fetchAvailableDates() : []
  // 오늘 데이터가 아직 없어도 항상 첫 번째 칩으로 표시
  const dates = availableDates.includes(today)
    ? availableDates
    : [today, ...availableDates]

  return (
    <>
      {/* 완전 고정 상단바: 헤더 + 탭 + 대시바 + 날짜 */}
      <div className="top-bar-fixed">
        <Header />
        <Suspense>
          <TabNav />
        </Suspense>
        {tab === 'newsletter' && (
          <div className="top-bar-content">
            <DashboardBar />
            <Suspense>
              <DateNav selectedDate={selectedDate} dates={dates} />
            </Suspense>
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-6">
        {tab === 'newsletter' && (
          <Suspense fallback={<LoadingSkeleton />}>
            <NewsletterTab date={date} />
          </Suspense>
        )}
        {tab === 'reports' && (
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportsTab view={params.view} report={params.report} />
          </Suspense>
        )}
        {tab === 'music' && <MusicUniverse />}
        {tab === 'office' && <OfficeTab />}
        {tab === 'portfolio' && <PortfolioSection />}
      </main>
      <Footer />
    </>
  )
}
