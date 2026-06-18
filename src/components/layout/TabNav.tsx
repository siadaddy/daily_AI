'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/app'
import { useTheme } from '@/components/layout/ThemeProvider'
import type { TabId } from '@/lib/types'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'newsletter', label: 'AI 뉴스레터', emoji: '📰' },
  { id: 'reports', label: '리포트', emoji: '📊' },
  { id: 'music', label: '뮤직 유니버스', emoji: '🌌' },
  // { id: 'office', label: 'AI 사무실', emoji: '🏢' },
  { id: 'portfolio', label: 'My Works', emoji: '🛠' },
]

export function TabNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTab, setTab } = useAppStore()
  const { theme, setTheme } = useTheme()

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
        {/* 탭 목록 — 좌측, 가로 스크롤 */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className="flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  borderBottomColor: isActive ? 'var(--bmw)' : 'transparent',
                  color: isActive ? 'var(--bmw-lt)' : 'var(--muted)',
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* 컨트롤 — 우측 고정 */}
        <div className="flex shrink-0 items-center gap-1 pl-2">
          <Link
            href="/about"
            className="header-theme-btn"
            aria-label="서비스 소개"
            title="서비스 소개"
          >
            ℹ️
          </Link>
          <div className="header-stats">
            <span>60일 아카이브</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="header-theme-btn"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  )
}
