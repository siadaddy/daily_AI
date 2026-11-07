import { describe, it, expect, vi } from 'vitest'
import dayjs from 'dayjs'

// report.ts 는 OpenAI·admin 클라이언트를 import 한다 — 순수 함수만 검사하므로 막아 둔다
vi.mock('openai', () => ({ default: class {} }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))
vi.mock('./query', () => ({ fetchAutoArticlesInRange: async () => [] }))

import {
  aggregateStats,
  extractJsonObject,
  normalizeReport,
  pickSources,
  resolveAutoRange,
} from './report'
import type { AutoArticle } from './types'

function art(over: Partial<AutoArticle>): AutoArticle {
  return {
    id: 1,
    date: '2026-11-03',
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

describe('resolveAutoRange', () => {
  const now = dayjs('2026-11-09T10:00:00+09:00') // 월요일
  it('주간 기본값: 어제까지 7일', () => {
    expect(resolveAutoRange('weekly', null, now)).toEqual({
      start: '2026-11-02',
      end: '2026-11-08',
    })
  })
  it('월간 기본값: 지난달 전체', () => {
    expect(resolveAutoRange('monthly', null, now)).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    })
  })
  it('백필: 주간은 지정일부터 7일, 월간은 그 달 전체', () => {
    expect(resolveAutoRange('weekly', '2026-10-05', now)).toEqual({
      start: '2026-10-05',
      end: '2026-10-11',
    })
    expect(resolveAutoRange('monthly', '2026-02-17', now)).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    })
  })
  it('잘못된 날짜는 거부(2월 30일 포함)', () => {
    expect(resolveAutoRange('weekly', '2026-13-01', now)).toEqual({
      error: 'invalid_start',
    })
    expect(resolveAutoRange('weekly', '2026-02-30', now)).toEqual({
      error: 'invalid_start',
    })
    expect(resolveAutoRange('weekly', 'abc', now)).toEqual({
      error: 'invalid_start',
    })
  })
})

describe('aggregateStats / pickSources', () => {
  const rows = [
    art({ id: 1, topic: 'sdv', brands: ['BMW'], is_breaking: true, link: 'a' }),
    art({
      id: 2,
      topic: 'sdv',
      brands: ['BMW', '벤츠'],
      link: 'b',
      importance: 5,
    }),
    art({ id: 3, topic: 'bmw_group', link: 'c' }),
  ]
  it('건수는 코드가 센다', () => {
    const s = aggregateStats(rows)
    expect(s.total).toBe(3)
    expect(s.breakingCount).toBe(1)
    expect(s.byTopic).toEqual([
      { topic: 'bmw_group', count: 1 },
      { topic: 'sdv', count: 2 },
    ])
    expect(s.byBrand[0]).toEqual({ brand: 'BMW', count: 2 })
  })
  it('근거 기사: 속보 먼저, 링크 중복 제거, 상한', () => {
    const dup = [...rows, art({ id: 4, link: 'a', title: '중복' })]
    const src = pickSources(dup, 2)
    expect(src.map((s) => s.link)).toEqual(['a', 'b'])
  })
})

describe('normalizeReport', () => {
  const stats = aggregateStats([
    art({ topic: 'sdv' }),
    art({ topic: 'bmw_group', id: 2 }),
  ])
  const sources = [{ title: 't', link: 'a', source: 's' }]
  const good = {
    headline: '헤드라인',
    summary: '요약',
    sections: [
      { topic: 'sdv', body: 'SDV 본문' },
      { topic: 'regulation', body: '기사 없는 주제 — 버려야 함' },
      { topic: 'sdv', body: '중복 주제 — 버려야 함' },
      { topic: 'hack', body: '허용 밖' },
    ],
    implications: ['하나', 3, '', '둘'],
    stats: { total: 9999 }, // LLM 이 지어낸 수치 — 무시되어야 함
  }
  it('허용 밖·중복·빈 항목을 버리고 수치는 코드 값을 쓴다', () => {
    const out = normalizeReport(good, stats, sources)!
    expect(out.sections.map((s) => s.topic)).toEqual(['sdv'])
    expect(out.sections[0].title).toBe('소프트웨어 정의 차량')
    expect(out.implications).toEqual(['하나', '둘'])
    expect(out.stats.total).toBe(2)
    expect(out.sources).toBe(sources)
  })
  it('헤드라인·요약이 없으면 거부', () => {
    expect(normalizeReport({ summary: 'x' }, stats, sources)).toBeNull()
    expect(normalizeReport(null, stats, sources)).toBeNull()
  })
})

describe('extractJsonObject', () => {
  it('코드펜스와 잡설을 허용하고 실패는 null', () => {
    expect(extractJsonObject('설명\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJsonObject('죄송합니다')).toBeNull()
    expect(extractJsonObject('{"a":')).toBeNull()
  })
})
