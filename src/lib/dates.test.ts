import { describe, it, expect, vi, afterEach } from 'vitest'
import { isValidDate, newsHref, reportHref, keywordHref } from './dates'

describe('isValidDate', () => {
  it('YYYY-MM-DD 형식의 실제 날짜를 통과시킨다', () => {
    expect(isValidDate('2026-09-03')).toBe(true)
    expect(isValidDate('2024-02-29')).toBe(true)
  })

  it('형식이 어긋나면 거부한다', () => {
    expect(isValidDate('2026-9-3')).toBe(false)
    expect(isValidDate('20260903')).toBe(false)
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('오늘')).toBe(false)
  })

  it('존재하지 않는 날짜를 거부한다', () => {
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('2025-02-29')).toBe(false)
  })
})

describe('newsHref', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('오늘은 루트를 정식 경로로 쓴다', () => {
    vi.useFakeTimers()
    // KST 2026-09-03 09:00 (UTC 00:00)
    vi.setSystemTime(new Date('2026-09-03T00:00:00Z'))
    expect(newsHref('2026-09-03')).toBe('/')
  })

  it('과거 날짜는 /news/[date]를 쓴다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T00:00:00Z'))
    expect(newsHref('2026-09-01')).toBe('/news/2026-09-01')
  })
})

describe('reportHref / keywordHref', () => {
  it('리포트 퍼머링크를 만든다', () => {
    expect(reportHref('weekly', '2026-08-24')).toBe(
      '/reports/weekly/2026-08-24'
    )
  })

  it('한글 키워드를 URL 인코딩한다', () => {
    expect(keywordHref('반도체')).toBe(
      `/keyword/${encodeURIComponent('반도체')}`
    )
  })

  it('경로 구분자가 될 수 있는 문자를 이스케이프한다', () => {
    expect(keywordHref('a/b')).toBe('/keyword/a%2Fb')
  })
})
