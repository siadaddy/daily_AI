import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { DashboardBar } from '@/components/dashboard/DashboardBar'
import { DateNav } from '@/components/newsletter/DateNav'

/**
 * 고정 상단바(헤더 + 탭 + 대시보드 + 날짜) → main → 푸터 크롬.
 * `/`(탭 SPA)와 `/news/[date]` 등 독립 라우트가 공유한다.
 */
export function SiteShell({
  children,
  dateNav,
}: {
  children: React.ReactNode
  /** 지정하면 대시보드 바 + 날짜 네비를 함께 렌더 (뉴스레터 화면) */
  dateNav?: { selectedDate: string; dates: string[] }
}) {
  return (
    <>
      {/* 완전 고정 상단바: 헤더 + 탭 + 대시바 + 날짜 */}
      <div className="top-bar-fixed">
        <Header />
        <Suspense>
          <TabNav />
        </Suspense>
        {dateNav && (
          <div className="top-bar-content">
            <DashboardBar />
            <Suspense>
              <DateNav
                selectedDate={dateNav.selectedDate}
                dates={dateNav.dates}
              />
            </Suspense>
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-6">
        {children}
      </main>
      <Footer />
    </>
  )
}

export function LoadingSkeleton() {
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
