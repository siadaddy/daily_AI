import OpenAI from 'openai'
import dayjs from 'dayjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractKeywords } from '@/lib/utils/keywords'
import { isExcludedNews } from '@/lib/utils/exclude'
import { buildCategoryStats } from '@/lib/utils/category-stats'
import type {
  CategoryStat,
  PeriodType,
  ReportSection,
  Top3Item,
} from '@/lib/types'

interface NewsCardRow {
  title: string
  category: string | null
  date: string | null
}

interface NewsTrendRow {
  top3: Top3Item[] | null
  date: string | null
}

interface WeeklyReportRow {
  week_start: string
  week_end: string
  summary: string
  insights: string
}

/**
 * LLM에게 요구하는 출력.
 * categories(건수·추세)는 의도적으로 제외한다 — 세는 일은 코드가 한다.
 */
interface BriefingJson {
  summary: string
  insights: string
  next_focus: string[]
  sections?: ReportSection[]
}

export type GenerateResult =
  | { ok: true; period_type: PeriodType; week_start: string; week_end: string }
  | { ok: false; error: string; detail?: string; status: number }

// Supabase는 요청당 최대 1000행을 반환하므로 페이지 단위로 전부 수집
export async function fetchAllPages<T>(
  buildQuery: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    all.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return all
}

function formatTrendLines(trends: NewsTrendRow[]): string {
  return trends
    .map((t) => {
      const top = (t.top3 ?? [])
        .map((i) => `#${i.rank} ${i.title} (${i.category})`)
        .join(' / ')
      return `[${t.date ?? ''}] TOP3: ${top}`
    })
    .join('\n')
}

function buildWeeklyPrompt(
  start: string,
  end: string,
  cards: NewsCardRow[],
  trends: NewsTrendRow[]
): string {
  const cardLines = cards
    .map((c) => `[${c.date ?? ''}] [${c.category ?? '기타'}] ${c.title}`)
    .join('\n')

  return `당신은 한국 AI 뉴스 분석 전문가입니다.
아래는 ${start} ~ ${end}에 수집된 뉴스 기사 목록과 일별 트렌드 분석입니다.

=== 수집 기사 (총 ${cards.length}건) ===
${cardLines || '(데이터 없음)'}

=== 일별 TOP3 트렌드 ===
${formatTrendLines(trends) || '(데이터 없음)'}

위 데이터에 실제로 등장한 기업명·수치·사건만 사용하세요. 창작 금지.
건수 집계는 시스템이 따로 계산하므로 숫자를 세려고 하지 마세요.

아래 JSON 형식으로만 응답하세요. 코드블록 없이 순수 JSON만 출력하세요:
{
  "summary": "이번 주를 관통하는 3-4문장 핵심 요약 (한국어)",
  "sections": [
    {
      "category": "분야명 (위 기사 목록의 대괄호 안 분야명을 그대로 복사)",
      "top_issue": "그 분야의 이번 주 핵심 이슈 한 줄 (20자 내외)",
      "insight": "2문장. ①실제 등장한 기업명·수치로 무슨 일이 있었는지 ②독자에게 주는 실질적 의미"
    }
  ],
  "insights": "편집장 시각의 심층 인사이트 2-3문장 (한국어)",
  "next_focus": ["다음 주 주목할 포인트 1", "포인트 2", "포인트 3"]
}

sections는 기사가 많은 상위 4개 분야만 포함하세요.`
}

function buildMonthlyPrompt(params: {
  start: string
  end: string
  totalCards: number
  categoryCounts: { name: string; count: number }[]
  topKeywords: string[]
  weeklyVolumes: { weekStart: string; count: number }[]
  weeklyReports: WeeklyReportRow[]
  trends: NewsTrendRow[]
}): string {
  const {
    start,
    end,
    totalCards,
    categoryCounts,
    topKeywords,
    weeklyVolumes,
    weeklyReports,
    trends,
  } = params

  const weeklySection = weeklyReports.length
    ? weeklyReports
        .map(
          (w) =>
            `[${w.week_start} ~ ${w.week_end}]\n요약: ${w.summary}\n인사이트: ${w.insights}`
        )
        .join('\n\n')
    : '(주간 리포트 없음 — 아래 집계와 트렌드만으로 분석)'

  return `당신은 한국 AI 뉴스 분석 전문가입니다.
아래는 ${start} ~ ${end} 한 달간의 뉴스 수집 집계와 주간 리포트, 일별 트렌드입니다.
개별 기사가 아닌 월 단위의 큰 흐름(산업 동향, 반복 등장 주제, 변곡점)을 분석하세요.

=== 월간 집계 (총 ${totalCards}건) ===
카테고리별: ${categoryCounts.map((c) => `${c.name} ${c.count}건`).join(', ')}
주별 기사량: ${weeklyVolumes.map((v) => `${v.weekStart}주 ${v.count}건`).join(', ')}
상위 키워드: ${topKeywords.join(', ')}

=== 주간 리포트 요약 ===
${weeklySection}

=== 일별 TOP3 트렌드 ===
${formatTrendLines(trends) || '(데이터 없음)'}

위 데이터에 실제로 등장한 기업명·수치·사건만 사용하세요. 창작 금지.
건수 집계는 시스템이 따로 계산하므로 숫자를 세려고 하지 마세요.

아래 JSON 형식으로만 응답하세요. 코드블록 없이 순수 JSON만 출력하세요:
{
  "summary": "이번 달을 관통하는 4-5문장 핵심 요약 (한국어)",
  "sections": [
    {
      "category": "분야명 (위 '분야별 기사 수'의 분야명을 그대로 복사)",
      "top_issue": "그 분야의 이번 달 핵심 이슈 한 줄 (20자 내외)",
      "insight": "2문장. ①실제 등장한 기업명·수치로 무슨 일이 있었는지 ②독자에게 주는 실질적 의미"
    }
  ],
  "insights": "편집장 시각의 월간 심층 인사이트 3-4문장 (한국어)",
  "next_focus": ["다음 달 주목할 포인트 1", "포인트 2", "포인트 3"]
}

sections는 기사가 많은 상위 4개 분야만 포함하세요.`
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text.trim()
}

/** 일별 TOP3를 카테고리 집계용 행으로 편다 */
function topPicks(trends: NewsTrendRow[]): { category: string | null }[] {
  return trends
    .flatMap((t) => t.top3 ?? [])
    .filter((i) => !isExcludedNews({ title: i.title, category: i.category }))
    .map((i) => ({ category: i.category ?? null }))
}

/** [start, end] 바로 앞의 같은 길이 기간 — 카테고리 추세 비교용 */
export function previousRange(
  start: string,
  end: string
): { start: string; end: string } {
  const days = dayjs(end).diff(dayjs(start), 'day') + 1
  const prevEnd = dayjs(start).subtract(1, 'day')
  return {
    start: prevEnd.subtract(days - 1, 'day').format('YYYY-MM-DD'),
    end: prevEnd.format('YYYY-MM-DD'),
  }
}

/** 프롬프트에 실어보낼 기사 제목 최대 개수 (집계는 전량으로 별도 수행) */
const PROMPT_CARD_LIMIT = 200

export async function generateReport(params: {
  periodType: PeriodType
  start: string
  end: string
}): Promise<GenerateResult> {
  const { periodType, start, end } = params

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: 'missing_api_key', status: 500 }
  }

  try {
    const supabase = createAdminClient()

    const { data: rawTrends, error: trendsErr } = await supabase
      .from('news_trends')
      .select('top3, date')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })

    if (trendsErr) {
      console.error('[reports/generate] news_trends query error:', trendsErr)
      return {
        ok: false,
        error: 'db_error',
        detail: trendsErr.message,
        status: 500,
      }
    }
    const trends: NewsTrendRow[] = rawTrends ?? []

    let prompt: string
    if (periodType === 'weekly') {
      let weekCards: NewsCardRow[]
      try {
        weekCards = await fetchAllPages<NewsCardRow>((from, to) =>
          supabase
            .from('news_cards')
            .select('title, category, date')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true })
            .range(from, to)
        )
      } catch (err) {
        console.error('[reports/generate] news_cards pagination error:', err)
        return {
          ok: false,
          error: 'db_error',
          detail: String(err),
          status: 500,
        }
      }
      // 프롬프트에는 표본만 실어 토큰을 아낀다 (집계에는 쓰지 않는다)
      prompt = buildWeeklyPrompt(
        start,
        end,
        weekCards.filter((c) => !isExcludedNews(c)).slice(0, PROMPT_CARD_LIMIT),
        trends
      )
    } else {
      // 월간: 원문 제목 대신 전체 집계 + 주간 리포트를 입력으로 사용
      let cards: NewsCardRow[]
      try {
        cards = await fetchAllPages<NewsCardRow>((from, to) =>
          supabase
            .from('news_cards')
            .select('title, category, date')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true })
            .range(from, to)
        )
      } catch (err) {
        console.error('[reports/generate] news_cards pagination error:', err)
        return {
          ok: false,
          error: 'db_error',
          detail: String(err),
          status: 500,
        }
      }
      cards = cards.filter((c) => !isExcludedNews(c))

      const { data: rawWeekly, error: weeklyErr } = await supabase
        .from('weekly_reports')
        .select('week_start, week_end, summary, insights')
        .eq('period_type', 'weekly')
        .gte('week_start', start)
        .lte('week_start', end)
        .order('week_start', { ascending: true })

      if (weeklyErr) {
        console.error(
          '[reports/generate] weekly_reports query error:',
          weeklyErr
        )
        return {
          ok: false,
          error: 'db_error',
          detail: weeklyErr.message,
          status: 500,
        }
      }

      const catMap = new Map<string, number>()
      for (const c of cards) {
        const cat = c.category ?? '기타'
        catMap.set(cat, (catMap.get(cat) ?? 0) + 1)
      }
      const categoryCounts = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))

      const trendTitles = trends.flatMap((t) =>
        (t.top3 ?? []).map((i) => i.title ?? '')
      )
      const topKeywords = extractKeywords({
        titles: cards.map((c) => c.title ?? ''),
        trendTitles,
        articleContents: [],
        topN: 20,
      }).map((k) => k.word)

      const volMap = new Map<string, number>()
      for (const c of cards) {
        if (!c.date) continue
        const d = new Date(`${c.date}T00:00:00`)
        // 해당 주 월요일로 정규화
        const day = d.getDay()
        d.setDate(d.getDate() - ((day + 6) % 7))
        const weekStart = d.toISOString().slice(0, 10)
        volMap.set(weekStart, (volMap.get(weekStart) ?? 0) + 1)
      }
      const weeklyVolumes = Array.from(volMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekStart, count]) => ({ weekStart, count }))

      prompt = buildMonthlyPrompt({
        start,
        end,
        totalCards: cards.length,
        categoryCounts,
        topKeywords,
        weeklyVolumes,
        weeklyReports: rawWeekly ?? [],
        trends,
      })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    if (!rawText) {
      console.error(
        '[reports/generate] OpenAI returned no content:',
        completion.choices
      )
      return { ok: false, error: 'empty_response', status: 500 }
    }

    let parsed: BriefingJson
    try {
      parsed = JSON.parse(extractJson(rawText)) as BriefingJson
    } catch (parseErr) {
      console.error(
        '[reports/generate] JSON parse failed:',
        parseErr,
        '\nRaw:',
        rawText
      )
      return { ok: false, error: 'parse_error', status: 500 }
    }

    // 카테고리 건수·추세는 LLM 출력이 아니라 실데이터에서 집계한다.
    //
    // 집계 대상은 수집 원문(news_cards)이 아니라 일별 TOP3다.
    // 수집은 "카테고리당 하루 5건" 고정 쿼터라 원문 건수가 항상 균일해
    // 분포·추세로서 아무 정보가 없다. 반면 TOP3는 AI가 매일 고른
    // 편집 판단이라 분야별로 실제 변동한다.
    const prev = previousRange(start, end)

    const { data: rawPrevTrends } = await supabase
      .from('news_trends')
      .select('top3, date')
      .gte('date', prev.start)
      .lte('date', prev.end)

    const categories: CategoryStat[] = buildCategoryStats(
      topPicks(trends),
      topPicks(rawPrevTrends ?? [])
    )

    const { error: upsertErr } = await supabase.from('weekly_reports').upsert(
      {
        period_type: periodType,
        week_start: start,
        week_end: end,
        summary: parsed.summary,
        categories,
        insights: parsed.insights,
        next_focus: parsed.next_focus,
        raw_data: { sections: parsed.sections ?? [] },
      },
      { onConflict: 'period_type,week_start' }
    )

    if (upsertErr) {
      console.error('[reports/generate] upsert error:', upsertErr)
      return {
        ok: false,
        error: 'upsert_error',
        detail: upsertErr.message,
        status: 500,
      }
    }

    return {
      ok: true,
      period_type: periodType,
      week_start: start,
      week_end: end,
    }
  } catch (err) {
    console.error('[reports/generate] unexpected error:', err)
    return {
      ok: false,
      error: 'internal_error',
      detail: String(err),
      status: 500,
    }
  }
}
