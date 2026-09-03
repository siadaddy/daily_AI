'use client'

import Link from 'next/link'
import { Bot } from 'lucide-react'
import { ClockWidget } from '@/components/dashboard/ClockWidget'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { UserButton } from '@/components/layout/UserButton'

export function Header() {
  return (
    <header className="site-header">
      {/* 상단 그라디언트 라인 (정적) */}
      <div className="header-accent-line" />

      <div className="header-main">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo — home link */}
          <Link
            href="/"
            className="header-logo group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="header-logo-icon transition-transform group-hover:scale-110">
              <Bot size={22} strokeWidth={2} />
            </div>
            <div className="header-logo-text">
              <h1 className="header-title">시아아빠의 AI 데일리</h1>
              <p className="header-subtitle">
                Claude Code와 함께한 뉴스 &amp; 포트폴리오 놀이터
              </p>
            </div>
          </Link>

          {/* 우측: 로그인 + 시계·날씨 */}
          <div className="flex shrink-0 items-center gap-3">
            <UserButton />
            {/* 데스크톱: 전체 위젯 */}
            <div className="header-live-widgets hidden md:flex">
              <ClockWidget />
              <div className="header-widget-divider" />
              <WeatherWidget />
            </div>
            {/* 모바일: 압축 한 줄 표시 */}
            <div className="header-live-widgets-compact flex md:hidden">
              <ClockWidget compact />
              <span className="header-compact-divider">·</span>
              <WeatherWidget compact />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
