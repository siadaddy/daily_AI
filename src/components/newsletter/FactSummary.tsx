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
      className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4"
      aria-label="이 날짜 콘텐츠 요약"
    >
      {stats.map(({ icon: Icon, label, value }, i) => (
        <div
          key={label}
          className={`flex min-w-0 items-start gap-2 ${
            i > 0 ? 'md:border-l md:border-[var(--rule)] md:pl-6' : ''
          }`}
        >
          <Icon
            size={13}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-1 shrink-0"
            style={{ color: 'var(--muted)' }}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="kicker">{label}</span>
            <span
              className="truncate font-[family-name:var(--font-mono)] text-sm tabular-nums"
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
