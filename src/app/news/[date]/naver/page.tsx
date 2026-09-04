import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowLeft, Download } from 'lucide-react'
import { SiteShell } from '@/components/layout/SiteShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { CopyForNaver } from '@/components/naver/CopyForNaver'
import { ShareCards } from '@/components/naver/ShareCards'
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

        <section className="flex flex-col gap-5 border-t border-[var(--rule)] pt-5">
          <div className="flex flex-col gap-2">
            <h2 className="kicker kicker-accent">모바일에서</h2>
            <ol className="flex list-none flex-col gap-2 p-0">
              {[
                '아래 “카드 이미지 N장 공유”를 누른다 — 공유 시트가 열린다',
                '네이버 블로그 앱을 고르거나, 사진에 일괄 저장한다',
                '“제목 복사” → 네이버 글쓰기에 붙여넣기',
                '“본문 복사” → 본문에 붙여넣기 (이미지는 위에서 첨부한 것을 쓴다)',
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
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="kicker">데스크톱에서</h2>
            <ol className="flex list-none flex-col gap-2 p-0">
              {[
                '“본문 복사” → 스마트에디터 본문에 ⌘V / Ctrl+V',
                '카드 이미지는 아래에서 내려받아 첨부하거나 끌어다 놓는다',
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
          </div>

          <p className="kicker">
            발행 전 한 번 훑어보세요 — 자동 생성물이라 사실관계는 사람이
            확인하는 게 맞습니다.
          </p>
        </section>

        {/* 카드 이미지 — 스마트에디터가 CSS를 버리므로, 카드 레이아웃은
            HTML이 아니라 이미지로 넘긴다 (네이버 카드뉴스의 실제 관행) */}
        {cards.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="ed-section-head ed-section-title">카드 이미지</h2>
            <p className="ed-lede text-[0.9375rem]">
              지면의 카드 구조를 그대로 담은 1080×1350 이미지입니다. 에디터가
              CSS를 버리기 때문에 카드 모양은 HTML로 못 넘깁니다 — 이미지로
              올리면 사이트에서 보던 그대로 나옵니다. 캡처할 필요 없습니다.
            </p>
            <ShareCards date={date} count={cards.length} />
            <ol className="grid list-none grid-cols-2 gap-x-6 gap-y-8 p-0 sm:grid-cols-3">
              {cards.map((c, i) => {
                const src = `/api/naver-card/${date}/${i}`
                return (
                  <li key={i} className="flex flex-col gap-2">
                    <Image
                      src={src}
                      alt={`${c.headline} 카드 이미지`}
                      width={1080}
                      height={1350}
                      sizes="(max-width: 640px) 45vw, 30vw"
                      className="h-auto w-full border border-[var(--border)]"
                    />
                    <a
                      href={src}
                      download={`${date}_card_${String(i + 1).padStart(2, '0')}.png`}
                      className="kicker inline-flex items-center gap-1.5 hover:text-[var(--text)]"
                    >
                      <Download size={11} strokeWidth={2} aria-hidden="true" />
                      CARD {String(i + 1).padStart(2, '0')}
                    </a>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* 미리보기 — 복사 폴백에서 이 노드를 그대로 선택한다 */}
        <section className="flex flex-col gap-4">
          <h2 className="ed-section-head ed-section-title">붙여넣을 내용</h2>
          <div
            id="naver-preview"
            className="article-body naver-preview"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </section>
      </div>
    </SiteShell>
  )
}
