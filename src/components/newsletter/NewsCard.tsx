'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Newspaper, ArrowUpRight } from 'lucide-react'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

/**
 * 후속 기사. 리드와 같은 무게로 보이면 위계가 무너지므로
 * 상자를 없애고 상단 괘선 + 큰 모노 번호로만 구분한다.
 *
 * 사진이 먼저 오고 글이 따라온다 — 모바일은 사진 위·글 아래,
 * 데스크톱은 사진 왼쪽(4칸)·글 오른쪽(8칸). 반칸짜리 2단 그리드에
 * 가로 배치를 욱여넣으면 둘 다 좁아지므로 목록은 한 단으로 세운다.
 *
 * 호버는 확대·발광 대신 괘선이 진해지는 것으로 응답한다.
 */
export function NewsCard({ card, idx }: { card: ContentCard; idx: number }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.article
      className="news-card-item group grid grid-cols-1 gap-x-8 gap-y-4 border-t border-[var(--rule)] pt-5 pb-1 transition-colors md:grid-cols-12"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* 좌: 사진 */}
      <figure className="relative order-1 m-0 aspect-[4/3] w-full overflow-hidden bg-[var(--card2)] md:col-span-4 md:aspect-[4/3]">
        {card.image_url ? (
          <Image
            src={card.image_url}
            alt={card.headline}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 32vw"
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

      {/* 우: 기사 */}
      <div className="order-2 flex min-w-0 flex-col md:col-span-8">
        <div className="flex items-baseline gap-3">
          <span className="ed-index" aria-hidden="true">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <h3 className="ed-display flex-1 text-[1.1875rem] leading-snug">
            {card.headline}
          </h3>
        </div>

        <div
          className="nc-caption mt-3"
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
      </div>
    </motion.article>
  )
}
