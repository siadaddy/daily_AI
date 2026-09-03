import { describe, it, expect } from 'vitest'
import { buildCategoryStats, deltaPct } from './category-stats'

describe('deltaPct', () => {
  it('증감률을 소수 첫째 자리까지 계산한다', () => {
    expect(deltaPct(150, 100)).toBe(50)
    expect(deltaPct(50, 100)).toBe(-50)
    expect(deltaPct(100, 100)).toBe(0)
  })

  it('직전이 0이면 현재 값 유무로 판단한다', () => {
    expect(deltaPct(10, 0)).toBe(100)
    expect(deltaPct(0, 0)).toBe(0)
  })
})

describe('buildCategoryStats', () => {
  const cards = [
    { category: '🤖 AI / 인공지능' },
    { category: '🤖 AI / 인공지능' },
    { category: '🤖 AI / 인공지능' },
    { category: '💰 경제 / 금융' },
    { category: null },
  ]

  it('실제 건수를 그대로 집계한다', () => {
    const stats = buildCategoryStats(cards, [])
    expect(stats.find((s) => s.name === '🤖 AI / 인공지능')?.count).toBe(3)
    expect(stats.find((s) => s.name === '💰 경제 / 금융')?.count).toBe(1)
  })

  it('카테고리명을 이모지까지 원본 그대로 유지한다', () => {
    const stats = buildCategoryStats(cards, [])
    expect(stats.map((s) => s.name)).toContain('🤖 AI / 인공지능')
  })

  it('category가 없으면 기타로 묶는다', () => {
    const stats = buildCategoryStats(cards, [])
    expect(stats.find((s) => s.name === '기타')?.count).toBe(1)
  })

  it('건수 내림차순으로 정렬한다', () => {
    const stats = buildCategoryStats(cards, [])
    expect(stats[0].name).toBe('🤖 AI / 인공지능')
  })

  it('직전 기간 대비 ±10%를 넘어야 상승/하락으로 본다', () => {
    const prev = [
      { category: 'A' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
    ]
    // A: 1 → 3 (+200%), B: 9 → 9 (0%)
    const current = [
      { category: 'A' },
      { category: 'A' },
      { category: 'A' },
      ...Array(9).fill({ category: 'B' }),
    ]
    const stats = buildCategoryStats(current, prev)
    expect(stats.find((s) => s.name === 'A')?.trend).toBe('up')
    expect(stats.find((s) => s.name === 'B')?.trend).toBe('flat')
  })

  it('직전 기간에 없던 카테고리는 상승으로 본다', () => {
    const stats = buildCategoryStats([{ category: '신규' }], [])
    expect(stats[0].trend).toBe('up')
    expect(stats[0].deltaPct).toBe(100)
  })

  it('사라진 카테고리는 결과에 포함하지 않는다', () => {
    const stats = buildCategoryStats([{ category: 'A' }], [{ category: 'Z' }])
    expect(stats.map((s) => s.name)).toEqual(['A'])
  })
})
