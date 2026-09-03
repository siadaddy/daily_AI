/**
 * 순수 날짜/URL 헬퍼 — 서버·클라이언트 양쪽에서 import 가능.
 * Supabase 조회가 필요한 캐시 fetcher는 `@/lib/content-dates`에 있다.
 */

/** KST 기준 오늘 (YYYY-MM-DD) */
export function getToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date()
  )
}

/** YYYY-MM-DD 형식이면서 실제 존재하는 날짜인지 검사 */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/**
 * 뉴스레터 정규 경로. 오늘은 `/`, 과거는 `/news/[date]`.
 * canonical·사이트맵·내부 링크가 모두 이 규칙을 따른다.
 */
export function newsHref(date: string): string {
  return date === getToday() ? '/' : `/news/${date}`
}

/** 리포트 퍼머링크 */
export function reportHref(periodType: string, weekStart: string): string {
  return `/reports/${periodType}/${weekStart}`
}

/** 키워드 아카이브 경로 */
export function keywordHref(keyword: string): string {
  return `/keyword/${encodeURIComponent(keyword)}`
}
