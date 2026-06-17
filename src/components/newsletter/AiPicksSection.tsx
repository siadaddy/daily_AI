import type { Top3Item } from '@/lib/types'

function getRankColor(rank: number): string {
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#9ca3af'
  return '#b45309'
}

function getRankLabel(rank: number): string {
  if (rank === 1) return '🥇 1위'
  if (rank === 2) return '🥈 2위'
  return '🥉 3위'
}

export function AiPicksSection({
  picks,
  insight,
}: {
  picks: Top3Item[]
  insight?: string
}) {
  if (!picks || picks.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {insight && (
        <p
          className="rounded-xl px-4 py-2 text-sm italic"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--muted2)',
          }}
        >
          💡 {insight}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {picks.map((item) => (
          <div
            key={item.rank}
            className="glass-card flex min-h-[160px] flex-col gap-2 p-4"
          >
            {/* Rank badge */}
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{
                  background: `${getRankColor(item.rank)}22`,
                  color: getRankColor(item.rank),
                  border: `1px solid ${getRankColor(item.rank)}55`,
                }}
              >
                {getRankLabel(item.rank)}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {item.category}
              </span>
            </div>

            {/* Title */}
            <p className="line-clamp-3 text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {item.title}
            </p>

            {/* Why */}
            <p className="mt-auto line-clamp-5 text-xs leading-relaxed" style={{ color: 'var(--muted2)' }}>
              {item.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
