'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  CalendarRange,
  LineChart,
  type LucideIcon,
} from 'lucide-react'

export type ReportsView = 'weekly' | 'monthly' | 'dashboard'

const VIEWS: { id: ReportsView; label: string; icon: LucideIcon }[] = [
  { id: 'weekly', label: '주간 리포트', icon: Calendar },
  { id: 'monthly', label: '월간 리포트', icon: CalendarRange },
  { id: 'dashboard', label: '분석 대시보드', icon: LineChart },
]

/**
 * 리포트 하위 내비.
 * 알약 버튼 → 밑줄 탭. router.push 버튼도 Link로 바꿔
 * 새 탭 열기(⌘+클릭)와 가운데 클릭이 동작하게 했다.
 */
export function ReportsSubNav({ view }: { view: ReportsView }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <nav
      className="flex w-full gap-0 border-b border-[var(--rule)]"
      aria-label="리포트 보기 전환"
    >
      {VIEWS.map((v) => {
        const isActive = view === v.id
        const Icon = v.icon
        return (
          <Link
            key={v.id}
            href={`/?tab=reports&view=${v.id}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex items-center gap-1.5 px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors first:pl-0"
            style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}
          >
            <Icon size={13} strokeWidth={2} aria-hidden="true" />
            {v.label}
            {isActive && (
              <motion.span
                layoutId="reports-subnav-underline"
                aria-hidden="true"
                className="absolute right-0 -bottom-px left-0 h-0.5"
                style={{ background: 'var(--text)' }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32 }
                }
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
