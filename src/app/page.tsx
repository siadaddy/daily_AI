import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SiteShell, LoadingSkeleton } from '@/components/layout/SiteShell'
import {
  NewsletterTab,
  fetchTodayArticle,
} from '@/components/newsletter/NewsletterTab'
import { ReportsTab } from '@/components/reports/ReportsTab'
import { OfficeTab } from '@/components/office/OfficeTab'
import { MusicUniverse } from '@/components/music/MusicUniverse'
import { PortfolioSection } from '@/components/portfolio/PortfolioCard'
import { getToday, newsHref } from '@/lib/dates'
import { parseTab } from '@/lib/tabs'
import { fetchAvailableDates } from '@/lib/content-dates'
import { plainTextExcerpt } from '@/lib/utils/caption'
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
  const tab = parseTab(params.tab)

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
  // 과거 날짜는 /news/[date]가 정식 경로 — 쿼리 URL은 그쪽을 가리킨다
  const canonical = newsHref(date)
  const article = await fetchTodayArticle(date)

  if (!article) {
    return { alternates: { canonical } }
  }

  const title = `${article.title} | 시아아빠의 AI 데일리`
  const description = plainTextExcerpt(article.content, 160)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description },
    twitter: { title, description },
  }
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
  const tab = parseTab(params.tab)
  const date = params.date
  const today = getToday()
  const selectedDate = date ?? today

  const availableDates = tab === 'newsletter' ? await fetchAvailableDates() : []
  // 오늘 데이터가 아직 없어도 항상 첫 번째 칩으로 표시
  const dates = availableDates.includes(today)
    ? availableDates
    : [today, ...availableDates]

  return (
    <SiteShell
      activeTab={tab}
      dateNav={tab === 'newsletter' ? { selectedDate, dates } : undefined}
    >
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
    </SiteShell>
  )
}
