'use client'

import { useEffect, useState } from 'react'

const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫', 51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧', 71: '🌨', 80: '🌦',
  95: '⛈', 99: '⛈',
}

function pm25Level(val: number) {
  if (val <= 15) return { label: '좋음', color: 'var(--green)' }
  if (val <= 35) return { label: '보통', color: 'var(--gold)' }
  if (val <= 75) return { label: '나쁨', color: '#f97316' }
  return { label: '매우나쁨', color: 'var(--red)' }
}

export function WeatherWidget() {
  const [data, setData] = useState<{ temp: number; code: number; pm25: number } | null>(null)

  useEffect(() => {
    fetch('/api/weather').then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  const icon = data ? (WMO_ICONS[data.code] ?? '🌡') : null
  const pm   = data ? pm25Level(data.pm25) : null

  return (
    <div className="dash-widget">
      <span className="dash-icon">{icon ?? '🌤'}</span>
      <div className="dash-body">
        <p className="dash-value">
          {data ? `서울 ${data.temp}°C` : '---'}
        </p>
        <p className="dash-label">
          {data ? (
            <>PM2.5 {data.pm25}&nbsp;<span style={{ color: pm!.color }}>{pm!.label}</span></>
          ) : '날씨 로딩...'}
        </p>
      </div>
    </div>
  )
}
