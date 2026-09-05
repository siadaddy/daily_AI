'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Newspaper, ArrowUpRight } from 'lucide-react'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

/**
 * 후속 기사. 리드와 같은 무게로 보이면 위계가 무너지므로
 * 상자를 없애고 상단 괘선 + 큰 모노 번호로만 구분한다.
 * 호버는 확대·발광 대신 괘선이 진해지는 것으로 응답한다.
 */
export function NewsCard({ card, idx }: { card: ContentCard; idx: number }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.article
      data-capture={`card-${String(idx + 1).padStart(2, '0')}`}
      className="news-card-item group flex flex-col border-t border-[var(--rule)] pt-4 transition-colors"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="flex items-baseline gap-3">
        <span className="ed-index" aria-hidden="true">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <h3 className="ed-display flex-1 text-[1.1875rem] leading-snug">
          {card.headline}
        </h3>
      </div>

      <figure className="relative mt-4 mb-4 aspect-video w-full overflow-hidden bg-[var(--card2)]">
        {card.image_url ? (
          <Image
            src={card.image_url}
            alt={card.headline}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 45vw"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText
              size={32}
              strokeWidth={1.25}
              aria-hidden="true"
              style={{ color: 'var(--muted)' }}
            />
          </div>
        )}
      </figure>

      <div
        className="nc-caption"
        dangerouslySetInnerHTML={{ __html: highlightCaption(card.caption) }}
      />

      {card.source_url && (
        <a
          href={card.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="source-btn mt-auto"
        >
          <Newspaper size={12} strokeWidth={2} aria-hidden="true" />
          {card.source_name || '원문 보기'}
          <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
        </a>
      )}
    </motion.article>
  )
}
