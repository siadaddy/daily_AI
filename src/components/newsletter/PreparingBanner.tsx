'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import type { NewsCard } from '@/lib/types'
import { newsHref } from '@/lib/dates'

function getTimeUntil0640KST(): { hours: number; minutes: number } | null {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const currentMins = hour * 60 + minute
  const targetMins = 6 * 60 + 40
  if (currentMins >= targetMins) return null
  const diff = targetMins - currentMins
  return { hours: Math.floor(diff / 60), minutes: diff % 60 }
}

function getYesterday(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d - 1)
  return new Intl.DateTimeFormat('en-CA').format(dt)
}

export function PreparingBanner({
  date,
  rawNews,
}: {
  date: string
  rawNews: NewsCard[]
}) {
  const [countdown, setCountdown] = useState(getTimeUntil0640KST)
  const yesterday = getYesterday(date)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntil0640KST()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="preparing-wrap">
      <div className="preparing-banner">
        <div className="preparing-spinner-wrap">
          <div className="preparing-spinner-ring" />
          <span className="preparing-icon">
            <Bot size={26} strokeWidth={1.5} />
          </span>
        </div>

        <div>
          <p className="preparing-title">콘텐츠 준비중</p>
          <p className="preparing-sub">
            AI 크리에이터가 오늘의 뉴스를 분석하고 있어요
          </p>
        </div>

        {countdown !== null ? (
          <div className="preparing-countdown">
            <Clock size={14} strokeWidth={2} />약{' '}
            {countdown.hours > 0
              ? `${countdown.hours}시간 ${countdown.minutes}분`
              : `${countdown.minutes}분`}{' '}
            후 공개
          </div>
        ) : (
          <div className="preparing-done">
            <CheckCircle2 size={14} strokeWidth={2} />
            생성 완료 예정 — 페이지를 새로고침해 보세요
          </div>
        )}

        <Link
          href={newsHref(yesterday)}
          className="preparing-yesterday inline-flex items-center gap-1"
        >
          어제 콘텐츠 보기
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

      {rawNews.length > 0 && (
        <div>
          <p className="preparing-raw-label">
            수집된 원본 뉴스 ({rawNews.length}건) — AI 분석 전
          </p>
          <ul className="preparing-raw-list">
            {rawNews.slice(0, 8).map((n, i) => (
              <li key={i} className="preparing-raw-item">
                <a
                  href={n.link ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preparing-raw-link"
                >
                  {n.title}
                </a>
                {n.category && (
                  <span className="preparing-raw-cat">[{n.category}]</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
