import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAutoArticlesInRange } from './query'
import { TOPIC_LABEL, TOPIC_ORDER, brandCounts, isAutoTopic } from './topics'
import type { AutoArticle, AutoReportContent, AutoTopic } from './types'

dayjs.extend(utc)
dayjs.extend(timezone)

export type AutoPeriod = 'weekly' | 'monthly'

// ───────────── 순수 함수 (테스트 대상) ─────────────

/**
 * 기간 계산. start 미지정이면 "방금 끝난 기간"(주간=어제까지 7일, 월간=지난달),
 * 지정하면 백필(주간=해당일부터 7일, 월간=해당 월). 기존 /api/reports/generate 와 같은 규칙.
 */
export function resolveAutoRange(
  period: AutoPeriod,
  startParam: string | null,
  now: dayjs.Dayjs = dayjs().tz('Asia/Seoul')
): { start: string; end: string } | { error: 'invalid_start' } {
  if (startParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startParam))
      return { error: 'invalid_start' }
    const s = dayjs(startParam)
    if (!s.isValid() || s.format('YYYY-MM-DD') !== startParam) {
      return { error: 'invalid_start' }
    }
    if (period === 'weekly') {
      return { start: startParam, end: s.add(6, 'day').format('YYYY-MM-DD') }
    }
    const m = s.startOf('month')
    return {
      start: m.format('YYYY-MM-DD'),
      end: m.endOf('month').format('YYYY-MM-DD'),
    }
  }
  if (period === 'weekly') {
    const end = now.subtract(1, 'day').startOf('day')
    return {
      start: end.subtract(6, 'day').format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    }
  }
  const prev = now.subtract(1, 'month')
  return {
    start: prev.startOf('month').format('YYYY-MM-DD'),
    end: prev.endOf('month').format('YYYY-MM-DD'),
  }
}

/** 건수·분포는 코드가 센다. LLM 에게 세게 하면 지어낸다(category-stats.ts 주석 참고). */
export function aggregateStats(
  articles: AutoArticle[]
): AutoReportContent['stats'] {
  const counts = new Map<AutoTopic, number>()
  for (const a of articles) counts.set(a.topic, (counts.get(a.topic) ?? 0) + 1)
  return {
    total: articles.length,
    byTopic: TOPIC_ORDER.filter((t) => counts.has(t)).map((topic) => ({
      topic,
      count: counts.get(topic) ?? 0,
    })),
    byBrand: brandCounts(articles).slice(0, 10),
    breakingCount: articles.filter((a) => a.is_breaking).length,
  }
}

/** 근거 기사는 코드가 고른다: 속보 → 중요도 → 최신순, 링크 중복 제거. */
export function pickSources(
  articles: AutoArticle[],
  n = 15
): AutoReportContent['sources'] {
  const sorted = [...articles].sort((a, b) => {
    if (a.is_breaking !== b.is_breaking) return a.is_breaking ? -1 : 1
    if (b.importance !== a.importance) return b.importance - a.importance
    return (b.published_at ?? '').localeCompare(a.published_at ?? '')
  })
  const seen = new Set<string>()
  const out: AutoReportContent['sources'] = []
  for (const a of sorted) {
    if (seen.has(a.link)) continue
    seen.add(a.link)
    out.push({ title: a.title, link: a.link, source: a.source })
    if (out.length >= n) break
  }
  return out
}

export function buildReportPrompt(
  period: AutoPeriod,
  start: string,
  end: string,
  stats: AutoReportContent['stats'],
  sample: AutoArticle[]
): string {
  const label = period === 'weekly' ? '주간' : '월간'
  const topics = stats.byTopic.map((t) => `${t.topic}(${TOPIC_LABEL[t.topic]})`)
  const lines = sample.map(
    (a, i) =>
      `[${i + 1}] [${a.topic}] ${a.title}${a.summary_ko ? ` :: ${a.summary_ko}` : ''}`
  )
  return `당신은 수입차 브랜드 서비스본부 기획실의 ${label} 보고서 초안 작성 보조입니다.
기간: ${start} ~ ${end}. 아래 기사 목록(중요도 상위)만 근거로 JSON 만 출력하세요.

규칙:
- 목록에 **없는 사실·숫자·날짜·고유명사를 만들지 마세요.** 건수와 비율은 쓰지 마세요(코드가 따로 집계합니다).
- headline: 이 기간을 한 줄로(40자 이내). summary: 3~4문장.
- sections: 아래 주제 중 기사가 있는 것만, 각 body 는 2~4문장. topic 값은 반드시 이 목록 중 하나: ${topics.join(', ')}
- implications: 서비스본부 기획 관점의 시사점 3~5개. 해석이므로 "~할 수 있음/~점검 필요" 어조로, 각 120자 이내.

출력 형식:
{"headline":"...","summary":"...","sections":[{"topic":"bmw_group","body":"..."}],"implications":["..."]}

기사 목록:
${lines.join('\n')}`
}

/** LLM 응답에서 JSON 객체 추출(코드펜스·앞뒤 잡설 허용). 실패하면 null. */
export function extractJsonObject(text: string): unknown | null {
  const s = text.indexOf('{')
  const e = text.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try {
    return JSON.parse(text.slice(s, e + 1))
  } catch {
    return null
  }
}

/** LLM 출력을 검증해 보고서 본문으로. 허용 밖의 값은 버리고, 수치·출처는 코드 값으로 채운다. */
export function normalizeReport(
  raw: unknown,
  stats: AutoReportContent['stats'],
  sources: AutoReportContent['sources']
): AutoReportContent | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const headline = typeof r.headline === 'string' ? r.headline.trim() : ''
  const summary = typeof r.summary === 'string' ? r.summary.trim() : ''
  if (!headline || !summary) return null

  const available = new Set(stats.byTopic.map((t) => t.topic))
  const seen = new Set<string>()
  const sections: AutoReportContent['sections'] = []
  for (const s of Array.isArray(r.sections) ? r.sections : []) {
    const topic = (s as { topic?: string })?.topic
    const body = (s as { body?: unknown })?.body
    if (!isAutoTopic(topic) || !available.has(topic) || seen.has(topic))
      continue
    if (typeof body !== 'string' || !body.trim()) continue
    seen.add(topic)
    sections.push({
      topic,
      title: TOPIC_LABEL[topic],
      body: body.trim().slice(0, 800),
    })
  }
  sections.sort(
    (a, b) => TOPIC_ORDER.indexOf(a.topic) - TOPIC_ORDER.indexOf(b.topic)
  )

  const implications = (Array.isArray(r.implications) ? r.implications : [])
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim().slice(0, 150))
    .slice(0, 5)

  return {
    headline: headline.slice(0, 80),
    summary: summary.slice(0, 800),
    stats,
    sections,
    implications,
    sources,
  }
}

// ───────────── 입출력 ─────────────

export type AutoGenerateResult =
  | {
      ok: true
      period_type: AutoPeriod
      period_start: string
      period_end: string
    }
  | { ok: false; error: string; detail?: string; status: number }

const PROMPT_LIMIT = 60
const MIN_ARTICLES = 5

export async function generateAutoReport(params: {
  periodType: AutoPeriod
  start: string
  end: string
}): Promise<AutoGenerateResult> {
  const { periodType, start, end } = params
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: 'missing_api_key', status: 500 }
  }

  const articles = await fetchAutoArticlesInRange(start, end)
  // 근거가 너무 적으면 보고서를 지어내기 쉽다 — 만들지 않는다
  if (articles.length < MIN_ARTICLES) {
    return {
      ok: false,
      error: 'not_enough_articles',
      detail: `${articles.length}건 (최소 ${MIN_ARTICLES}건)`,
      status: 422,
    }
  }

  const stats = aggregateStats(articles)
  const sample = pickSources(articles, PROMPT_LIMIT).map(
    (s) => articles.find((a) => a.link === s.link)!
  )
  const sources = pickSources(articles, 15)

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: buildReportPrompt(periodType, start, end, stats, sample),
        },
      ],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    const content = normalizeReport(extractJsonObject(text), stats, sources)
    if (!content) {
      console.error('[auto/report] 응답 검증 실패:', text.slice(0, 500))
      return { ok: false, error: 'parse_error', status: 500 }
    }

    const { error } = await createAdminClient()
      .from('auto_reports')
      .upsert(
        {
          period_type: periodType,
          period_start: start,
          period_end: end,
          content,
        },
        { onConflict: 'period_type,period_start' }
      )
    if (error) {
      console.error('[auto/report] upsert error:', error)
      return {
        ok: false,
        error: 'upsert_error',
        detail: error.message,
        status: 500,
      }
    }
    return {
      ok: true,
      period_type: periodType,
      period_start: start,
      period_end: end,
    }
  } catch (err) {
    console.error('[auto/report] unexpected error:', err)
    return {
      ok: false,
      error: 'internal_error',
      detail: String(err),
      status: 500,
    }
  }
}
