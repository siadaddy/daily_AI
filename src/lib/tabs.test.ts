import { describe, it, expect } from 'vitest'
import { tabHref, resolveTab } from './tabs'

describe('tabHref', () => {
  it('항상 절대 경로를 만든다', () => {
    // 회귀 방지: 상대 쿼리('?tab=reports')를 반환하면 독립 라우트에서
    // 현재 경로가 유지돼 탭을 눌러도 아무 일도 일어나지 않는다.
    for (const id of ['newsletter', 'reports', 'music', 'portfolio'] as const) {
      expect(tabHref(id).startsWith('/')).toBe(true)
    }
  })

  it('뉴스레터는 루트를 가리킨다', () => {
    expect(tabHref('newsletter')).toBe('/')
  })

  it('나머지 탭은 루트에 ?tab=을 붙인다', () => {
    expect(tabHref('reports')).toBe('/?tab=reports')
    expect(tabHref('music')).toBe('/?tab=music')
    expect(tabHref('portfolio')).toBe('/?tab=portfolio')
  })
})

describe('resolveTab', () => {
  it('루트에서는 ?tab=이 결정하고, 없으면 뉴스레터다', () => {
    expect(resolveTab('/', 'reports')).toBe('reports')
    expect(resolveTab('/', 'music')).toBe('music')
    expect(resolveTab('/', null)).toBe('newsletter')
  })

  it('독립 라우트에서는 경로가 결정한다', () => {
    expect(resolveTab('/news/2026-09-01', null)).toBe('newsletter')
    expect(resolveTab('/reports/weekly/2026-08-24', null)).toBe('reports')
  })

  it('어느 탭에도 속하지 않는 경로는 null이다', () => {
    expect(resolveTab('/keyword/AI', null)).toBeNull()
    expect(resolveTab('/keyword', null)).toBeNull()
    expect(resolveTab('/agents/박기획', null)).toBeNull()
    expect(resolveTab('/about', null)).toBeNull()
  })

  it('탭 이동 후 활성 탭이 실제로 바뀐다 (버그 재현 방지)', () => {
    // 과거 날짜 페이지에서 리포트 탭을 누르면 tabHref가 주는 경로로 가고,
    // 그 경로에서 resolveTab이 'reports'를 돌려줘야 한다.
    const href = tabHref('reports') // '/?tab=reports'
    const [pathname, query] = href.split('?')
    const tabParam = new URLSearchParams(query).get('tab')
    expect(resolveTab('/news/2026-09-01', null)).toBe('newsletter')
    expect(resolveTab(pathname, tabParam)).toBe('reports')
  })
})
