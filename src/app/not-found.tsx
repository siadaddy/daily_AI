import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: true },
}

/**
 * 404. 이전에는 `text-muted-foreground`(이 프로젝트에 없는 shadcn 토큰)를 써서
 * 본문 색이 아예 적용되지 않았다 — 프로젝트 토큰으로 교체했다.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-5 px-4 py-20">
      <p className="kicker kicker-accent border-b border-[var(--rule)] pb-4">
        Error 404
      </p>
      <h1 className="ed-headline text-[length:var(--fs-display)]">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="ed-lede max-w-[52ch]">
        주소가 바뀌었거나, 해당 날짜의 지면이 발행되지 않았을 수 있습니다.
      </p>
      <Link
        href="/"
        className="source-btn mt-2 w-fit border-b-[var(--rule-strong)]"
      >
        오늘의 지면으로 돌아가기 →
      </Link>
    </main>
  )
}
