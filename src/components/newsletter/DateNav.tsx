'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date()
  )
}

function parseDateParts(dateStr: string) {
  // dateStr: YYYY-MM-DD (로컬 시간으로 파싱)
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    month: m,
    day: d,
    dow: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  }
}

export function DateNav({
  selectedDate,
  dates,
}: {
  selectedDate: string
  dates: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listRef = useRef<HTMLDivElement>(null)
  const today = getToday()

  // 오늘(or 선택된) 칩으로 자동 스크롤
  useEffect(() => {
    if (!listRef.current || dates.length === 0) return
    const active = listRef.current.querySelector<HTMLElement>('.dn-chip.active')
    if (active) {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [dates, selectedDate])

  const handleSelect = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (date === today) {
        params.delete('date')
      } else {
        params.set('date', date)
      }
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams, today]
  )

  if (dates.length === 0) {
    return (
      <div className="dn-wrap">
        <div className="dn-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="dn-chip-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  // 날짜를 월별로 그룹핑 (순서 유지)
  const groups: { month: string; items: string[] }[] = []
  for (const d of dates) {
    const m = d.slice(0, 7) // YYYY-MM
    const last = groups[groups.length - 1]
    if (last && last.month === m) {
      last.items.push(d)
    } else {
      groups.push({ month: m, items: [d] })
    }
  }

  return (
    <div className="dn-wrap">
      <div className="dn-inner">
        {/* 왼쪽: 라벨 */}
        <div className="dn-label">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          날짜
        </div>

        {/* 칩 목록 */}
        <div className="dn-list-wrap">
          <div className="dn-list" ref={listRef}>
            {groups.map((group, gi) => (
              <div key={group.month} className="dn-group">
                {/* 월 구분선 (두 번째 그룹부터) */}
                {gi > 0 && (
                  <div className="dn-divider">
                    <span>{Number(group.month.split('-')[1])}월</span>
                  </div>
                )}
                {group.items.map((d) => {
                  const { month, day, dow, isWeekend } = parseDateParts(d)
                  const isToday = d === today
                  const isActive = d === selectedDate
                  return (
                    <button
                      key={d}
                      onClick={() => handleSelect(d)}
                      className={`dn-chip${isActive ? 'active' : ''}${isToday ? 'today' : ''}${isWeekend ? 'weekend' : ''}`}
                      title={`${month}월 ${day}일 (${dow})`}
                    >
                      <span className="dn-chip-dow">{dow}</span>
                      <span className="dn-chip-day">{day}</span>
                      {isToday && <span className="dn-chip-dot" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          {/* 우측 페이드 */}
          <div className="dn-fade" />
        </div>
      </div>
    </div>
  )
}
