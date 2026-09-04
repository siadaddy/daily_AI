'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircleQuestion, Briefcase } from 'lucide-react'

export interface TalkingPoint {
  topic: string
  context: string
  question: string
  business_impact: string
}

/**
 * 대화 소재 3단. 지면의 하단 칼럼처럼 세로 괘선으로 나눈다.
 * 질문은 세리프로 올려 눈에 먼저 걸리게 하고,
 * 비즈니스 함의는 배경 박스 대신 들여쓴 각주로 처리한다.
 */
export function TalkingPointsSection({ points }: { points: TalkingPoint[] }) {
  const prefersReducedMotion = useReducedMotion()

  if (!points || points.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
      {points.map((point, i) => (
        <motion.article
          key={`${point.topic}-${i}`}
          className="flex min-w-0 flex-col gap-3 border-t border-[var(--rule)] pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-5 md:first:border-l-0 md:first:pl-0"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: 0.35,
            delay: prefersReducedMotion ? 0 : i * 0.07,
          }}
        >
          <h3 className="kicker kicker-brand">{point.topic}</h3>

          <p
            className="text-[0.8125rem] leading-relaxed"
            style={{ color: 'var(--muted2)' }}
          >
            {point.context}
          </p>

          <div className="flex items-start gap-2">
            <MessageCircleQuestion
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-1 shrink-0"
              style={{ color: 'var(--accent)' }}
            />
            <p className="ed-display min-w-0 text-[0.9375rem] leading-snug">
              {point.question}
            </p>
          </div>

          <div className="mt-auto flex items-start gap-2 border-t border-[var(--rule)] pt-3">
            <Briefcase
              size={12}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-1 shrink-0"
              style={{ color: 'var(--muted)' }}
            />
            <p
              className="min-w-0 text-xs leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              {point.business_impact}
            </p>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
