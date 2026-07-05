'use client'

import { useState, useEffect } from 'react'
import { useInterval } from '@/lib/hooks/useInterval'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('ko')

export function ClockWidget() {
  const [now, setNow] = useState<dayjs.Dayjs | null>(null)

  // 하이드레이션 이후 첫 프레임에 시간 표시 (SSR 마크업과의 불일치 방지)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(dayjs().tz('Asia/Seoul')))
    return () => cancelAnimationFrame(raf)
  }, [])
  useInterval(() => {
    setNow(dayjs().tz('Asia/Seoul'))
  }, 1000)

  return (
    <div className="dash-widget">
      <span className="dash-icon">🕐</span>
      <div className="dash-body">
        <p className="dash-value font-mono">
          {now ? now.format('HH:mm:ss') : '--:--:--'}
        </p>
        <p className="dash-label">{now ? now.format('M월 D일 dddd') : 'KST'}</p>
      </div>
    </div>
  )
}
