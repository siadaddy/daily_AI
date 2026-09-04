import type { TabId } from '@/lib/types'

/**
 * 각 탭의 진입 경로. **반드시 절대 경로여야 한다.**
 *
 * 예전엔 `router.push('?tab=...')`처럼 경로 없는 상대 쿼리로 이동했는데,
 * 그러면 현재 pathname이 유지된다. 그래서 독립 라우트에 있을 때
 * `/news/2026-09-01?tab=reports`가 되어 버렸고, 그 라우트는 `?tab=`을
 * 읽지 않으므로 탭을 눌러도 아무 일도 일어나지 않았다.
 */
export function tabHref(id: TabId): string {
  return id === 'newsletter' ? '/' : `/?tab=${id}`
}

/**
 * 활성 탭 판정 — 탭 SPA(`/`)는 `?tab=`이, 독립 라우트는 경로가 결정한다.
 * 어느 탭에도 속하지 않는 경로(`/keyword`, `/agents`, `/about`)는 null이라
 * 아무 탭도 강조하지 않는다.
 */
export function resolveTab(
  pathname: string,
  tabParam: string | null
): TabId | null {
  if (pathname === '/') return (tabParam as TabId) ?? 'newsletter'
  if (pathname.startsWith('/news/')) return 'newsletter'
  if (pathname.startsWith('/reports/')) return 'reports'
  return null
}
