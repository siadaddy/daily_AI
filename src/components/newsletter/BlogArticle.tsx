'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'
import { mdToHtml, readingMinutes } from '@/lib/utils/caption'

/**
 * 편집장 리뷰 — 지면의 오피니언 면.
 * 손으로 그린 SVG 아이콘을 lucide로 교체하고, 확대 호버를 걷어냈다.
 * 본문은 68ch로 묶어 한글 장문의 행 길이를 읽기 좋게 유지한다.
 */
export function BlogArticle({
  title,
  content,
  date,
}: {
  title?: string | null
  content?: string | null
  date?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (!content) return null

  const mins = readingMinutes(content)
  const displayDate = date
    ? new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : null

  return (
    <motion.section
      className="blog-article"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="blog-header">
        <p className="blog-label">Opinion · AI 편집장</p>

        {title && <h3 className="blog-title">{title}</h3>}

        <div className="blog-meta">
          {displayDate && (
            <span className="blog-meta-item">
              <CalendarDays size={12} strokeWidth={2} aria-hidden="true" />
              <time dateTime={date}>{displayDate}</time>
            </span>
          )}
          <span className="blog-meta-dot" aria-hidden="true">
            ·
          </span>
          <span className="blog-meta-item">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />약 {mins}분
            읽기
          </span>
        </div>
      </div>

      <div
        className="article-body blog-body"
        dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
      />
    </motion.section>
  )
}
