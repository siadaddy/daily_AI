'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ClipboardList, ChevronDown } from 'lucide-react'
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
  '🏙️ 사회',
  '🚨 사건 / 사고',
]

export function RawNewsSection({ news }: { news: NewsCard[] }) {
  const { categoryFilter, setFilter } = useAppStore()
  const [open, setOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const filtered =
    categoryFilter === '전체'
      ? news
      : news.filter((n) => n.category === categoryFilter)

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-controls="raw-news-panel"
        className="mb-4 flex w-full items-center justify-between border-b border-[var(--rule)] py-3 transition-colors"
      >
        <span className="kicker flex items-center gap-2">
          <ClipboardList size={13} strokeWidth={2} aria-hidden="true" />
          전체 뉴스 {news.length}건
        </span>
        <span
          className="transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--muted)',
          }}
          aria-hidden="true"
        >
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <div id="raw-news-panel" className="animate-fade-in">
          {/* Category filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={categoryFilter === cat}
                className="rounded-sm px-2.5 py-1 font-[family-name:var(--font-mono)] text-xs transition-colors"
                style={{
                  background: 'transparent',
                  color:
                    categoryFilter === cat ? 'var(--text)' : 'var(--muted)',
                  border: `1px solid ${
                    categoryFilter === cat
                      ? 'var(--rule-strong)'
                      : 'var(--border)'
                  }`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* News list */}
          <div className="flex flex-col">
            {filtered.map((item) => (
              <a
                key={item.id}
                href={item.link ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card-item flex items-start gap-3 border-b border-[var(--rule)] px-1 py-3 transition-colors"
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
    </motion.section>
  )
}
