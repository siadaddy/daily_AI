import { createClient } from '@/lib/supabase/server'
import { ReportsSubNav, type ReportsView } from './ReportsSubNav'
import { PeriodReport } from './PeriodReport'
import { ReportArchiveList } from './ReportArchiveList'
import { TrendHighlights } from './TrendHighlights'
import { ReportsDashboard } from './ReportsDashboard'
import type {
  PeriodReport as PeriodReportData,
  PeriodType,
  Top3Item,
} from '@/lib/types'

export const revalidate = 3600

async function fetchReports(
  periodType: PeriodType
): Promise<PeriodReportData[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('period_type', periodType)
      .order('week_start', { ascending: false })
      .limit(26)
    return data ?? []
  } catch {
    return []
  }
}

async function fetchTrends(
  start: string,
  end: string
): Promise<{ date: string; top3: Top3Item[] | null }[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_trends')
      .select('date, top3')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

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
    ? await fetchTrends(selected.week_start, selected.week_end)
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
