'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircleQuestion, Briefcase } from 'lucide-react'

export interface TalkingPoint {
  topic: string
  context: string
  question: string
  business_impact: string
}

export function TalkingPointsSection({ points }: { points: TalkingPoint[] }) {
  const prefersReducedMotion = useReducedMotion()

  if (!points || points.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {points.map((point, i) => (
        <motion.article
          key={`${point.topic}-${i}`}
          className="glass-card flex flex-col gap-3 p-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: 0.35,
            delay: prefersReducedMotion ? 0 : i * 0.08,
          }}
        >
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--brand-light)' }}
          >
            {point.topic}
          </h3>

          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--muted2)' }}
          >
            {point.context}
          </p>

          <div className="flex items-start gap-2">
            <MessageCircleQuestion
              size={14}
              strokeWidth={2}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--accent-purple)' }}
            />
            <p
              className="text-xs leading-relaxed font-medium"
              style={{ color: 'var(--text)' }}
            >
              {point.question}
            </p>
          </div>

          <div
            className="mt-auto flex items-start gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--glass)' }}
          >
            <Briefcase
              size={13}
              strokeWidth={2}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--gold)' }}
            />
            <p
              className="text-xs leading-relaxed"
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
