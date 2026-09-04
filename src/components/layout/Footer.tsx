import Link from 'next/link'
import { Bot } from 'lucide-react'

const LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: '/about', label: '서비스 소개' },
  { href: '/keyword', label: '키워드 아카이브' },
  { href: '/agents', label: 'AI 에이전트' },
  { href: '/about/ai-usage', label: 'AI 활용 고지' },
  { href: '/feed.xml', label: 'RSS', external: true },
]

/**
 * 지면 하단 판권란. 가운데 정렬 대신 좌측 정렬 + 굵은 괘선으로
 * 본문과 같은 편집 격자 위에 앉힌다.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--rule)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
          aria-label="사이트 링크"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="kicker transition-colors hover:text-[var(--text)]"
              {...(link.external
                ? { prefetch: false, target: '_blank', rel: 'noopener' }
                : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1.5 border-t border-[var(--rule)] pt-5">
          <p
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--muted2)' }}
          >
            <Bot size={13} strokeWidth={2} aria-hidden="true" />
            시아아빠의 AI 데일리 · Claude Code와 함께 제작 · AI Agent로 콘텐츠
            자동 생성
          </p>
          <p className="kicker">Next.js · Supabase · GitHub&nbsp;Actions</p>
        </div>
      </div>
    </footer>
  )
}
