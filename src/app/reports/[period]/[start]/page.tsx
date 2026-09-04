import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteShell } from '@/components/layout/SiteShell'
import { ReportsSubNav } from '@/components/reports/ReportsSubNav'
import { PeriodReport } from '@/components/reports/PeriodReport'
import { TrendHighlights } from '@/components/reports/TrendHighlights'
import { ReportArchiveList } from '@/components/reports/ReportArchiveList'
import {
  fetchReports,
  fetchAllReportKeys,
  fetchTrendsInRange,
} from '@/lib/reports/query'
import { isValidDate, reportHref } from '@/lib/dates'
import { getSiteUrl } from '@/lib/site-url'
import type { PeriodType } from '@/lib/types'

export const revalidate = 3600

const LABEL: Record<PeriodType, string> = {
  weekly: '주간 리포트',
  monthly: '월간 리포트',
}

function parsePeriod(value: string): PeriodType | null {
  return value === 'weekly' || value === 'monthly' ? value : null
}

export async function generateStaticParams() {
  const keys = await fetchAllReportKeys()
  return keys
    .filter((k) => k.period_type === 'weekly' || k.period_type === 'monthly')
    .map((k) => ({ period: k.period_type, start: k.week_start }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ period: string; start: string }>
}): Promise<Metadata> {
  const { period, start } = await params
  const periodType = parsePeriod(period)
  if (!periodType || !isValidDate(start)) return {}

  const reports = await fetchReports(periodType)
  const report = reports.find((r) => r.week_start === start)
  if (!report) return {}

  const title = `${start} ~ ${report.week_end} ${LABEL[periodType]}`
  const description = report.summary?.slice(0, 160) ?? LABEL[periodType]
  const canonical = reportHref(periodType, start)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    twitter: { title, description },
  }
}

export default async function ReportPermalinkPage({
  params,
}: {
  params: Promise<{ period: string; start: string }>
}) {
  const { period, start } = await params
  const periodType = parsePeriod(period)
  if (!periodType || !isValidDate(start)) notFound()

  const reports = await fetchReports(periodType)
  const selected = reports.find((r) => r.week_start === start)
  if (!selected) notFound()

  const trends = await fetchTrendsInRange(
    selected.week_start,
    selected.week_end
  )

  const base = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: base },
      {
        '@type': 'ListItem',
        position: 2,
        name: LABEL[periodType],
        item: `${base}/?tab=reports&view=${periodType}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${selected.week_start} ~ ${selected.week_end}`,
        item: `${base}${reportHref(periodType, start)}`,
      },
    ],
  }

  return (
    <SiteShell activeTab="reports">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex flex-col gap-6">
        <ReportsSubNav view={periodType} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <PeriodReport report={selected} periodType={periodType} />
            <TrendHighlights trends={trends} periodType={periodType} />
          </div>
          <aside>
            <ReportArchiveList
              reports={reports}
              view={periodType}
              selectedStart={selected.week_start}
            />
          </aside>
        </div>
      </div>
    </SiteShell>
  )
}
