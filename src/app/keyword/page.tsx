import Link from 'next/link'
import type { Metadata } from 'next'
import { Tags } from 'lucide-react'
import { SiteShell } from '@/components/layout/SiteShell'
import { getTopKeywords } from '@/lib/keywords/archive'
import { keywordHref } from '@/lib/dates'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '키워드 아카이브',
  description:
    'AI가 매일 수집한 뉴스에서 추출한 주요 키워드. 키워드별로 전 기간 뉴스를 모아봅니다.',
  alternates: { canonical: '/keyword' },
}

export default async function KeywordIndexPage() {
  const keywords = await getTopKeywords()
  const base = getSiteUrl()
  const max = keywords[0]?.count ?? 1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '키워드 아카이브',
    url: `${base}/keyword`,
    hasPart: keywords.slice(0, 100).map((k) => ({
      '@type': 'WebPage',
      name: k.word,
      url: `${base}${keywordHref(k.word)}`,
    })),
  }

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Tags
              size={20}
              strokeWidth={2}
              style={{ color: 'var(--brand-light)' }}
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              키워드 아카이브
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            AI가 수집한 전체 뉴스에서 추출한 주요 키워드 {keywords.length}개
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => {
            // 빈도에 따라 글자 크기를 0.8~1.25rem 사이로 스케일
            const scale = 0.8 + (k.count / max) * 0.45
            return (
              <Link
                key={k.word}
                href={keywordHref(k.word)}
                className="rounded-full px-3 py-1.5 transition-colors"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: `${scale}rem`,
                }}
              >
                {k.word}
                <span
                  className="ml-1.5 text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  {k.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </SiteShell>
  )
}
