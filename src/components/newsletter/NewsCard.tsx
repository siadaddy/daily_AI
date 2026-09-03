'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Newspaper, ArrowUpRight } from 'lucide-react'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

export function NewsCard({ card, idx }: { card: ContentCard; idx: number }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="news-card-item glass-card group flex flex-col overflow-hidden"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
    >
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
            className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, var(--surface) 0%, var(--card2) 100%)',
            }}
          >
            <FileText
              size={44}
              strokeWidth={1.5}
              style={{ color: 'var(--muted2)' }}
            />
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
            <Newspaper size={12} strokeWidth={2.5} />
            {card.source_name || '원문 보기'}
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </motion.div>
  )
}
