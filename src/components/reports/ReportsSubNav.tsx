'use client'

import { useRouter } from 'next/navigation'
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

export function ReportsSubNav({ view }: { view: ReportsView }) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className="flex w-fit gap-1 rounded-full p-1"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
    >
      {VIEWS.map((v) => {
        const isActive = view === v.id
        const Icon = v.icon
        return (
          <button
            key={v.id}
            onClick={() => router.push(`/?tab=reports&view=${v.id}`)}
            className="relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
            style={{ color: isActive ? '#fff' : 'var(--muted2)' }}
          >
            {isActive && (
              <motion.span
                layoutId="reports-subnav-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--brand)',
                  boxShadow: 'var(--shadow-glow-brand)',
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32 }
                }
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} strokeWidth={2} />
              {v.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
