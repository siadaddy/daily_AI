'use client'

import { useEffect, useState } from 'react'

export function KospiWidget() {
  const [data, setData] = useState<{
    price: number | null
    change: number | null
  } | null>(null)

  useEffect(() => {
    fetch('/api/market')
      .then((r) => r.json())
      .then((d) => setData(d?.kospi ?? null))
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0
  const sign = up ? '▲' : '▼'

  return (
    <div className="dash-widget">
      <span className="dash-icon">📈</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.price ? data.price.toLocaleString() : '---'}
        </p>
        <p className="dash-label">
          KOSPI&nbsp;
          {data?.change != null && data.price && (
            <span
              style={{
                color: up ? 'var(--red)' : 'var(--blue)',
                fontWeight: 700,
              }}
            >
              {sign} {Math.abs(data.change)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
