'use client'

import { useEffect, useState } from 'react'

export function NasdaqWidget() {
  const [data, setData] = useState<{ price: number | null; change: number | null } | null>(null)

  useEffect(() => {
    fetch('/api/market')
      .then((r) => r.json())
      .then((d) => setData(d?.nasdaq ?? null))
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0

  return (
    <div className="dash-widget">
      <span className="dash-icon">🇺🇸</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.price ? data.price.toLocaleString() : '---'}
        </p>
        <p className="dash-label">
          NASDAQ&nbsp;
          {data?.change != null && data.price && (
            <span style={{ color: up ? 'var(--red)' : 'var(--blue)', fontWeight: 700 }}>
              {up ? '▲' : '▼'} {Math.abs(data.change)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
