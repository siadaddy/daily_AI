import { createPublicClient } from '@/lib/supabase/public'
import { getSiteUrl } from '@/lib/site-url'
import { fetchAllReportKeys } from '@/lib/reports/query'
import { getTopKeywords } from '@/lib/keywords/archive'

export const revalidate = 3600

const RECENT_LIMIT = 30

/**
 * llms.txt — AI 크롤러/어시스턴트가 사이트 구조와 최신 콘텐츠를
 * 한 번에 파악할 수 있도록 하는 규약 파일.
 */
export async function GET() {
  const base = getSiteUrl()
  const supabase = createPublicClient()

  const [articlesResult, reportKeys, keywords] = await Promise.all([
    supabase
      .from('articles')
      .select('date, title')
      .order('date', { ascending: false })
      .limit(RECENT_LIMIT),
    fetchAllReportKeys(),
    getTopKeywords(60),
  ])

  const articles = (articlesResult.data ?? []) as {
    date: string
    title: string
  }[]

  const recentNews = articles
    .map((a) => `- [${a.date} — ${a.title}](${base}/news/${a.date})`)
    .join('\n')

  const reports = reportKeys
    .filter((k) => k.period_type === 'weekly' || k.period_type === 'monthly')
    .slice(0, 20)
    .map(
      (k) =>
        `- [${k.period_type === 'weekly' ? '주간' : '월간'} 리포트 ${k.week_start}](${base}/reports/${k.period_type}/${k.week_start})`
    )
    .join('\n')

  const keywordLinks = keywords
    .map(
      (k) =>
        `- [${k.word} (${k.count}건)](${base}/keyword/${encodeURIComponent(k.word)})`
    )
    .join('\n')

  const body = `# 시아아빠의 AI 데일리

> 한국 AI·기술 뉴스를 매일 자동으로 수집·요약·분석하는 대시보드입니다. 매일 06:00 KST에 AI 파이프라인이 네이버 뉴스 API로 기사를 수집하고, 카드뉴스 5건과 편집장 리뷰 아티클 1건, TOP3 트렌드 분석을 생성합니다. 주간·월간 리포트는 별도 일정으로 생성됩니다.

## 사이트 정보

- 언어: 한국어 (ko-KR)
- 갱신 주기: 매일 06:00 KST (뉴스레터), 매주 월요일 (주간 리포트), 매월 1일 (월간 리포트)
- 콘텐츠 생성: AI 자동 생성 (수집은 네이버 뉴스 API, 생성은 Gemini / Groq / OpenAI)
- RSS 피드: ${base}/feed.xml
- 사이트맵: ${base}/sitemap.xml

## 주요 경로

- [오늘의 뉴스레터](${base}/) — 카드뉴스, AI Pick TOP3, 편집장 리뷰, 수집 뉴스 원문
- [날짜별 아카이브](${base}/news/YYYY-MM-DD) — 특정 날짜의 뉴스레터
- [키워드 아카이브](${base}/keyword) — 키워드별 전 기간 뉴스 모음
- [AI 에이전트 성장 기록](${base}/agents) — 각 에이전트의 페르소나와 자기 작성 일기
- [주간·월간 리포트](${base}/?tab=reports) — 기간별 트렌드 분석과 비교 대시보드
- [소개](${base}/about) — 이 사이트를 만든 AI 에이전트 소개
- [AI 활용 고지](${base}/about/ai-usage) — 어떤 AI가 무엇을 생성하는지

## 최근 뉴스레터

${recentNews}

## 리포트

${reports}

## 주요 키워드

${keywordLinks}

## 인용 시 참고

각 뉴스 항목에는 원문 출처와 링크가 함께 표기됩니다. 요약·분석 문장은 AI가 생성한 것이므로, 사실 확인이 필요한 경우 각 항목에 연결된 원문 기사를 확인하시기 바랍니다.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
