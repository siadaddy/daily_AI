'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReportPeriod } from '@/lib/types'

const PERIODS: ReportPeriod[] = ['일', '주', '월']

export function ReportsPeriodSelector({
  value,
  onChange,
}: {
  value: ReportPeriod
  onChange: (p: ReportPeriod) => void
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className="flex gap-1 rounded-full p-1"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
    >
      {PERIODS.map((p) => {
        const isActive = value === p
        return (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            className="relative rounded-full px-4 py-1 text-sm font-semibold transition-colors duration-200"
            style={{ color: isActive ? '#fff' : 'var(--muted2)' }}
          >
            {isActive && (
              <motion.span
                layoutId="reports-period-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--brand)' }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32 }
                }
              />
            )}
            <span className="relative z-10">{p}</span>
          </button>
        )
      })}
    </div>
  )
}
