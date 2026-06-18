import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { DashboardBar } from '@/components/dashboard/DashboardBar'
import { DateNav } from '@/components/newsletter/DateNav'
import { NewsletterTab } from '@/components/newsletter/NewsletterTab'
import { ReportsTab } from '@/components/reports/ReportsTab'
import { OfficeTab } from '@/components/office/OfficeTab'
import { MusicUniverse } from '@/components/music/MusicUniverse'
import { PortfolioSection } from '@/components/portfolio/PortfolioCard'
import type { TabId } from '@/lib/types'

function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ background: 'var(--card)' }} />
      ))}
    </div>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>
}) {
  const params = await searchParams
  const tab = (params.tab ?? 'newsletter') as TabId
  const date = params.date
  const selectedDate = date ?? getToday()

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
              <DateNav selectedDate={selectedDate} />
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
            <ReportsTab />
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
