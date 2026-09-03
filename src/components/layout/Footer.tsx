import Link from 'next/link'
import { Bot } from 'lucide-react'

const LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: '/about', label: '서비스 소개' },
  { href: '/keyword', label: '키워드 아카이브' },
  { href: '/agents', label: 'AI 에이전트' },
  { href: '/about/ai-usage', label: 'AI 활용 고지' },
  { href: '/feed.xml', label: 'RSS', external: true },
]

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
      <nav
        className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
        aria-label="사이트 링크"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:underline"
            style={{ color: 'var(--brand-light)' }}
            {...(link.external
              ? { prefetch: false, target: '_blank', rel: 'noopener' }
              : {})}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
