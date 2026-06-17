import type { AnalyticsPayload } from '@/lib/types'

interface KpiBox {
  icon: string
  label: string
  value: string
  sub?: string
}

export function StatsKpiRow({ data }: { data: AnalyticsPayload }) {
  const boxes: KpiBox[] = [
    {
      icon: '📰',
      label: '총 기사수',
      value: `${data.totalArticles.toLocaleString()}건`,
      sub: data.periodLabel,
    },
    {
      icon: '📅',
      label: '일 평균',
      value: `${data.avgPerDay}건`,
      sub: '하루 기준',
    },
    {
      icon: '🔥',
      label: '최다 발행일',
      value: data.topDate || '—',
      sub: '가장 많은 뉴스',
    },
    {
      icon: '🏷️',
      label: '카테고리',
      value: `${data.categoryStats.length}개`,
      sub: '분류 기준',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {boxes.map((box) => (
        <div
          key={box.label}
          className="glass-card flex flex-col gap-1 rounded-2xl p-4"
        >
          <span className="text-xl">{box.icon}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {box.label}
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {box.value}
          </span>
          {box.sub && (
            <span className="text-xs" style={{ color: 'var(--muted2)' }}>
              {box.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
