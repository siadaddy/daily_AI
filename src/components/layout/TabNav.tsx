'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/app'
import type { TabId } from '@/lib/types'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'newsletter', label: 'AI 뉴스레터', emoji: '📰' },
  { id: 'reports', label: '리포트', emoji: '📊' },
  // { id: 'music', label: '뮤직 유니버스', emoji: '🌌' },
  // { id: 'office', label: 'AI 사무실', emoji: '🏢' },
]

export function TabNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTab, setTab } = useAppStore()

  const currentTab = (searchParams.get('tab') as TabId) || activeTab

  function handleTab(id: TabId) {
    setTab(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <nav
      className="sticky border-b"
      style={{ top: 'var(--header-h)', zIndex: 40, background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
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
    </nav>
  )
}
