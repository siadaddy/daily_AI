/**
 * 뉴스 표시/집계 단계에서 걸러낼 대상 정의.
 *
 * 수집 단계 차단은 pipeline/collect.py의 EXCLUDE_KEYWORDS가 담당하지만,
 * 그 이전에 Supabase에 이미 쌓인 과거 데이터는 남아 있으므로
 * 화면·통계·리포트에 노출되지 않도록 읽기 시점에 한 번 더 거른다.
 */

import type { PeriodReport, Top3Item } from '@/lib/types'

export const EXCLUDED_KEYWORDS = ['삼천리']

/** 문자열에 제외 키워드가 들어 있는가 */
export function containsExcluded(text?: string | null): boolean {
  if (!text) return false
  return EXCLUDED_KEYWORDS.some((kw) => text.includes(kw))
}

export function isExcludedNews(item: {
  title?: string | null
  summary?: string | null
  category?: string | null
}): boolean {
  // 카테고리는 완전 일치가 아니라 부분 일치로 본다 —
  // 저장된 데이터에 '🏢 삼천리 그룹'과 '삼천리 그룹'이 섞여 있다.
  if (containsExcluded(item.category)) return true
  return containsExcluded(`${item.title ?? ''} ${item.summary ?? ''}`)
}

/** 일별 TOP3에서 제외 대상 항목을 뺀다 */
export function filterTop3(items?: Top3Item[] | null): Top3Item[] {
  return (items ?? []).filter(
    (i) => !isExcludedNews({ title: i.title, category: i.category })
  )
}

/**
 * 문장 단위로 쪼개 제외 키워드가 든 문장만 버린다.
 * 저장된 리포트 본문은 다시 생성하지 않으므로(과거 데이터), 읽는 시점에 도려낸다.
 */
export function stripExcludedSentences(text?: string | null): string {
  if (!text) return ''
  // 종결 부호 뒤에서 자르되 부호는 앞 문장에 남긴다
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !containsExcluded(s))
    .join(' ')
    .trim()
}

/**
 * 저장된 기간 리포트에서 제외 대상 흔적을 모두 제거한 사본을 만든다.
 * DB는 건드리지 않는다 — 읽는 시점 필터.
 */
export function sanitizeReport(report: PeriodReport): PeriodReport {
  const sections = report.raw_data?.sections ?? []

  return {
    ...report,
    summary: stripExcludedSentences(report.summary),
    insights: stripExcludedSentences(report.insights),
    categories: (report.categories ?? []).filter(
      (c) => !containsExcluded(c.name)
    ),
    next_focus: (report.next_focus ?? []).filter((f) => !containsExcluded(f)),
    raw_data: report.raw_data
      ? {
          ...report.raw_data,
          sections: sections.filter(
            (s) =>
              !containsExcluded(s.category) &&
              !containsExcluded(s.top_issue) &&
              !containsExcluded(s.insight)
          ),
        }
      : report.raw_data,
  }
}
