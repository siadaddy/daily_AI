'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Newspaper, ArrowUpRight } from 'lucide-react'
import type { ContentCard } from '@/lib/types'
import { highlightCaption } from '@/lib/utils/caption'

/**
 * 리드 기사. 카드가 아니라 지면 최상단 기사로 다룬다.
 * · 7:5 비대칭 그리드 — 균등 2분할은 위계를 만들지 못한다
 * · 제목이 이미지보다 먼저 읽히도록 모바일에서 텍스트를 위로 올린다
 * · 테두리·그림자 대신 위아래 괘선으로만 영역을 잡는다
 */
export function FeaturedCard({ card }: { card: ContentCard }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.article
      className="grid grid-cols-1 gap-x-10 gap-y-6 border-t-2 border-b border-t-[var(--text)] border-b-[var(--rule)] pt-6 pb-8 md:grid-cols-12"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* 좌: 기사 — 지면에서 제목이 먼저다 */}
      <div className="order-2 flex flex-col md:order-1 md:col-span-7">
        <p className="kicker kicker-accent mb-3">
          Lead&nbsp;Story · 오늘의 카드뉴스
        </p>

        <h3 className="ed-display mb-4 text-[clamp(1.5rem,3.4vw,2.25rem)]">
          {card.headline}
        </h3>

        <div
          className="card-caption ed-lede"
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

      {/* 우: 사진 — 캡션 없는 순수 도판 */}
      <figure className="order-1 m-0 md:order-2 md:col-span-5">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--card2)] md:aspect-[3/4]">
          {card.image_url ? (
            <Image
              src={card.image_url}
              alt={card.headline}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 42vw"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Newspaper
                size={40}
                strokeWidth={1.25}
                aria-hidden="true"
                style={{ color: 'var(--muted)' }}
              />
            </div>
          )}
        </div>
      </figure>
    </motion.article>
  )
}
