import { ReportsSubNav, type ReportsView } from './ReportsSubNav'
import { PeriodReport } from './PeriodReport'
import { ReportArchiveList } from './ReportArchiveList'
import { TrendHighlights } from './TrendHighlights'
import { ReportsDashboard } from './ReportsDashboard'
// 리포트/트렌드 조회는 query.ts 한 곳에만 둔다 —
// 제외 대상 필터가 조회 함수 안에 있어서 호출부마다 다시 걸 필요가 없다.
import { fetchReports, fetchTrendsInRange } from '@/lib/reports/query'

export const revalidate = 3600

export async function ReportsTab({
  view,
  report,
}: {
  view?: string
  report?: string
}) {
  const activeView: ReportsView =
    view === 'monthly' || view === 'dashboard' ? view : 'weekly'

  if (activeView === 'dashboard') {
    return (
      <div className="flex flex-col gap-6">
        <ReportsSubNav view={activeView} />
        <ReportsDashboard />
      </div>
    )
  }

  const reports = await fetchReports(activeView)
  const selected =
    reports.find((r) => r.week_start === report) ?? reports[0] ?? null
  const trends = selected
    ? await fetchTrendsInRange(selected.week_start, selected.week_end)
    : []

  return (
    <div className="flex flex-col gap-6">
      <ReportsSubNav view={activeView} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* 본문: 선택된 리포트 + 기간 TOP 뉴스 */}
        <div className="flex flex-col gap-5">
          <PeriodReport report={selected} periodType={activeView} />
          {selected && (
            <TrendHighlights trends={trends} periodType={activeView} />
          )}
        </div>

        {/* 사이드: 지난 리포트 아카이브 */}
        <aside>
          <ReportArchiveList
            reports={reports}
            view={activeView}
            selectedStart={selected?.week_start ?? null}
          />
        </aside>
      </div>
    </div>
  )
}
