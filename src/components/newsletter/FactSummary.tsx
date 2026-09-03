import { CalendarDays, Layers, Radio, Newspaper } from 'lucide-react'
import type { NewsCard } from '@/lib/types'

/**
 * 사실 기반 요약 블록.
 * AI 어시스턴트가 이 페이지를 인용할 때 필요한 메타데이터(날짜·건수·출처)를
 * 본문 상단에 명시한다. 사람에게도 그날의 규모를 한눈에 보여준다.
 */
export function FactSummary({
  date,
  cardCount,
  rawNews,
}: {
  date: string
  cardCount: number
  rawNews: NewsCard[]
}) {
  const categories = new Set(
    rawNews.map((n) => n.category?.trim()).filter(Boolean)
  )
  const sources = new Set(rawNews.map((n) => n.source?.trim()).filter(Boolean))

  const stats = [
    { icon: CalendarDays, label: '발행일', value: date },
    { icon: Newspaper, label: '카드뉴스', value: `${cardCount}건` },
    { icon: Radio, label: '수집 기사', value: `${rawNews.length}건` },
    {
      icon: Layers,
      label: '카테고리 · 출처',
      value: `${categories.size}개 · ${sources.size}곳`,
    },
  ]

  return (
    <section
      className="grid grid-cols-2 gap-3 rounded-xl px-4 py-3 md:grid-cols-4"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      aria-label="이 날짜 콘텐츠 요약"
    >
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon
            size={15}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: 'var(--muted)' }}
          />
          <div className="flex flex-col">
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {label}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text)' }}
            >
              {value}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
