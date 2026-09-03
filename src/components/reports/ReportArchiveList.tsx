'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Archive } from 'lucide-react'
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
  const prefersReducedMotion = useReducedMotion()

  if (reports.length === 0) return null

  return (
    <motion.div
      className="glass-card rounded-2xl p-5"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <h3
        className="mb-3 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: 'var(--text)' }}
      >
        <Archive size={16} strokeWidth={2} />
        지난 리포트
      </h3>
      <ul className="flex flex-col gap-1">
        {reports.map((r) => {
          const isActive = r.week_start === selectedStart
          return (
            <li key={r.id}>
              <Link
                href={`/?tab=reports&view=${view}&report=${r.week_start}`}
                className="block rounded-xl px-3 py-2 transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: 'var(--glass)',
                        border: '1px solid var(--brand)',
                        boxShadow: 'var(--shadow-glow-brand)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <span
                  className="block text-xs font-semibold"
                  style={{
                    color: isActive ? 'var(--brand-light)' : 'var(--text)',
                  }}
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
    </motion.div>
  )
}
