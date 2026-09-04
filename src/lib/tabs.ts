import type { TabId } from '@/lib/types'

const TAB_IDS: readonly TabId[] = [
  'newsletter',
  'reports',
  'music',
  'office',
  'portfolio',
]

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
 * `?tab=` 파라미터를 TabId로 정규화한다. 알 수 없는 값은 뉴스레터로 떨어진다.
 *
 * 활성 탭 판정은 **서버에서** 이뤄져야 한다 — 클라이언트에서
 * `useSearchParams()`로 읽으면 정적 페이지의 해당 Suspense 경계가
 * 클라이언트 렌더로 빠져 탭 내비게이션이 서버 HTML에서 사라진다.
 */
export function parseTab(value: string | null | undefined): TabId {
  return TAB_IDS.includes(value as TabId) ? (value as TabId) : 'newsletter'
}
