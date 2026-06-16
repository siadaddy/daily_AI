import type { WeeklyReport } from '@/lib/types'
import { CategoryChart } from './CategoryChart'

export function WeeklyBriefing({ report }: { report: WeeklyReport | null }) {
  if (!report) {
    return (
      <div
        className="flex min-h-64 items-center justify-center rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p style={{ color: 'var(--muted)' }}>주간 리포트가 아직 없습니다</p>
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
          <span className="badge badge-blue">📅 주간 트렌드 브리핑</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {report.week_start} ~ {report.week_end}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted2)' }}>
          {report.summary}
        </p>
      </div>

      {/* Chart */}
      {report.categories.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            📊 카테고리별 빈도
          </h3>
          <CategoryChart stats={report.categories} />
        </div>
      )}

      {/* Insights */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
          💡 주간 인사이트
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted2)' }}>
          {report.insights}
        </p>
      </div>

      {/* Next week focus */}
      {report.next_focus.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            🎯 다음 주 주목 포인트
          </h3>
          <ul className="flex flex-col gap-2">
            {report.next_focus.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted2)' }}>
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
