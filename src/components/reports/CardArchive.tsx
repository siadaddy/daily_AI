import Image from 'next/image'
import type { NewsCard } from '@/lib/types'

export function CardArchive({ cards }: { cards: NewsCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        아카이브가 없습니다.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {cards.map((card) => (
        <a
          key={card.id}
          href={card.link ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card group overflow-hidden"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-t-[var(--r-md)]">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center text-2xl"
                style={{ background: 'var(--surface)' }}
              >
                📰
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="line-clamp-2 text-xs font-medium leading-snug" style={{ color: 'var(--text)' }}>
              {card.title}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              {card.date}
            </p>
          </div>
        </a>
      ))}
    </div>
  )
}
