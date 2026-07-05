'use client'

import { useEffect, useState } from 'react'

export function EthWidget() {
  const [data, setData] = useState<{ krw: number; change: number } | null>(null)

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then((d) => setData(d?.eth ?? null))
      .catch(() => {})
  }, [])

  const up = (data?.change ?? 0) >= 0

  return (
    <div className="dash-widget">
      <span className="dash-icon">Ξ</span>
      <div className="dash-body">
        <p className="dash-value">
          {data?.krw ? `₩${(data.krw / 1_000_000).toFixed(2)}M` : '---'}
        </p>
        <p className="dash-label">
          ETH/KRW&nbsp;
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
