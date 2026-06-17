'use client'

import { useEffect, useState } from 'react'

export function GoldWidget() {
  const [data, setData] = useState<{ price: number | null; change: number | null } | null>(null)

  useEffect(() => {
    fetch('/api/market')
      .then((r) => r.json())
      .then((d) => setData(d?.gold ?? null))
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0

  return (
    <div className="dash-widget">
      <span className="dash-icon">🥇</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.price ? `$${data.price.toLocaleString()}` : '---'}
        </p>
        <p className="dash-label">
          GOLD/oz&nbsp;
          {data?.change != null && data.price && (
            <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
              {up ? '▲' : '▼'} {Math.abs(data.change)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
