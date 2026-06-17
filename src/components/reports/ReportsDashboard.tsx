'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { ReportPeriod, AnalyticsPayload } from '@/lib/types'
import { ReportsPeriodSelector } from './ReportsPeriodSelector'
import { StatsKpiRow } from './StatsKpiRow'
import { KeywordChart } from './KeywordChart'
import { CategoryChart } from './CategoryChart'
import { VolumeChart } from './VolumeChart'
import { SourcePieChart } from './SourcePieChart'

const periodMap: Record<ReportPeriod, string> = { 일: 'day', 주: 'week', 월: 'month' }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: 'var(--glass)',
        borderRadius: 'var(--r-md)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--muted2)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function ReportsDashboard() {
  const [period, setPeriod] = useState<ReportPeriod>('주')
  const apiPeriod = periodMap[period]

  const { data, isLoading, error } = useSWR<AnalyticsPayload>(
    `/api/analytics?period=${apiPeriod}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          📈 뉴스 분석 대시보드
        </h2>
        <ReportsPeriodSelector value={period} onChange={setPeriod} />
      </div>

      {error && (
        <p className="text-center text-sm" style={{ color: 'var(--red)' }}>
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ChartSkeleton key={i} height={88} />
          ))}
        </div>
      ) : data ? (
        <StatsKpiRow data={data} />
      ) : null}

      {/* 키워드 + 카테고리 */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SectionCard title="🔑 키워드 분석 (상위 15개)">
          {isLoading ? (
            <ChartSkeleton height={320} />
          ) : data ? (
            <KeywordChart keywords={data.keywords} />
          ) : null}
        </SectionCard>

        <SectionCard title="📊 카테고리 분포">
          {isLoading ? (
            <ChartSkeleton height={320} />
          ) : data ? (
            <CategoryChart stats={data.categoryStats} />
          ) : null}
        </SectionCard>
      </div>

      {/* 볼륨 추이 */}
      <SectionCard title="📅 뉴스 발행 추이">
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : data ? (
          <VolumeChart volumeSeries={data.volumeSeries} />
        ) : null}
      </SectionCard>

      {/* 소스 분포 */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SectionCard title="🌐 출처(소스) 분포">
          {isLoading ? (
            <ChartSkeleton height={280} />
          ) : data ? (
            <SourcePieChart sources={data.sources} />
          ) : null}
        </SectionCard>

        {/* 주요 인사이트 */}
        <SectionCard title="💡 기간 요약">
          {isLoading ? (
            <ChartSkeleton height={280} />
          ) : data ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: 'var(--muted2)' }}>
                {data.periodLabel} 동안 총{' '}
                <span className="font-bold" style={{ color: 'var(--bmw-lt)' }}>
                  {data.totalArticles.toLocaleString()}건
                </span>
                의 뉴스가 수집됐습니다.
              </p>
              {data.categoryStats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.categoryStats.slice(0, 5).map((cat) => (
                    <span key={cat.name} className="badge badge-blue text-xs">
                      {cat.name} {cat.count}건
                    </span>
                  ))}
                </div>
              )}
              {data.keywords.length > 0 && (
                <>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    가장 많이 등장한 키워드
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords.slice(0, 8).map((kw) => (
                      <span key={kw.word} className="badge badge-purple text-xs">
                        #{kw.word}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  )
}
