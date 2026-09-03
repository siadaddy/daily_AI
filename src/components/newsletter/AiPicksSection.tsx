'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Lightbulb, Trophy, Medal, Award } from 'lucide-react'
import type { Top3Item } from '@/lib/types'

function getRankColor(rank: number): string {
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#9ca3af'
  return '#b45309'
}

function getRankIcon(rank: number) {
  if (rank === 1) return Trophy
  if (rank === 2) return Medal
  return Award
}

export function AiPicksSection({
  picks,
  insight,
}: {
  picks: Top3Item[]
  insight?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (!picks || picks.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {insight && (
        <p
          className="flex items-start gap-2 rounded-xl px-4 py-2 text-sm italic"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--muted2)',
          }}
        >
          <Lightbulb
            size={15}
            strokeWidth={2}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--gold)' }}
          />
          <span>{insight}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {picks.map((item) => {
          const RankIcon = getRankIcon(item.rank)
          return (
            <motion.div
              key={item.rank}
              className="glass-card ai-pick-item flex min-h-[160px] flex-col gap-2 p-4"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={
                prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.45,
                ease: 'easeOut',
                delay: prefersReducedMotion ? 0 : (item.rank - 1) * 0.08,
              }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              {/* Rank badge */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{
                    background: `${getRankColor(item.rank)}22`,
                    color: getRankColor(item.rank),
                    border: `1px solid ${getRankColor(item.rank)}55`,
                  }}
                >
                  <RankIcon size={12} strokeWidth={2.5} />
                  {item.rank}위
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
              <p
                className="text-sm leading-snug font-semibold"
                style={{ color: 'var(--text)' }}
              >
                {item.title}
              </p>

              {/* Why */}
              <p
                className="mt-auto text-xs leading-relaxed"
                style={{ color: 'var(--muted2)' }}
              >
                {item.why}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
