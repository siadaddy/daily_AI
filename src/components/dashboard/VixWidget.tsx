'use client'

import { useEffect, useState } from 'react'

export function VixWidget() {
  const [data, setData] = useState<{ price: number | null; change: number | null } | null>(null)

  useEffect(() => {
    fetch('/api/market')
      .then((r) => r.json())
      .then((d) => setData(d?.vix ?? null))
      .catch(() => {})
  }, [])

  const vix = data?.price ?? 0
  // VIX 수치에 따른 색상: 낮음=안정(파랑), 중간=주의(노랑), 높음=공포(빨강)
  const vixColor =
    vix === 0 ? 'var(--muted)'
    : vix < 15 ? 'var(--blue)'
    : vix < 25 ? 'var(--gold)'
    : 'var(--red)'

  const vixLabel =
    vix === 0 ? '공포지수'
    : vix < 15 ? '공포지수 안정'
    : vix < 25 ? '공포지수 주의'
    : '공포지수 공포'

  return (
    <div className="dash-widget">
      <span className="dash-icon">😱</span>
      <div className="dash-body">
        <p className="dash-value" style={{ color: vixColor }}>
          {data?.price ? data.price.toFixed(2) : '---'}
        </p>
        <p className="dash-label">
          {vixLabel}&nbsp;
          {data?.change != null && data.price && (
            <span style={{ color: vixColor, fontWeight: 700 }}>
              {(data.change ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(data.change ?? 0)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
