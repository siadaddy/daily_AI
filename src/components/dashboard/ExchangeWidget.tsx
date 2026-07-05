'use client'

import { useEffect, useState } from 'react'

export function ExchangeWidget() {
  const [krw, setKrw] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/exchange')
      .then((r) => r.json())
      .then((d) => setKrw(d.krw))
      .catch(() => {})
  }, [])

  return (
    <div className="dash-widget">
      <span className="dash-icon">💵</span>
      <div className="dash-body">
        <p className="dash-value">{krw ? `₩${krw.toLocaleString()}` : '---'}</p>
        <p className="dash-label">USD/KRW</p>
      </div>
    </div>
  )
}
