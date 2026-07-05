import { describe, it, expect } from 'vitest'
import { validateText, isValidContentKey, LIMITS } from './validation'

describe('validateText', () => {
  it('정상 입력은 trim된 값을 반환한다', () => {
    const r = validateText('  안녕하세요  ', '제목', LIMITS.postTitle)
    expect(r.error).toBeNull()
    expect(r.value).toBe('안녕하세요')
  })

  it('빈 문자열/공백만 있으면 에러', () => {
    expect(validateText('', '제목', 100).error).toContain('제목')
    expect(validateText('   ', '제목', 100).error).toContain('입력')
  })

  it('최대 길이를 초과하면 에러', () => {
    const long = '가'.repeat(101)
    const r = validateText(long, '제목', 100)
    expect(r.error).toContain('100')
    expect(r.value).toBeNull()
  })

  it('정확히 최대 길이는 통과', () => {
    const exact = '가'.repeat(100)
    expect(validateText(exact, '제목', 100).error).toBeNull()
  })

  it('문자열이 아닌 입력은 에러', () => {
    // 런타임에 클라이언트가 임의 값을 보낼 수 있음
    expect(
      validateText(undefined as unknown as string, '제목', 100).error
    ).not.toBeNull()
  })
})

describe('isValidContentKey', () => {
  it('영문/숫자/구분자 조합은 유효', () => {
    expect(isValidContentKey('card:2026-07-05:3')).toBe(true)
    expect(isValidContentKey('article_2026.07.05')).toBe(true)
  })

  it('빈 값, 공백, 특수문자, 초과 길이는 무효', () => {
    expect(isValidContentKey('')).toBe(false)
    expect(isValidContentKey('has space')).toBe(false)
    expect(isValidContentKey("'; drop table--")).toBe(false)
    expect(isValidContentKey('a'.repeat(201))).toBe(false)
  })
})
