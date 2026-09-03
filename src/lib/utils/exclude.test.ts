import { describe, it, expect } from 'vitest'
import { isExcludedNews } from './exclude'

describe('isExcludedNews', () => {
  it('excludes rows in the 삼천리 그룹 category', () => {
    expect(
      isExcludedNews({ title: '무관한 제목', category: '🏢 삼천리 그룹' })
    ).toBe(true)
  })

  it('excludes rows whose title mentions 삼천리', () => {
    expect(
      isExcludedNews({
        title: '삼천리, 도시가스 요금 인상 발표',
        category: '💰 경제 / 금융',
      })
    ).toBe(true)
  })

  it('excludes rows whose summary mentions 삼천리', () => {
    expect(
      isExcludedNews({
        title: '에너지 업계 동향',
        summary: '삼천리 등 도시가스 3사가 참여했다',
        category: '💰 경제 / 금융',
      })
    ).toBe(true)
  })

  it('keeps unrelated news', () => {
    expect(
      isExcludedNews({
        title: 'BMW, 신형 전기차 공개',
        summary: '뮌헨에서 열린 행사에서',
        category: '🚘 BMW',
      })
    ).toBe(false)
  })

  it('handles missing fields', () => {
    expect(isExcludedNews({})).toBe(false)
    expect(isExcludedNews({ title: null, summary: null, category: null })).toBe(
      false
    )
  })
})
