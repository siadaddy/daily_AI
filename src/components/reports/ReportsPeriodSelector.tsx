'use client'

import type { ReportPeriod } from '@/lib/types'

const PERIODS: ReportPeriod[] = ['일', '주', '월']

export function ReportsPeriodSelector({
  value,
  onChange,
}: {
  value: ReportPeriod
  onChange: (p: ReportPeriod) => void
}) {
  return (
    <div
      className="flex gap-1 rounded-full p-1"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="rounded-full px-4 py-1 text-sm font-semibold transition-all duration-200"
          style={
            value === p
              ? { background: 'var(--bmw)', color: '#fff' }
              : { color: 'var(--muted2)', background: 'transparent' }
          }
        >
          {p}
        </button>
      ))}
    </div>
  )
}
