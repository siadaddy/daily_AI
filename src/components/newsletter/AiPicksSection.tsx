'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import type { Top3Item } from '@/lib/types'

/**
 * 편집자 선정 TOP 3.
 * 금·은·동 메달 색은 지면에 어울리지 않아 걷어내고,
 * 순위는 큰 모노 숫자와 세로 괘선으로만 표시한다.
 */
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
    <div className="flex flex-col gap-6">
      {insight && (
        <p className="ed-lede flex items-start gap-3 border-l-2 border-[var(--accent)] pl-4 font-[family-name:var(--font-serif)]">
          <Lightbulb
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-1 shrink-0"
            style={{ color: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--text)' }}>{insight}</span>
        </p>
      )}

      <ol className="grid list-none grid-cols-1 gap-x-8 gap-y-6 p-0 md:grid-cols-3">
        {picks.map((item, i) => (
          <motion.li
            key={item.rank}
            className="ai-pick-item flex min-w-0 flex-col gap-2 border-t border-[var(--rule)] pt-3 transition-colors md:border-t-0 md:border-l md:pt-0 md:pl-5 md:first:border-l-0 md:first:pl-0"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={
              prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
            }
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.45,
              ease: 'easeOut',
              delay: prefersReducedMotion ? 0 : i * 0.07,
            }}
          >
            <div className="flex items-baseline gap-3">
              <span className="ed-index" aria-hidden="true">
                {String(item.rank).padStart(2, '0')}
              </span>
              <span className="kicker min-w-0 truncate">{item.category}</span>
            </div>

            <h3 className="ed-display text-[0.9375rem] leading-snug">
              {item.title}
            </h3>

            <p
              className="mt-auto text-[0.8125rem] leading-relaxed"
              style={{ color: 'var(--muted2)' }}
            >
              {item.why}
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
