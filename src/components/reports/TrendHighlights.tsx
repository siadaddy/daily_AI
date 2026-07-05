import type { PeriodType, Top3Item } from '@/lib/types'

interface TrendRow {
  date: string
  top3: Top3Item[] | null
}

export function TrendHighlights({
  trends,
  periodType,
}: {
  trends: TrendRow[]
  periodType: PeriodType
}) {
  if (trends.length === 0) return null

  // 주간: 일별 TOP3 전체, 월간: 각 날짜의 1위만 최근 10건
  const groups =
    periodType === 'weekly'
      ? trends.map((t) => ({ date: t.date, items: t.top3 ?? [] }))
      : trends
          .map((t) => ({
            date: t.date,
            items: (t.top3 ?? []).filter((i) => i.rank === 1),
          }))
          .filter((g) => g.items.length > 0)
          .slice(-10)

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text)' }}
      >
        🔥 기간 TOP 뉴스
      </h3>
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.date}>
            <p
              className="mb-2 text-xs font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              {g.date}
            </p>
            <ul className="flex flex-col gap-2">
              {g.items.map((item) => (
                <li
                  key={`${g.date}-${item.rank}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <span
                    className="mt-0.5 shrink-0 text-xs font-bold"
                    style={{ color: 'var(--bmw-lt)' }}
                  >
                    #{item.rank}
                  </span>
                  <span style={{ color: 'var(--muted2)' }}>
                    {item.title}
                    <span
                      className="ml-2 text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {item.category}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
