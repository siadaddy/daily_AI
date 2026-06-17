'use client'

import { useTheme } from '@/components/layout/ThemeProvider'
import { ClockWidget } from '@/components/dashboard/ClockWidget'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { UserButton } from '@/components/layout/UserButton'
export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="site-header">
      {/* 상단 그라디언트 라인 */}
      <div className="header-accent-line" />

      <div className="header-main">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="header-logo">
            <div className="header-logo-icon">🤖</div>
            <div>
              <h1 className="header-title">시아아빠의 AI 데일리</h1>
              <p className="header-subtitle">
                AI · 경제 · 자동차 · 매일 06:40 업데이트
              </p>
            </div>
          </div>

          {/* 우측: 시계·날씨 + 로그인 + 배지 + 테마 토글 */}
          <div className="flex items-center gap-3">
            {/* 시계 + 날씨 고정 표시 */}
            <div className="header-live-widgets">
              <ClockWidget />
              <div className="header-widget-divider" />
              <WeatherWidget />
            </div>

            <UserButton />
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
      </div>

    </header>
  )
}
