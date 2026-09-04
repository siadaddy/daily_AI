'use client'

import Link from 'next/link'
import { Bot } from 'lucide-react'
import { ClockWidget } from '@/components/dashboard/ClockWidget'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { UserButton } from '@/components/layout/UserButton'

/**
 * 마스트헤드. 신문 제호처럼 굵은 괘선 아래 제호를 앉힌다.
 * 이전의 오로라 블롭·그라디언트 제목·유리 패널은 전부 걷어냈다 —
 * 매일 보는 화면에서 상시 애니메이션은 정보가 아니라 소음이다.
 */
export function Header() {
  return (
    <header className="site-header">
      {/* 제호 위 굵은 괘선 — 유일하게 남긴 장식 */}
      <div className="header-accent-line" />

      <div className="header-main">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="header-logo group">
            <span className="header-logo-icon">
              <Bot size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="header-logo-text">
              <span className="header-title block">시아아빠의 AI 데일리</span>
              <span className="header-subtitle block">
                Daily&nbsp;AI&nbsp;Briefing · Seoul
              </span>
            </span>
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
              <span className="header-compact-divider" aria-hidden="true">
                ·
              </span>
              <WeatherWidget compact />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
