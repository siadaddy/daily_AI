'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Newspaper, Sparkles, ArrowUpRight } from 'lucide-react'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

export function FeaturedCard({ card }: { card: ContentCard }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="glass-card grid min-h-64 grid-cols-1 overflow-hidden sm:min-h-80 md:min-h-[400px] md:grid-cols-2"
      style={{
        border: '1px solid rgba(28,105,212,.25)',
        boxShadow: 'var(--shadow-glow-brand)',
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
    >
      {/* 좌: 이미지 영역 */}
      <div className="relative min-h-56 overflow-hidden md:min-h-full">
        {card.image_url ? (
          <Image
            src={card.image_url}
            alt={card.headline}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-2"
            style={{
              background:
                'linear-gradient(135deg, var(--surface) 0%, var(--card2) 100%)',
            }}
          >
            <Newspaper
              size={56}
              strokeWidth={1.5}
              style={{ color: 'var(--muted2)' }}
            />
          </div>
        )}
        {/* 이미지 위 뱃지 */}
        <div className="absolute top-4 left-4 z-10">
          <span className="badge badge-blue inline-flex items-center gap-1 text-[0.65rem] font-black tracking-widest">
            <Sparkles size={11} strokeWidth={2.5} />
            AUTO · CARD 01
          </span>
        </div>
        {/* 하단 그라디언트 (모바일에서 텍스트 가독성) */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
      </div>

      {/* 우: 텍스트 영역 */}
      <div className="flex flex-col justify-start p-6 md:p-10">
        {/* 라벨 */}
        <p
          className="mb-3 text-[0.67rem] font-black tracking-[0.14em] uppercase"
          style={{ color: 'var(--brand-light)' }}
        >
          FEATURED · 오늘의 카드뉴스
        </p>

        {/* 제목 */}
        <h2
          className="mb-5 text-xl leading-snug font-bold tracking-tight md:text-2xl"
          style={{ color: 'var(--text)' }}
        >
          {card.headline}
        </h2>

        {/* 본문 */}
        <div
          className="card-caption"
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
