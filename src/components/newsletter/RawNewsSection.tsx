'use client'

import { useState } from 'react'
import type { NewsCard, Category } from '@/lib/types'
import { useAppStore } from '@/store/app'

const CATEGORIES: Category[] = [
  '전체',
  '🔥 오늘의 하이라이트',
  '🤖 AI / 인공지능',
  '💻 기술 / IT',
  '💰 경제 / 금융',
  '🚗 자동차',
  '🚘 BMW',
  '🏢 삼천리 그룹',
  '🏙️ 사회',
  '🚨 사건 / 사고',
]

export function RawNewsSection({ news }: { news: NewsCard[] }) {
  const { categoryFilter, setFilter } = useAppStore()
  const [open, setOpen] = useState(false)

  const filtered =
    categoryFilter === '전체'
      ? news
      : news.filter((n) => n.category === categoryFilter)

  return (
    <section>
      {/* Header with toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="mb-3 flex w-full items-center justify-between rounded-xl p-3 transition-colors hover:opacity-80"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="font-semibold" style={{ color: 'var(--text)' }}>
          📋 전체 뉴스 ({news.length}건)
        </span>
        <span
          className="transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--muted)',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="animate-fade-in">
          {/* Category filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background:
                    categoryFilter === cat ? 'var(--bmw)' : 'var(--glass)',
                  color: categoryFilter === cat ? '#fff' : 'var(--muted2)',
                  border: '1px solid var(--border)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* News list */}
          <div className="flex flex-col gap-2">
            {filtered.map((item) => (
              <a
                key={item.id}
                href={item.link ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:opacity-80"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="badge badge-purple mt-0.5 shrink-0">
                  {item.category}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm leading-snug font-medium"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="mt-1 line-clamp-1 text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    {item.summary}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
