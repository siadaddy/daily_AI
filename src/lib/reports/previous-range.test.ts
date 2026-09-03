import { describe, it, expect } from 'vitest'
import { previousRange } from './generate'

describe('previousRange', () => {
  it('주간(7일)의 직전 7일을 반환한다', () => {
    expect(previousRange('2026-08-24', '2026-08-30')).toEqual({
      start: '2026-08-17',
      end: '2026-08-23',
    })
  })

  it('월간(31일)의 직전 31일을 반환한다', () => {
    // 8/1~8/31은 31일 → 직전 31일은 7/1~7/31
    expect(previousRange('2026-08-01', '2026-08-31')).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    })
  })

  it('구간 길이가 대상 기간과 같다', () => {
    const prev = previousRange('2026-08-01', '2026-08-30')
    expect(prev).toEqual({ start: '2026-07-02', end: '2026-07-31' })
  })

  it('직전 기간이 대상 기간과 겹치지 않는다', () => {
    const prev = previousRange('2026-08-24', '2026-08-30')
    expect(prev.end < '2026-08-24').toBe(true)
  })
})
