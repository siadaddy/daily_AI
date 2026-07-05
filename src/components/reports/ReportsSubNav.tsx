'use client'

import { useRouter } from 'next/navigation'

export type ReportsView = 'weekly' | 'monthly' | 'dashboard'

const VIEWS: { id: ReportsView; label: string }[] = [
  { id: 'weekly', label: '📅 주간 리포트' },
  { id: 'monthly', label: '🗓️ 월간 리포트' },
  { id: 'dashboard', label: '📈 분석 대시보드' },
]

export function ReportsSubNav({ view }: { view: ReportsView }) {
  const router = useRouter()

  return (
    <div
      className="flex w-fit gap-1 rounded-full p-1"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
    >
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => router.push(`/?tab=reports&view=${v.id}`)}
          className="rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-all duration-200"
          style={
            view === v.id
              ? { background: 'var(--bmw)', color: '#fff' }
              : { color: 'var(--muted2)', background: 'transparent' }
          }
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
