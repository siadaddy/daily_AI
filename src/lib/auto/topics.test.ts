import { describe, it, expect } from 'vitest'
import {
  SECTION_VISIBLE,
  SECTION_VISIBLE_FILTERED,
  TOPIC_LABEL,
  TOPIC_ORDER,
  brandCounts,
  buildCompetitorMatrix,
  filterArticles,
  groupByTopic,
  isAutoTopic,
  pickLead,
} from './topics'
import type { AutoArticle, CompetitorRow } from './types'

function art(over: Partial<AutoArticle>): AutoArticle {
  return {
    id: 1,
    date: '2026-11-07',
    title: 't',
    title_original: '',
    summary_ko: '',
    link: 'https://x.com/1',
    source: 's',
    source_type: 'trade',
    topic: 'other',
    brands: [],
    importance: 3,
    is_breaking: false,
    lang: 'ko',
    published_at: null,
    so_what: '',
    ...over,
  }
}

function comp(over: Partial<CompetitorRow>): CompetitorRow {
  return {
    id: 1,
    date: '2026-11-01',
    brand: '벤츠',
    item: 'recall',
    note: 'n',
    source_link: 'https://x.com/c',
    ...over,
  }
}

describe('pickLead', () => {
  it('속보가 중요도 5보다 먼저 온다', () => {
    const rows = [
      art({ id: 1, importance: 5 }),
      art({ id: 2, importance: 3, is_breaking: true }),
    ]
    expect(pickLead(rows, 2).map((r) => r.id)).toEqual([2, 1])
  })

  it('강한 기사가 없으면 중요도 상위로 채운다', () => {
    const rows = [art({ id: 1, importance: 2 }), art({ id: 2, importance: 3 })]
    expect(pickLead(rows, 1).map((r) => r.id)).toEqual([2])
  })

  it('중요도 3 이하는 강한 기사가 있으면 끼지 않는다', () => {
    const rows = [art({ id: 1, importance: 4 }), art({ id: 2, importance: 3 })]
    expect(pickLead(rows, 3).map((r) => r.id)).toEqual([1])
  })
})

describe('groupByTopic', () => {
  it('표시 순서대로 묶고 빈 주제는 생략한다', () => {
    const rows = [
      art({ id: 1, topic: 'sdv' }),
      art({ id: 2, topic: 'bmw_group' }),
      art({ id: 3, topic: 'sdv', importance: 5 }),
    ]
    const g = groupByTopic(rows)
    expect(g.map((x) => x.topic)).toEqual(['bmw_group', 'sdv'])
    expect(g[1].rows.map((r) => r.id)).toEqual([3, 1])
  })
})

describe('buildCompetitorMatrix', () => {
  it('칸마다 가장 최근 기록을 남긴다', () => {
    const m = buildCompetitorMatrix([
      comp({ id: 1, date: '2026-10-01', note: '옛' }),
      comp({ id: 2, date: '2026-11-01', note: '새' }),
    ])
    expect(m.cells['벤츠'].recall?.note).toBe('새')
  })

  it('기록이 많은 브랜드가 앞에 온다', () => {
    const m = buildCompetitorMatrix([
      comp({ id: 1, brand: '아우디' }),
      comp({ id: 2, brand: '벤츠' }),
      comp({ id: 3, brand: '벤츠', item: 'price' }),
    ])
    expect(m.brands).toEqual(['벤츠', '아우디'])
  })

  it('빈 입력은 빈 표', () => {
    expect(buildCompetitorMatrix([])).toEqual({ brands: [], cells: {} })
  })
})

describe('필터 · 칩', () => {
  const rows = [
    art({ id: 1, topic: 'sdv', brands: ['BMW'] }),
    art({ id: 2, topic: 'sdv', brands: ['벤츠'] }),
    art({ id: 3, topic: 'regulation', brands: ['BMW', '벤츠'] }),
  ]
  it('주제와 브랜드를 AND 로 거른다', () => {
    expect(
      filterArticles(rows, { topic: 'sdv', brand: 'BMW' }).map((r) => r.id)
    ).toEqual([1])
    expect(filterArticles(rows, {}).length).toBe(3)
  })
  it('브랜드 빈도순 칩', () => {
    expect(brandCounts(rows)).toEqual([
      { brand: 'BMW', count: 2 },
      { brand: '벤츠', count: 2 },
    ])
  })
  it('주제 값 검증', () => {
    expect(isAutoTopic('sdv')).toBe(true)
    expect(isAutoTopic('hack')).toBe(false)
    expect(isAutoTopic(undefined)).toBe(false)
  })
})

describe('주제 체계', () => {
  it('전기차·배터리 산업 주제가 있고 모든 주제에 라벨이 있다', () => {
    expect(isAutoTopic('ev_industry')).toBe(true)
    for (const t of TOPIC_ORDER) expect(TOPIC_LABEL[t]).toBeTruthy()
  })

  it('EV 산업은 애프터세일즈 바로 다음에 표시된다', () => {
    const rows = [
      art({ id: 1, topic: 'regulation' }),
      art({ id: 2, topic: 'ev_industry' }),
      art({ id: 3, topic: 'ev_aftersales' }),
    ]
    expect(groupByTopic(rows).map((g) => g.topic)).toEqual([
      'ev_aftersales',
      'ev_industry',
      'regulation',
    ])
  })

  it('섹션 기본 노출 수는 필터 중이 더 많다(읽는 양을 줄이되 필터하면 더 보여 준다)', () => {
    expect(SECTION_VISIBLE).toBeGreaterThan(0)
    expect(SECTION_VISIBLE_FILTERED).toBeGreaterThan(SECTION_VISIBLE)
  })
})
