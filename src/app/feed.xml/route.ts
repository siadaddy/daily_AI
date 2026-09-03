import { createPublicClient } from '@/lib/supabase/public'
import { getSiteUrl } from '@/lib/site-url'
import { plainTextExcerpt } from '@/lib/utils/caption'

export const revalidate = 3600

const SITE_TITLE = '시아아빠의 AI 데일리'
const SITE_DESCRIPTION =
  'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스'
const ITEM_LIMIT = 30

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** YYYY-MM-DD(KST 06:00 발행) → RFC 822 */
function pubDate(date: string): string {
  return new Date(`${date}T06:00:00+09:00`).toUTCString()
}

export async function GET() {
  const base = getSiteUrl()

  let articles: { date: string; title: string; content: string }[] = []
  try {
    const { data, error } = await createPublicClient()
      .from('articles')
      .select('date, title, content')
      .order('date', { ascending: false })
      .limit(ITEM_LIMIT)
    if (error) throw new Error(error.message)
    articles = data ?? []
  } catch (e) {
    // 조회에 실패해도 빈 피드를 반환한다 — 리더가 500을 받는 것보다 낫다
    console.error('[feed.xml] articles 조회 실패:', e)
  }

  const items = articles
    .map((a) => {
      // 오늘 자도 `/`가 아닌 날짜 퍼머링크를 쓴다.
      // guid는 영구 불변이어야 하는데 `/`는 매일 다른 글을 가리키기 때문.
      const link = `${base}/news/${a.date}`
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate(a.date)}</pubDate>
      <description>${escapeXml(plainTextExcerpt(a.content, 400))}</description>
    </item>`
    })
    .join('\n')

  const lastBuild = articles[0]
    ? pubDate(articles[0].date)
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
