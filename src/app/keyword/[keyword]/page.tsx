import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Tag, ExternalLink } from 'lucide-react'
import { SiteShell } from '@/components/layout/SiteShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  getTopKeywords,
  getNewsByKeyword,
  isSafeKeyword,
  type KeywordNewsItem,
} from '@/lib/keywords/archive'
import { keywordHref, newsHref } from '@/lib/dates'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

/** 상위 키워드만 페이지로 노출 — 빈약한 자동 생성 페이지가 색인되는 것을 막는다 */
async function resolveKeyword(raw: string): Promise<string | null> {
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  if (!isSafeKeyword(decoded)) return null

  const top = await getTopKeywords()
  const match = top.find((k) => k.word.toLowerCase() === decoded.toLowerCase())
  return match?.word ?? null
}

export async function generateStaticParams() {
  const keywords = await getTopKeywords()
  return keywords.map((k) => ({ keyword: encodeURIComponent(k.word) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ keyword: string }>
}): Promise<Metadata> {
  const { keyword: raw } = await params
  const keyword = await resolveKeyword(raw)
  if (!keyword) return {}

  const news = await getNewsByKeyword(keyword)
  const title = `'${keyword}' 관련 AI 뉴스 아카이브`
  const description =
    news.length > 0
      ? `${keyword} 키워드로 수집된 뉴스 ${news.length}건 (${news[news.length - 1].date} ~ ${news[0].date}). AI가 매일 수집·분석한 아카이브.`
      : `${keyword} 키워드 뉴스 아카이브`

  return {
    title,
    description,
    alternates: { canonical: keywordHref(keyword) },
    openGraph: { title, description, url: keywordHref(keyword) },
    twitter: { title, description },
  }
}

/** YYYY-MM 단위로 그룹핑 (입력이 최신순이라 순서가 유지된다) */
function groupByMonth(items: KeywordNewsItem[]) {
  const groups: { month: string; items: KeywordNewsItem[] }[] = []
  for (const item of items) {
    const month = (item.date ?? '').slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.items.push(item)
    else groups.push({ month, items: [item] })
  }
  return groups
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ keyword: string }>
}) {
  const { keyword: raw } = await params
  const keyword = await resolveKeyword(raw)
  if (!keyword) notFound()

  const news = await getNewsByKeyword(keyword)
  const groups = groupByMonth(news)
  const base = getSiteUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: base },
          {
            '@type': 'ListItem',
            position: 2,
            name: '키워드 아카이브',
            item: `${base}/keyword`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: keyword,
            item: `${base}${keywordHref(keyword)}`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: `'${keyword}' 관련 뉴스`,
        numberOfItems: news.length,
        itemListElement: news.slice(0, 50).map((n, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: n.title,
          url: `${base}${newsHref(n.date)}`,
        })),
      },
    ],
  }

  return (
    <SiteShell activeTab={null}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col gap-8">
        <PageHeader
          icon={Tag}
          kicker="Keyword"
          title={keyword}
          meta={news.length > 0 ? `${news.length}건` : undefined}
          description={
            news.length > 0
              ? `${news[news.length - 1].date} — ${news[0].date} 사이에 수집된 관련 뉴스입니다.`
              : '수집된 뉴스가 없습니다.'
          }
        />

        {groups.map((group) => (
          <section key={group.month} className="flex flex-col gap-3">
            <h2 className="kicker border-b border-[var(--rule)] pb-2">
              {group.month.replace('-', '년 ')}월
            </h2>
            <ul className="flex flex-col">
              {group.items.map((item, i) => (
                <li
                  key={`${item.date}-${i}`}
                  className="news-card-item flex flex-col gap-2 border-b border-[var(--rule)] px-1 py-3 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={newsHref(item.date)}
                      className="font-[family-name:var(--font-mono)] tabular-nums"
                      style={{ color: 'var(--brand-light)' }}
                    >
                      {item.date}
                    </Link>
                    {item.category && (
                      <span style={{ color: 'var(--muted)' }}>
                        {item.category}
                      </span>
                    )}
                    {item.source && (
                      <span style={{ color: 'var(--muted)' }}>
                        · {item.source}
                      </span>
                    )}
                  </div>
                  <h3 className="ed-display text-[0.9375rem] leading-snug">
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1 hover:underline"
                      >
                        {item.title}
                        <ExternalLink
                          size={12}
                          aria-hidden="true"
                          className="mt-1 shrink-0"
                          style={{ color: 'var(--muted)' }}
                        />
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  {item.summary && (
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--muted2)' }}
                    >
                      {item.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SiteShell>
  )
}
