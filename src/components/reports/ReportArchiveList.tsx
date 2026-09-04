'use client'

import Link from 'next/link'
import { reportHref } from '@/lib/dates'
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
      className="border-t-2 border-[var(--text)] pt-4"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <h3 className="ed-section-title mb-4 flex items-center gap-2 text-[1.125rem]">
        <Archive size={14} strokeWidth={2} aria-hidden="true" />
        지난 리포트
      </h3>
      <ul className="flex flex-col">
        {reports.map((r) => {
          const isActive = r.week_start === selectedStart
          return (
            <li key={r.id}>
              <Link
                href={reportHref(view, r.week_start)}
                aria-current={isActive ? 'page' : undefined}
                className="block border-l-2 py-2 pl-3 transition-colors"
                style={{
                  borderLeftColor: isActive ? 'var(--text)' : 'transparent',
                }}
              >
                <span
                  className="block font-[family-name:var(--font-mono)] text-xs tabular-nums"
                  style={{ color: isActive ? 'var(--text)' : 'var(--muted2)' }}
                >
                  {r.week_start} — {r.week_end}
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
