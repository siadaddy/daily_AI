/**
 * 뉴스 표시/집계 단계에서 걸러낼 대상 정의.
 *
 * 수집 단계 차단은 pipeline/collect.py의 EXCLUDE_KEYWORDS가 담당하지만,
 * 그 이전에 Supabase에 이미 쌓인 과거 데이터는 남아 있으므로
 * 화면·통계·리포트에 노출되지 않도록 읽기 시점에 한 번 더 거른다.
 */

export const EXCLUDED_KEYWORDS = ['삼천리']
export const EXCLUDED_CATEGORIES = ['🏢 삼천리 그룹']

export function isExcludedNews(item: {
  title?: string | null
  summary?: string | null
  category?: string | null
}): boolean {
  const category = item.category?.trim() ?? ''
  if (EXCLUDED_CATEGORIES.some((c) => category === c)) return true

  const text = `${item.title ?? ''} ${item.summary ?? ''}`
  return EXCLUDED_KEYWORDS.some((kw) => text.includes(kw))
}
