export type AutoView = 'briefing' | 'competitors' | 'reports'

/** 자동차 인사이트 탭의 URL 을 한 곳에서 만든다 — URL 이 곧 상태(딥링크) */
export function autoHref(opts: {
  view?: AutoView
  date?: string
  topic?: string
  brand?: string
  period?: 'weekly' | 'monthly'
  report?: string
}): string {
  const q = new URLSearchParams({ tab: 'auto' })
  if (opts.view && opts.view !== 'briefing') q.set('view', opts.view)
  if (opts.date) q.set('date', opts.date)
  if (opts.topic) q.set('topic', opts.topic)
  if (opts.brand) q.set('brand', opts.brand)
  if (opts.period && opts.period !== 'weekly') q.set('period', opts.period)
  if (opts.report) q.set('report', opts.report)
  return `/?${q.toString()}`
}
