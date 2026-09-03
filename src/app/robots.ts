import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

/**
 * AI 어시스턴트/검색 크롤러를 명시적으로 허용한다.
 * 기본 `*` 규칙으로도 접근은 가능하지만, 명시 규칙이 있으면
 * 크롤러가 자기 이름으로 매칭된 규칙을 우선 적용해 의도가 분명해진다.
 */
const AI_CRAWLERS = [
  'GPTBot', // OpenAI 검색/학습
  'OAI-SearchBot', // ChatGPT 검색
  'ChatGPT-User', // ChatGPT 사용자 요청 브라우징
  'ClaudeBot', // Anthropic
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended', // Gemini / AI Overviews
  'Applebot-Extended',
  'CCBot', // Common Crawl
  'Bingbot',
  'Yeti', // 네이버
  'Daumoa', // 다음
]

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: '/api/',
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
