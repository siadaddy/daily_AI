import { describe, it, expect } from 'vitest'
import { isSafeKeyword } from './archive'

describe('isSafeKeyword', () => {
  it('한글·영문·숫자 토큰을 허용한다', () => {
    expect(isSafeKeyword('반도체')).toBe(true)
    expect(isSafeKeyword('AI')).toBe(true)
    expect(isSafeKeyword('GPT4')).toBe(true)
    expect(isSafeKeyword('오픈AI')).toBe(true)
    expect(isSafeKeyword('데이터_센터')).toBe(true)
  })

  it('한 글자 또는 빈 문자열을 거부한다', () => {
    expect(isSafeKeyword('A')).toBe(false)
    expect(isSafeKeyword('')).toBe(false)
  })

  it('PostgREST or() 필터 구문을 깨뜨리는 문자를 거부한다', () => {
    // 쉼표·괄호·점은 or(...) 필터의 구분자다
    expect(isSafeKeyword('AI,summary.ilike.*')).toBe(false)
    expect(isSafeKeyword('AI)')).toBe(false)
    expect(isSafeKeyword('title.ilike')).toBe(false)
    // %와 _는 LIKE 와일드카드
    expect(isSafeKeyword('%')).toBe(false)
    expect(isSafeKeyword('AI%')).toBe(false)
    expect(isSafeKeyword('AI 반도체')).toBe(false)
  })

  it('지나치게 긴 입력을 거부한다', () => {
    expect(isSafeKeyword('가'.repeat(41))).toBe(false)
    expect(isSafeKeyword('가'.repeat(40))).toBe(true)
  })
})
