import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'
import { fetchAllContentDates } from '@/lib/content-dates'
import { fetchAllReportKeys } from '@/lib/reports/query'
import { getTopKeywords } from '@/lib/keywords/archive'
import { fetchAgentMemories } from '@/lib/agents/memory'
import { getToday, keywordHref } from '@/lib/dates'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const today = getToday()

  const [dates, reportKeys, keywords, agents] = await Promise.all([
    fetchAllContentDates(),
    fetchAllReportKeys(),
    getTopKeywords(),
    fetchAgentMemories(),
  ])

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
    {
      url: `${base}/about/ai-usage`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    { url: `${base}/keyword`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/agents`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // 과거 뉴스레터 — 오늘은 `/`가 정식 경로이므로 제외
  const newsEntries: MetadataRoute.Sitemap = dates
    .filter((date) => date !== today)
    .map((date) => ({
      url: `${base}/news/${date}`,
      lastModified: new Date(`${date}T06:00:00+09:00`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  const reportEntries: MetadataRoute.Sitemap = reportKeys
    .filter((k) => k.period_type === 'weekly' || k.period_type === 'monthly')
    .map((k) => ({
      url: `${base}/reports/${k.period_type}/${k.week_start}`,
      lastModified: new Date(`${k.week_start}T00:00:00+09:00`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  const keywordEntries: MetadataRoute.Sitemap = keywords.map((k) => ({
    url: `${base}${keywordHref(k.word)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  const agentEntries: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${base}/agents/${encodeURIComponent(a.agent_name)}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  return [
    ...staticEntries,
    ...newsEntries,
    ...reportEntries,
    ...keywordEntries,
    ...agentEntries,
  ]
}
