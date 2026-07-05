import Image from 'next/image'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

export function NewsCard({ card, idx }: { card: ContentCard; idx: number }) {
  return (
    <div className="news-card-item glass-card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1">
      {/* 상단: 이미지 전체 너비 */}
      <div className="relative aspect-video w-full overflow-hidden">
        {card.image_url ? (
          <Image
            src={card.image_url}
            alt={card.headline}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, var(--surface) 0%, var(--card2) 100%)',
            }}
          >
            📄
          </div>
        )}
      </div>

      {/* 하단: 텍스트 */}
      <div className="flex flex-1 flex-col p-5 pb-6">
        {/* 카드 번호 */}
        <p
          className="mb-2 text-[0.67rem] font-black tracking-[0.12em] uppercase"
          style={{ color: 'var(--muted)' }}
        >
          CARD {String(idx + 1).padStart(2, '0')}
        </p>

        {/* 제목 */}
        <h3
          className="mb-3 text-base leading-snug font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          {card.headline}
        </h3>

        {/* 본문 */}
        <div
          className="nc-caption"
          dangerouslySetInnerHTML={{ __html: highlightCaption(card.caption) }}
        />

        {/* 원문 보기 버튼 */}
        {card.source_url && (
          <a
            href={card.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-btn mt-auto"
          >
            📰 {card.source_name || '원문 보기'} →
          </a>
        )}
      </div>
    </div>
  )
}
