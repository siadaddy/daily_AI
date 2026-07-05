import { describe, it, expect } from 'vitest'
import { extractKeywords } from './keywords'

describe('extractKeywords', () => {
  it('제목에서 키워드를 추출하고 빈도순 정렬한다', () => {
    const result = extractKeywords({
      titles: ['오픈AI 신모델 공개', '오픈AI 매출 급증', '삼성전자 반도체'],
      trendTitles: [],
      articleContents: [],
    })
    const words = result.map((r) => r.word)
    expect(words[0]).toBe('오픈AI')
    expect(result[0].count).toBe(2)
  })

  it('불용어와 숫자, HTML 엔티티를 제거한다', () => {
    const result = extractKeywords({
      titles: ['이번 발표 2026 &quot;오픈AI&quot; 통해'],
      trendTitles: [],
      articleContents: [],
    })
    const words = result.map((r) => r.word)
    expect(words).toContain('오픈AI')
    expect(words).not.toContain('이번')
    expect(words).not.toContain('발표')
    expect(words).not.toContain('2026')
    expect(words).not.toContain('quot')
  })

  it('트렌드 제목은 가중치 3을 받는다', () => {
    const result = extractKeywords({
      titles: ['엔비디아 실적'],
      trendTitles: ['엔비디아 주가'],
      articleContents: [],
    })
    const nvidia = result.find((r) => r.word === '엔비디아')
    expect(nvidia?.count).toBe(4) // 1 (title) + 3 (trend)
  })

  it('아티클 마지막 줄 해시태그를 가중치 3으로 반영한다', () => {
    const result = extractKeywords({
      titles: [],
      trendTitles: [],
      articleContents: ['본문입니다\n#클로드 #제미나이'],
    })
    const claude = result.find((r) => r.word === '클로드')
    expect(claude?.count).toBe(3)
  })

  it('topN 개수를 초과하지 않는다', () => {
    const titles = Array.from({ length: 50 }, (_, i) => `키워드${i} 테스트${i}`)
    const result = extractKeywords({
      titles,
      trendTitles: [],
      articleContents: [],
      topN: 10,
    })
    expect(result.length).toBeLessThanOrEqual(10)
  })
})
