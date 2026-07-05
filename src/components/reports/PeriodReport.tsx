import type {
  PeriodReport as PeriodReportData,
  CategoryStat,
} from '@/lib/types'
import { CategoryChart } from './CategoryChart'

const LABELS = {
  weekly: {
    badge: '📅 주간 트렌드 브리핑',
    insights: '💡 주간 인사이트',
    nextFocus: '🎯 다음 주 주목 포인트',
    empty: '주간 리포트가 아직 없습니다 (매주 월요일 자동 생성)',
  },
  monthly: {
    badge: '🗓️ 월간 트렌드 리포트',
    insights: '💡 월간 인사이트',
    nextFocus: '🎯 다음 달 주목 포인트',
    empty: '월간 리포트가 아직 없습니다 (매월 1일 자동 생성)',
  },
} as const

function TrendMark({ trend }: { trend: CategoryStat['trend'] }) {
  if (trend === 'up') return <span style={{ color: 'var(--green)' }}>▲</span>
  if (trend === 'down') return <span style={{ color: 'var(--red)' }}>▼</span>
  return <span style={{ color: 'var(--muted)' }}>–</span>
}

export function PeriodReport({
  report,
  periodType,
}: {
  report: PeriodReportData | null
  periodType: 'weekly' | 'monthly'
}) {
  const labels = LABELS[periodType]

  if (!report) {
    return (
      <div
        className="flex min-h-64 items-center justify-center rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p style={{ color: 'var(--muted)' }}>{labels.empty}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="badge badge-blue">{labels.badge}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {report.week_start} ~ {report.week_end}
          </span>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted2)' }}
        >
          {report.summary}
        </p>
      </div>

      {/* Chart + category trends */}
      {report.categories.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            className="mb-4 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            📊 카테고리별 빈도
          </h3>
          <CategoryChart stats={report.categories} />
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {report.categories.map((cat) => (
              <span
                key={cat.name}
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--muted2)' }}
              >
                <TrendMark trend={cat.trend} />
                {cat.name} {cat.count}건
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3
          className="mb-3 text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          {labels.insights}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted2)' }}
        >
          {report.insights}
        </p>
      </div>

      {/* Next period focus */}
      {report.next_focus.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            {labels.nextFocus}
          </h3>
          <ul className="flex flex-col gap-2">
            {report.next_focus.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--muted2)' }}
              >
                <span style={{ color: 'var(--bmw-lt)' }}>▸</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
