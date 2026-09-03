'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  CalendarRange,
  Lightbulb,
  Target,
  BarChart3,
  Layers,
} from 'lucide-react'
import type {
  PeriodReport as PeriodReportData,
  CategoryStat,
} from '@/lib/types'
import { CategoryChart } from './CategoryChart'

const LABELS = {
  weekly: {
    badge: '주간 트렌드 브리핑',
    badgeIcon: Calendar,
    insights: '주간 인사이트',
    nextFocus: '다음 주 주목 포인트',
    empty: '주간 리포트가 아직 없습니다 (매주 월요일 자동 생성)',
  },
  monthly: {
    badge: '월간 트렌드 리포트',
    badgeIcon: CalendarRange,
    insights: '월간 인사이트',
    nextFocus: '다음 달 주목 포인트',
    empty: '월간 리포트가 아직 없습니다 (매월 1일 자동 생성)',
  },
} as const

function TrendMark({ trend }: { trend: CategoryStat['trend'] }) {
  if (trend === 'up') return <span style={{ color: 'var(--green)' }}>▲</span>
  if (trend === 'down') return <span style={{ color: 'var(--red)' }}>▼</span>
  return <span style={{ color: 'var(--muted)' }}>–</span>
}

export function PeriodReport({
  report,
  periodType,
}: {
  report: PeriodReportData | null
  periodType: 'weekly' | 'monthly'
}) {
  const labels = LABELS[periodType]
  const BadgeIcon = labels.badgeIcon
  const sections = report?.raw_data?.sections ?? []
  const prefersReducedMotion = useReducedMotion()

  const reveal = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 24 },
    whileInView: prefersReducedMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' } as const,
    transition: { duration: 0.45, ease: 'easeOut' } as const,
  }

  if (!report) {
    return (
      <div className="glass-card flex min-h-64 items-center justify-center rounded-2xl">
        <p style={{ color: 'var(--muted)' }}>{labels.empty}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div className="glass-card rounded-2xl p-5" {...reveal}>
        <div className="mb-2 flex items-center gap-2">
          <span className="badge badge-blue inline-flex items-center gap-1">
            <BadgeIcon size={12} strokeWidth={2.5} />
            {labels.badge}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {report.week_start} ~ {report.week_end}
          </span>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted2)' }}
        >
          {report.summary}
        </p>
      </motion.div>

      {/* Chart + category trends */}
      {report.categories.length > 0 && (
        <motion.div className="glass-card rounded-2xl p-5" {...reveal}>
          <h3
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            <BarChart3 size={16} strokeWidth={2} />
            TOP 뉴스 분야 분포
          </h3>
          <p className="mb-3 text-xs" style={{ color: 'var(--muted)' }}>
            AI가 매일 TOP 3로 고른 뉴스의 분야별 건수 · 직전 기간 대비 증감
          </p>
          <CategoryChart stats={report.categories} />
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {report.categories.map((cat) => (
              <span
                key={cat.name}
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--muted2)' }}
              >
                <TrendMark trend={cat.trend} />
                {cat.name} {cat.count}건
                {cat.deltaPct !== undefined && cat.deltaPct !== 0 && (
                  <span style={{ color: 'var(--muted)' }}>
                    ({cat.deltaPct > 0 ? '+' : ''}
                    {cat.deltaPct}%)
                  </span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 분야별 심층 — raw_data.sections */}
      {sections.length > 0 && (
        <motion.div className="glass-card rounded-2xl p-5" {...reveal}>
          <h3
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            <Layers size={16} strokeWidth={2} />
            분야별 심층
          </h3>
          <div className="flex flex-col gap-4">
            {sections.map((section, i) => (
              <div
                key={`${section.category}-${i}`}
                className="flex flex-col gap-1.5 rounded-xl px-4 py-3"
                style={{
                  background: 'var(--glass)',
                  borderLeft: '3px solid var(--brand)',
                }}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--brand-light)' }}
                  >
                    {section.category}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {section.top_issue}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--muted2)' }}
                >
                  {section.insight}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div className="glass-card rounded-2xl p-5" {...reveal}>
        <h3
          className="mb-3 flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          <Lightbulb size={16} strokeWidth={2} />
          {labels.insights}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted2)' }}
        >
          {report.insights}
        </p>
      </motion.div>

      {/* Next period focus */}
      {report.next_focus.length > 0 && (
        <motion.div className="glass-card rounded-2xl p-5" {...reveal}>
          <h3
            className="mb-3 flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            <Target size={16} strokeWidth={2} />
            {labels.nextFocus}
          </h3>
          <ul className="flex flex-col gap-2">
            {report.next_focus.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--muted2)' }}
              >
                <span style={{ color: 'var(--brand-light)' }}>▸</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
