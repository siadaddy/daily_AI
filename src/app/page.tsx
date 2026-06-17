import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { NewsletterTab } from '@/components/newsletter/NewsletterTab'
import { ReportsTab } from '@/components/reports/ReportsTab'
import { OfficeTab } from '@/components/office/OfficeTab'
import { MusicUniverse } from '@/components/music/MusicUniverse'
import { PortfolioSection } from '@/components/portfolio/PortfolioCard'
import type { TabId } from '@/lib/types'

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
  searchParams: Promise<{ tab?: string; date?: string }>
}) {
  const params = await searchParams
  const tab = (params.tab ?? 'newsletter') as TabId
  const date = params.date

  return (
    <>
      <div className="top-bar-fixed">
        <Header />
        <Suspense>
          <TabNav />
        </Suspense>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-3 pb-6">
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

        {/* Portfolio — 항상 하단에 표시 */}
        <div className="mt-12">
          <PortfolioSection />
        </div>
      </main>
      <Footer />
    </>
  )
}
