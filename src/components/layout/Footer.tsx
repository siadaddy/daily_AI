import Link from 'next/link'
import { Bot } from 'lucide-react'

export function Footer() {
  return (
    <footer
      className="mt-auto border-t py-6 text-center text-xs"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      <p className="inline-flex items-center justify-center gap-1.5">
        <Bot size={14} strokeWidth={2} aria-hidden="true" />
        시아아빠의 AI 데일리 · Claude Code와 함께 제작 · AI Agent로 콘텐츠 자동
        생성
      </p>
      <p className="mt-1">
        Powered by{' '}
        <span style={{ color: 'var(--brand-light)' }}>
          Next.js · Supabase · GitHub Actions
        </span>
      </p>
      <p className="mt-2">
        <Link
          href="/about"
          className="transition-colors hover:underline"
          style={{ color: 'var(--brand-light)' }}
        >
          서비스 소개 →
        </Link>
      </p>
    </footer>
  )
}
