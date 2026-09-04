'use client'

import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Newspaper,
  BarChart3,
  Sparkles,
  Wrench,
  Info,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from '@/components/layout/ThemeProvider'
import type { TabId } from '@/lib/types'
import { tabHref } from '@/lib/tabs'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'newsletter', label: 'AI 뉴스레터', icon: Newspaper },
  { id: 'reports', label: '리포트', icon: BarChart3 },
  { id: 'music', label: '뮤직 유니버스', icon: Sparkles },
  // { id: 'office', label: 'AI 사무실', icon: Wrench },
  { id: 'portfolio', label: '포트폴리오', icon: Wrench },
]

/**
 * 활성 탭은 서버에서 결정해 prop으로 내려준다.
 * 여기서 `useSearchParams()`로 읽으면 정적 페이지에서 이 경계가
 * 클라이언트 렌더로 빠져 서버 HTML에 탭 내비게이션이 아예 없어진다.
 * 어느 탭에도 속하지 않는 경로(`/keyword`, `/agents`)는 null을 넘긴다.
 */
export function TabNav({ activeTab }: { activeTab: TabId | null }) {
  const { theme, setTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  return (
    <nav
      className="border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
        {/* 탭 목록 — 좌측, 가로 스크롤 + 스크롤 어포던스(페이드 마스크) */}
        <div className="tn-list-wrap">
          <div className="tn-list">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <Link
                  key={tab.id}
                  href={tabHref(tab.id)}
                  scroll={false}
                  aria-current={isActive ? 'page' : undefined}
                  className="tn-tab"
                >
                  <Icon size={14} strokeWidth={2} aria-hidden="true" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      aria-hidden="true"
                      className="absolute right-0 bottom-0 left-0 h-0.5"
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
          </div>
          <div className="tn-fade" />
        </div>

        {/* 컨트롤 — 우측 고정 */}
        <div className="flex shrink-0 items-center gap-1 pl-2">
          <Link
            href="/about"
            className="header-theme-btn"
            aria-label="서비스 소개"
            title="서비스 소개"
          >
            <Info size={16} strokeWidth={2} />
          </Link>
          <div className="header-stats">
            <span>60일 아카이브</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="header-theme-btn"
            aria-label="테마 전환"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { rotate: -90, opacity: 0, scale: 0.6 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { rotate: 0, opacity: 1, scale: 1 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { rotate: 90, opacity: 0, scale: 0.6 }
                }
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.25 }}
                className="flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <Sun size={16} strokeWidth={2} />
                ) : (
                  <Moon size={16} strokeWidth={2} />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </nav>
  )
}
