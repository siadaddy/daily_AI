'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Newspaper, Scale, FileText, type LucideIcon } from 'lucide-react'
import { autoHref, type AutoView } from './href'

const VIEWS: { id: AutoView; label: string; icon: LucideIcon }[] = [
  { id: 'briefing', label: '일일 브리핑', icon: Newspaper },
  { id: 'competitors', label: '경쟁사 비교', icon: Scale },
  { id: 'reports', label: '보고서', icon: FileText },
]

/** 자동차 인사이트 하위 내비 — ReportsSubNav 와 같은 밑줄 탭. */
export function AutoSubNav({ view }: { view: AutoView }) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <nav
      className="flex w-full gap-0 border-b border-[var(--rule)]"
      aria-label="자동차 인사이트 보기 전환"
    >
      {VIEWS.map((v) => {
        const isActive = view === v.id
        const Icon = v.icon
        return (
          <Link
            key={v.id}
            href={autoHref({ view: v.id })}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex items-center gap-1.5 px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors first:pl-0"
            style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}
          >
            <Icon size={13} strokeWidth={2} aria-hidden="true" />
            {v.label}
            {isActive && (
              <motion.span
                layoutId="auto-subnav-underline"
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
