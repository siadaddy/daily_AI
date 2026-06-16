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

  useEffect(() => { setNow(dayjs().tz('Asia/Seoul')) }, [])
  useInterval(() => { setNow(dayjs().tz('Asia/Seoul')) }, 1000)

  return (
    <div className="dash-widget">
      <span className="dash-icon">🕐</span>
      <div className="dash-body">
        <p className="dash-value font-mono">
          {now ? now.format('HH:mm:ss') : '--:--:--'}
        </p>
        <p className="dash-label">
          {now ? now.format('M월 D일 dddd') : 'KST'}
        </p>
      </div>
    </div>
  )
}
