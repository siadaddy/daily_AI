'use client'

import Link from 'next/link'
import { ClockWidget } from '@/components/dashboard/ClockWidget'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { UserButton } from '@/components/layout/UserButton'

export function Header() {

  return (
    <header className="site-header">
      {/* 상단 그라디언트 라인 */}
      <div className="header-accent-line" />

      <div className="header-main">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo — home link */}
          <Link
            href="/"
            className="header-logo group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="header-logo-icon transition-transform group-hover:scale-110">🤖</div>
            <div>
              <h1 className="header-title">시아아빠의 AI 데일리</h1>
              <p className="header-subtitle">
                AI · 경제 · 자동차 · 매일 06:40 업데이트
              </p>
            </div>
          </Link>

          {/* 우측: 로그인 + 시계·날씨 */}
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="header-live-widgets">
              <ClockWidget />
              <div className="header-widget-divider" />
              <WeatherWidget />
            </div>
          </div>
        </div>
      </div>

    </header>
  )
}
