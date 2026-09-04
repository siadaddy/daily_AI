import { Header } from '@/components/layout/Header'
import { TabNav } from '@/components/layout/TabNav'
import { Footer } from '@/components/layout/Footer'
import { DashboardBar } from '@/components/dashboard/DashboardBar'
import { DateNav } from '@/components/newsletter/DateNav'
import type { TabId } from '@/lib/types'

/**
 * 고정 상단바(헤더 + 탭 + 대시보드 + 날짜) → main → 푸터 크롬.
 * `/`(탭 SPA)와 `/news/[date]` 등 독립 라우트가 공유한다.
 *
 * 활성 탭은 각 라우트가 서버에서 알고 있는 값을 넘긴다. TabNav가
 * `useSearchParams()`로 직접 읽으면 정적 페이지에서 해당 경계가
 * 클라이언트 렌더로 빠져 서버 HTML에 탭 내비게이션이 사라진다.
 */
export function SiteShell({
  children,
  activeTab,
  dateNav,
}: {
  children: React.ReactNode
  /** 강조할 탭. 어느 탭에도 속하지 않는 경로는 null */
  activeTab: TabId | null
  /** 지정하면 대시보드 바 + 날짜 네비를 함께 렌더 (뉴스레터 화면) */
  dateNav?: { selectedDate: string; dates: string[] }
}) {
  return (
    <>
      {/* 완전 고정 상단바: 헤더 + 탭 + 대시바 + 날짜 */}
      <div className="top-bar-fixed">
        <Header />
        <TabNav activeTab={activeTab} />
        {dateNav && (
          <div className="top-bar-content">
            <DashboardBar />
            <DateNav
              selectedDate={dateNav.selectedDate}
              dates={dateNav.dates}
            />
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
