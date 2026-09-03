'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>([])
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    sb.from('card_news')
      .select('cards')
      .eq('date', getToday())
      .single()
      .then(({ data }) => {
        if (data?.cards) {
          const cards = data.cards as { headline: string }[]
          setHeadlines(cards.map((c) => c.headline))
        }
      })
  }, [])

  if (headlines.length === 0) return null

  // 무한 루프를 위해 3벌 복사
  const items = [...headlines, ...headlines, ...headlines]

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        <div
          className={['ticker-inner', paused && 'ticker-inner--paused']
            .filter(Boolean)
            .join(' ')}
          style={{ '--count': items.length } as React.CSSProperties}
          onTouchStart={() => setPaused((p) => !p)}
          aria-label="실시간 뉴스 헤드라인 (탭하여 정지/재생)"
        >
          {items.map((h, i) => (
            <span key={i} className="ticker-item">
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
