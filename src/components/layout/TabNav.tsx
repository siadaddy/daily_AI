'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useAppStore } from '@/store/app'
import { useTheme } from '@/components/layout/ThemeProvider'
import type { TabId } from '@/lib/types'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'newsletter', label: 'AI 뉴스레터', icon: Newspaper },
  { id: 'reports', label: '리포트', icon: BarChart3 },
  { id: 'music', label: '뮤직 유니버스', icon: Sparkles },
  // { id: 'office', label: 'AI 사무실', icon: Wrench },
  { id: 'portfolio', label: '포트폴리오', icon: Wrench },
]

export function TabNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTab, setTab } = useAppStore()
  const { theme, setTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  const currentTab = (searchParams.get('tab') as TabId) || activeTab

  function handleTab(id: TabId) {
    setTab(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

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
              const isActive = currentTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  className="relative flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--brand-light)' : 'var(--muted)',
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full"
                      style={{ background: 'var(--brand)' }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 32 }
                      }
                    />
                  )}
                </button>
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
