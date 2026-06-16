'use client'

import { useEffect, useState } from 'react'

export function BtcWidget() {
  const [data, setData] = useState<{ krw: number; change: number } | null>(null)

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0
  const changeStr = data
    ? `${up ? '▲' : '▼'} ${Math.abs(data.change)}%`
    : null

  return (
    <div className="dash-widget">
      <span className="dash-icon">₿</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.krw ? `₩${(data.krw / 1_000_000).toFixed(1)}M` : '---'}
        </p>
        <p className="dash-label">
          BTC/KRW&nbsp;
          {changeStr && (
            <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
              {changeStr}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
