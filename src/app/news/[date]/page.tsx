import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteShell, LoadingSkeleton } from '@/components/layout/SiteShell'
import {
  NewsletterTab,
  fetchTodayArticle,
} from '@/components/newsletter/NewsletterTab'
import { getToday, isValidDate, newsHref } from '@/lib/dates'
import { fetchAvailableDates, fetchAllContentDates } from '@/lib/content-dates'
import { getSiteUrl } from '@/lib/site-url'
import { plainTextExcerpt } from '@/lib/utils/caption'

export const revalidate = 300

/** 최근 날짜만 프리렌더하고, 나머지는 요청 시 생성 후 캐시 */
export async function generateStaticParams() {
  const dates = await fetchAllContentDates()
  return dates.slice(0, 60).map((date) => ({ date }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>
}): Promise<Metadata> {
  const { date } = await params
  if (!isValidDate(date)) return {}

  const canonical = newsHref(date)
  const article = await fetchTodayArticle(date)

  if (!article) {
    return {
      title: `${date} 뉴스레터`,
      alternates: { canonical },
    }
  }

  const title = article.title
  const description = plainTextExcerpt(article.content, 160)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: `${date}T06:00:00+09:00`,
      url: canonical,
    },
    twitter: { title, description },
  }
}

export default async function NewsDatePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  if (!isValidDate(date)) notFound()

  const today = getToday()
  const availableDates = await fetchAvailableDates()
  const dates = availableDates.includes(today)
    ? availableDates
    : [today, ...availableDates]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: getSiteUrl(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '뉴스레터 아카이브',
        item: `${getSiteUrl()}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${date} 뉴스레터`,
        item: `${getSiteUrl()}/news/${date}`,
      },
    ],
  }

  return (
    <SiteShell activeTab="newsletter" dateNav={{ selectedDate: date, dates }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <NewsletterTab date={date} />
      </Suspense>
    </SiteShell>
  )
}
