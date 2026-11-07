import { describe, it, expect } from 'vitest'
import {
  filterTop3,
  isExcludedNews,
  sanitizeReport,
  stripExcludedSentences,
} from './exclude'
import type { PeriodReport, Top3Item } from '@/lib/types'

describe('isExcludedNews', () => {
  it('excludes rows in the 삼천리 그룹 category', () => {
    expect(
      isExcludedNews({ title: '무관한 제목', category: '🏢 삼천리 그룹' })
    ).toBe(true)
  })

  it('excludes the category without its emoji prefix', () => {
    // 저장된 데이터에 '🏢 삼천리 그룹'과 '삼천리 그룹'이 섞여 있다
    expect(
      isExcludedNews({ title: '무관한 제목', category: '삼천리 그룹' })
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

describe('filterTop3', () => {
  const items: Top3Item[] = [
    {
      rank: 1,
      title: '엔비디아 신제품 공개',
      category: '💻 기술 / IT',
      why: 'a',
    },
    {
      rank: 2,
      title: '삼천리, S-Together 개최',
      category: '🏢 삼천리 그룹',
      why: 'b',
    },
    {
      rank: 3,
      title: '코스피 사상 최고치',
      category: '💰 경제 / 금융',
      why: 'c',
    },
  ]

  it('drops excluded picks and keeps the rest intact', () => {
    expect(filterTop3(items).map((i) => i.rank)).toEqual([1, 3])
  })

  it('handles null/empty input', () => {
    expect(filterTop3(null)).toEqual([])
    expect(filterTop3([])).toEqual([])
  })
})

describe('stripExcludedSentences', () => {
  it('drops only the offending sentence', () => {
    const text =
      '중동 리스크가 일단락됐다. 뉴욕증시는 일제히 급락했다. 삼천리는 스타트업 공모전을 개최했다.'
    expect(stripExcludedSentences(text)).toBe(
      '중동 리스크가 일단락됐다. 뉴욕증시는 일제히 급락했다.'
    )
  })

  it('returns an empty string when every sentence is excluded', () => {
    expect(stripExcludedSentences('삼천리가 어쩌고. 삼천리EV는 저쩌고.')).toBe(
      ''
    )
  })

  it('handles missing text', () => {
    expect(stripExcludedSentences(null)).toBe('')
    expect(stripExcludedSentences('')).toBe('')
  })
})

describe('sanitizeReport', () => {
  const report = {
    id: 1,
    period_type: 'weekly',
    week_start: '2026-06-15',
    week_end: '2026-06-21',
    summary: '증시가 급락했다. 삼천리는 공모전을 개최했다.',
    insights:
      '삼천리 그룹 카테고리가 155건을 기록했다. 반도체 협력이 새 구도를 열었다.',
    categories: [
      { name: '🤖 AI / 인공지능', count: 20, trend: 'up' as const },
      { name: '🏢 삼천리 그룹', count: 30, trend: 'down' as const },
      { name: '삼천리 그룹', count: 10, trend: 'flat' as const },
    ],
    next_focus: ['FOMC 금리 결정', '삼천리 계열사 동향'],
    raw_data: {
      sections: [
        {
          category: '💰 경제 / 금융',
          top_issue: '금리 동결',
          insight: '시장이 반응했다',
        },
        {
          category: '🏢 삼천리 그룹',
          top_issue: '공모전',
          insight: '개최했다',
        },
      ],
    },
    created_at: '2026-06-22T00:00:00Z',
  } satisfies PeriodReport

  const clean = sanitizeReport(report)

  it('strips excluded sentences from summary and insights', () => {
    expect(clean.summary).toBe('증시가 급락했다.')
    expect(clean.insights).toBe('반도체 협력이 새 구도를 열었다.')
  })

  it('drops excluded category stats with or without the emoji prefix', () => {
    expect(clean.categories.map((c) => c.name)).toEqual(['🤖 AI / 인공지능'])
  })

  it('drops excluded next_focus items and sections', () => {
    expect(clean.next_focus).toEqual(['FOMC 금리 결정'])
    expect(clean.raw_data?.sections?.map((s) => s.category)).toEqual([
      '💰 경제 / 금융',
    ])
  })

  it('does not mutate the original report', () => {
    expect(report.categories).toHaveLength(3)
    expect(report.summary).toContain('삼천리')
  })

  it('leaves a clean report untouched', () => {
    const ok = {
      ...report,
      summary: '증시가 급락했다.',
      insights: '반도체 협력이 새 구도를 열었다.',
      categories: [
        { name: '🤖 AI / 인공지능', count: 20, trend: 'up' as const },
      ],
      next_focus: ['FOMC 금리 결정'],
      raw_data: { sections: [] },
    } satisfies PeriodReport
    expect(sanitizeReport(ok)).toEqual(ok)
  })
})
