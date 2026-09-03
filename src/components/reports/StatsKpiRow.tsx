'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useInView,
  useReducedMotion,
  animate,
} from 'framer-motion'
import {
  Newspaper,
  CalendarDays,
  Flame,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import type { AnalyticsPayload } from '@/lib/types'

interface KpiBox {
  icon: LucideIcon
  label: string
  numericValue?: number
  suffix?: string
  staticValue?: string
  sub?: string
  deltaPct?: number
}

function CountUpNumber({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const formatted = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString()
  )

  useEffect(() => {
    if (!isInView) return
    if (prefersReducedMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [isInView, value, prefersReducedMotion, motionValue])

  return <motion.span ref={ref}>{formatted}</motion.span>
}

function DeltaChip({ pct, prevLabel }: { pct: number; prevLabel: string }) {
  if (pct === 0) {
    return (
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        변동 없음
      </span>
    )
  }
  const up = pct > 0
  return (
    <span
      className="text-xs font-semibold"
      style={{ color: up ? 'var(--green)' : 'var(--red)' }}
    >
      {up ? '▲' : '▼'} {Math.abs(pct)}%{' '}
      <span style={{ color: 'var(--muted)' }}>vs {prevLabel}</span>
    </span>
  )
}

export function StatsKpiRow({ data }: { data: AnalyticsPayload }) {
  const prevLabel =
    data.periodLabel === '오늘'
      ? '어제'
      : data.periodLabel === '이번 주'
        ? '지난 주'
        : '지난 달'

  const boxes: KpiBox[] = [
    {
      icon: Newspaper,
      label: '총 기사수',
      numericValue: data.totalArticles,
      suffix: '건',
      sub: data.periodLabel,
      deltaPct: data.comparison?.totalDeltaPct,
    },
    {
      icon: CalendarDays,
      label: '일 평균',
      numericValue: data.avgPerDay,
      suffix: '건',
      sub: '하루 기준',
      deltaPct: data.comparison?.avgPerDayDeltaPct,
    },
    {
      icon: Flame,
      label: '최다 발행일',
      staticValue: data.topDate || '—',
      sub: '가장 많은 뉴스',
    },
    {
      icon: Tags,
      label: '카테고리',
      numericValue: data.categoryStats.length,
      suffix: '개',
      sub: '분류 기준',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {boxes.map((box) => {
        const Icon = box.icon
        return (
          <div
            key={box.label}
            className="glass-card flex flex-col gap-1 rounded-2xl p-4"
          >
            <Icon
              size={18}
              strokeWidth={2}
              style={{ color: 'var(--brand-light)' }}
            />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {box.label}
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text)' }}
            >
              {box.numericValue !== undefined ? (
                <>
                  <CountUpNumber value={box.numericValue} />
                  {box.suffix}
                </>
              ) : (
                box.staticValue
              )}
            </span>
            {box.deltaPct !== undefined ? (
              <DeltaChip pct={box.deltaPct} prevLabel={prevLabel} />
            ) : box.sub ? (
              <span className="text-xs" style={{ color: 'var(--muted2)' }}>
                {box.sub}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
