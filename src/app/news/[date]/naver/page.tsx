import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/layout/SiteShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { CopyForNaver } from '@/components/naver/CopyForNaver'
import {
  fetchCardNews,
  fetchTodayArticle,
  fetchTodayTrend,
} from '@/components/newsletter/NewsletterTab'
import { composeNaverPost } from '@/lib/naver/compose'
import { isValidDate, newsHref } from '@/lib/dates'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 300

/**
 * 네이버 블로그 옮겨쓰기 화면.
 *
 * 발행 자체는 자동화하지 않는다 — 네이버 글쓰기 API는 2020년에 종료됐고,
 * 브라우저 자동화는 약관에 걸릴 뿐 아니라 "자동 대량 발행" 패턴 자체가
 * 저품질 판정 신호가 된다. 그래서 붙여넣기 직전까지만 자동화한다.
 *
 * 검색에 노출될 필요가 없는 작업용 화면이라 noindex로 둔다.
 */
export const metadata: Metadata = {
  title: '네이버 블로그용 옮겨쓰기',
  robots: { index: false, follow: false },
}

export default async function NaverExportPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  if (!isValidDate(date)) notFound()

  const [cards, article, trend] = await Promise.all([
    fetchCardNews(date),
    fetchTodayArticle(date),
    fetchTodayTrend(date),
  ])

  if (cards.length === 0 && !article) notFound()

  const post = composeNaverPost({
    date,
    cards,
    article,
    trend,
    siteUrl: getSiteUrl(),
  })

  return (
    <SiteShell activeTab={null}>
      <div className="flex flex-col gap-8">
        <Link
          href={newsHref(date)}
          className="kicker flex w-fit items-center gap-1.5"
        >
          <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" />
          {date} 지면으로
        </Link>

        <PageHeader
          kicker="Naver Export"
          title="네이버 블로그용 옮겨쓰기"
          meta={`카드 ${cards.length}`}
          description="아래 본문을 복사해 네이버 블로그 스마트에디터에 붙여넣으세요. 순서와 위계·이미지·출처 링크는 그대로 넘어가지만, 사이트의 서체·괘선·색은 에디터가 걷어냅니다."
        />

        {/* 제안 제목 */}
        <section className="flex flex-col gap-2">
          <h2 className="kicker border-b border-[var(--rule)] pb-2">
            제목 제안
          </h2>
          <p className="ed-display text-[1.125rem]">{post.title}</p>
        </section>

        <CopyForNaver
          html={post.html}
          text={post.text}
          title={post.title}
          previewId="naver-preview"
        />

        <ol className="flex list-none flex-col gap-2 border-t border-[var(--rule)] p-0 pt-4">
          {[
            '위 “본문 복사”를 누른다',
            '네이버 블로그 → 글쓰기(스마트에디터 ONE)를 연다',
            '제목을 붙여넣고, 본문 영역에 ⌘V / Ctrl+V',
            '이미지가 안 넘어왔다면 아래 미리보기에서 이미지만 따로 끌어다 놓는다',
            '발행 전 한 번 훑어본다 — 자동 생성물이라 사실관계는 사람이 확인하는 게 맞다',
          ].map((step, i) => (
            <li key={i} className="flex items-baseline gap-3 text-sm">
              <span
                className="shrink-0 font-[family-name:var(--font-mono)] text-xs tabular-nums"
                style={{ color: 'var(--rule-strong)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ color: 'var(--muted2)' }}>{step}</span>
            </li>
          ))}
        </ol>

        {/* 미리보기 — 복사 폴백에서 이 노드를 그대로 선택한다 */}
        <section className="flex flex-col gap-4">
          <h2 className="ed-section-head ed-section-title">붙여넣을 내용</h2>
          <div
            id="naver-preview"
            className="article-body"
            style={{ maxWidth: '100%' }}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </section>
      </div>
    </SiteShell>
  )
}
