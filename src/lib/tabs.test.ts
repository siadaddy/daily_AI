import { describe, it, expect } from 'vitest'
import { tabHref, parseTab } from './tabs'

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

describe('parseTab', () => {
  it('알려진 탭은 그대로 통과시킨다', () => {
    expect(parseTab('reports')).toBe('reports')
    expect(parseTab('music')).toBe('music')
    expect(parseTab('portfolio')).toBe('portfolio')
    // 내비게이션에선 빠졌지만 URL로는 접근 가능한 탭
    expect(parseTab('office')).toBe('office')
  })

  it('없거나 알 수 없는 값은 뉴스레터로 떨어진다', () => {
    expect(parseTab(null)).toBe('newsletter')
    expect(parseTab(undefined)).toBe('newsletter')
    expect(parseTab('')).toBe('newsletter')
    expect(parseTab('bogus')).toBe('newsletter')
    expect(parseTab('__proto__')).toBe('newsletter')
  })
})

describe('탭 이동 왕복', () => {
  it('tabHref가 만든 경로를 parseTab이 같은 탭으로 되돌린다', () => {
    for (const id of ['reports', 'music', 'portfolio'] as const) {
      const query = tabHref(id).split('?')[1]
      expect(parseTab(new URLSearchParams(query).get('tab'))).toBe(id)
    }
    // 뉴스레터는 쿼리가 없는 '/' 이고, 파라미터 부재는 뉴스레터로 해석된다
    expect(tabHref('newsletter')).toBe('/')
    expect(parseTab(null)).toBe('newsletter')
  })
})
