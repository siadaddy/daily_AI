'use client'

import { useEffect, useState } from 'react'

export function BtcWidget() {
  const [data, setData] = useState<{ krw: number; change: number } | null>(null)

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then((d) => setData(d?.btc ?? null))
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0

  return (
    <div className="dash-widget">
      <span className="dash-icon">₿</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.krw ? `₩${(data.krw / 1_000_000).toFixed(1)}M` : '---'}
        </p>
        <p className="dash-label">
          BTC/KRW&nbsp;
          {data && (
            <span
              style={{
                color: up ? 'var(--red)' : 'var(--blue)',
                fontWeight: 700,
              }}
            >
              {up ? '▲' : '▼'} {Math.abs(data.change)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
