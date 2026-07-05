import Link from 'next/link'
import type { PeriodReport, PeriodType } from '@/lib/types'

export function ReportArchiveList({
  reports,
  view,
  selectedStart,
}: {
  reports: Pick<PeriodReport, 'id' | 'week_start' | 'week_end' | 'summary'>[]
  view: PeriodType
  selectedStart: string | null
}) {
  if (reports.length === 0) return null

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <h3
        className="mb-3 text-sm font-semibold"
        style={{ color: 'var(--text)' }}
      >
        🗂️ 지난 리포트
      </h3>
      <ul className="flex flex-col gap-1">
        {reports.map((r) => {
          const isActive = r.week_start === selectedStart
          return (
            <li key={r.id}>
              <Link
                href={`/?tab=reports&view=${view}&report=${r.week_start}`}
                className="block rounded-xl px-3 py-2 transition-colors"
                style={
                  isActive
                    ? {
                        background: 'var(--glass)',
                        border: '1px solid var(--bmw)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <span
                  className="block text-xs font-semibold"
                  style={{ color: isActive ? 'var(--bmw-lt)' : 'var(--text)' }}
                >
                  {r.week_start} ~ {r.week_end}
                </span>
                <span
                  className="mt-0.5 block truncate text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  {r.summary}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
