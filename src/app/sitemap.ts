import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()

  return [
    {
      url: base,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/about/ai-usage`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
