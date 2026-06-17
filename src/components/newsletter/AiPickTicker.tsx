import type { NewsCard } from '@/lib/types'

// 카테고리별 이모지 색상 매핑
const CATEGORY_COLORS: Record<string, string> = {
  '🔥 오늘의 하이라이트': '#ef4444',
  '🤖 AI / 인공지능':     '#a78bfa',
  '💻 기술 / IT':         '#3b82f6',
  '💰 경제 / 금융':       '#f59e0b',
  '🚗 자동차':            '#10b981',
  '🚘 BMW':              '#1c69d4',
  '🏢 삼천리 그룹':       '#06b6d4',
  '🏙️ 사회':             '#8b5cf6',
  '🚨 사건 / 사고':       '#f97316',
}

function defaultColor() { return 'var(--muted2)' }

function TickerItem({ item }: { item: NewsCard }) {
  const color = CATEGORY_COLORS[item.category] ?? defaultColor()

  return (
    <div className="ai-pick-chip">
      <span className="ai-pick-cat" style={{ color, borderColor: `${color}44`, background: `${color}18` }}>
        {item.category}
      </span>
      <span className="ai-pick-title">{item.title}</span>
      {item.source && (
        <span className="ai-pick-source">— {item.source}</span>
      )}
    </div>
  )
}

function TickerRow({ items }: { items: NewsCard[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-0">
          <TickerItem item={item} />
          <div className="ai-pick-sep">·</div>
        </div>
      ))}
    </>
  )
}

export function AiPickTicker({ news }: { news: NewsCard[] }) {
  if (!news || news.length === 0) return null

  return (
    <div className="ai-pick-bar">
      {/* 고정 라벨 */}
      <div className="ai-pick-label">
        <span className="ai-pick-label-dot" />
        AI 픽
      </div>

      {/* 마퀴 트랙 */}
      <div className="ai-pick-scroll">
        <div className="dash-track ai-pick-track">
          <TickerRow items={news} />
        </div>
        <div className="dash-track ai-pick-track" aria-hidden="true">
          <TickerRow items={news} />
        </div>
      </div>
    </div>
  )
}
