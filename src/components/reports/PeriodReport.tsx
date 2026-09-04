'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  CalendarRange,
  Lightbulb,
  Target,
  BarChart3,
  Layers,
  type LucideIcon,
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
  if (trend === 'up')
    return (
      <span aria-label="증가" style={{ color: 'var(--green)' }}>
        ▲
      </span>
    )
  if (trend === 'down')
    return (
      <span aria-label="감소" style={{ color: 'var(--red)' }}>
        ▼
      </span>
    )
  return (
    <span aria-label="변동 없음" style={{ color: 'var(--muted)' }}>
      –
    </span>
  )
}

/** 리포트 내부 소제목 — 괘선 + 아이콘 + 세리프 */
function Rubric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: string
}) {
  return (
    <h3 className="ed-section-title mb-4 flex items-center gap-2 border-t border-[var(--rule)] pt-4 text-[1.125rem]">
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {children}
    </h3>
  )
}

/**
 * 기간 리포트.
 * 이전에는 동일한 글래스 카드 5장이 세로로 쌓여 무엇이 결론인지 알 수 없었다.
 * 지금은 하나의 기사다 — 요약이 리드 문단으로 올라오고,
 * 나머지는 괘선으로만 구분된 소절이 된다.
 */
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
    initial: prefersReducedMotion ? false : { opacity: 0, y: 16 },
    whileInView: prefersReducedMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' } as const,
    transition: { duration: 0.45, ease: 'easeOut' } as const,
  }

  if (!report) {
    return (
      <div className="flex min-h-64 items-center justify-center border-t-2 border-[var(--rule-strong)] px-6 py-16 text-center">
        <p className="kicker">{labels.empty}</p>
      </div>
    )
  }

  return (
    <motion.article className="flex flex-col gap-10" {...reveal}>
      {/* 리드 — 기간과 한 줄 요약이 가장 먼저 */}
      <header className="border-t-2 border-[var(--text)] pt-5">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="kicker kicker-accent flex items-center gap-1.5">
            <BadgeIcon size={11} strokeWidth={2} aria-hidden="true" />
            {labels.badge}
          </span>
          <span className="kicker">
            {report.week_start} — {report.week_end}
          </span>
        </div>
        <p className="ed-lede font-[family-name:var(--font-serif)]">
          {report.summary}
        </p>
      </header>

      {/* 분야 분포 */}
      {report.categories.length > 0 && (
        <section>
          <Rubric icon={BarChart3}>TOP 뉴스 분야 분포</Rubric>
          <p className="kicker mb-4">
            AI가 매일 TOP 3로 고른 뉴스의 분야별 건수 · 직전 기간 대비 증감
          </p>
          <CategoryChart stats={report.categories} />
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--rule)] pt-4">
            {report.categories.map((cat) => (
              <span
                key={cat.name}
                className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs tabular-nums"
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
        </section>
      )}

      {/* 분야별 심층 */}
      {sections.length > 0 && (
        <section>
          <Rubric icon={Layers}>분야별 심층</Rubric>
          <div className="flex flex-col">
            {sections.map((section, i) => (
              <div
                key={`${section.category}-${i}`}
                className="flex flex-col gap-2 border-b border-[var(--rule)] py-4 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="kicker kicker-brand">
                    {section.category}
                  </span>
                  <span className="ed-display text-[0.9375rem] leading-snug">
                    {section.top_issue}
                  </span>
                </div>
                <p
                  className="text-[0.8125rem] leading-relaxed"
                  style={{ color: 'var(--muted2)' }}
                >
                  {section.insight}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 인사이트 */}
      <section>
        <Rubric icon={Lightbulb}>{labels.insights}</Rubric>
        <p
          className="text-sm leading-[1.9]"
          style={{ color: 'var(--muted2)', maxWidth: '68ch' }}
        >
          {report.insights}
        </p>
      </section>

      {/* 다음 기간 주목 포인트 */}
      {report.next_focus.length > 0 && (
        <section>
          <Rubric icon={Target}>{labels.nextFocus}</Rubric>
          <ol className="flex list-none flex-col p-0">
            {report.next_focus.map((item, i) => (
              <li
                key={i}
                className="flex items-baseline gap-3 border-b border-[var(--rule)] py-3 text-sm last:border-b-0"
                style={{ color: 'var(--muted2)' }}
              >
                <span
                  className="shrink-0 font-[family-name:var(--font-mono)] text-xs tabular-nums"
                  style={{ color: 'var(--rule-strong)' }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      )}
    </motion.article>
  )
}
