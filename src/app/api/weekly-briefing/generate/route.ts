import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { createClient } from '@/lib/supabase/server'

dayjs.extend(utc)
dayjs.extend(timezone)

export const maxDuration = 60

interface NewsCard {
  title: string
  category: string | null
  date: string | null
}

interface NewsTrend {
  top3: string[] | null
  date: string | null
}

interface BriefingJson {
  summary: string
  categories: { name: string; count: number; trend: 'up' | 'down' | 'flat' }[]
  insights: string
  next_focus: string[]
}

function buildPrompt(
  weekStart: string,
  weekEnd: string,
  cards: NewsCard[],
  trends: NewsTrend[],
): string {
  const cardLines = cards
    .map((c) => `[${c.date ?? ''}] [${c.category ?? '기타'}] ${c.title}`)
    .join('\n')

  const trendLines = trends
    .map((t) => {
      const top = (t.top3 ?? []).join(' / ')
      return `[${t.date ?? ''}] TOP3: ${top}`
    })
    .join('\n')

  return `당신은 한국 AI 뉴스 분석 전문가입니다.
아래는 ${weekStart} ~ ${weekEnd}에 수집된 뉴스 기사 목록과 일별 트렌드 분석입니다.

=== 수집 기사 (총 ${cards.length}건) ===
${cardLines || '(데이터 없음)'}

=== 일별 TOP3 트렌드 ===
${trendLines || '(데이터 없음)'}

아래 JSON 형식으로만 응답하세요. 코드블록 없이 순수 JSON만 출력하세요:
{
  "summary": "이번 주를 관통하는 3-4문장 핵심 요약 (한국어)",
  "categories": [
    {"name": "카테고리명", "count": 숫자, "trend": "up|down|flat"}
  ],
  "insights": "편집장 시각의 심층 인사이트 2-3문장 (한국어)",
  "next_focus": ["다음 주 주목할 포인트 1", "포인트 2", "포인트 3"]
}`
}

function extractJson(text: string): string {
  // Strip possible markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Find first { … } block
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text.trim()
}

async function handler(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'missing_api_key' }, { status: 500 })
  }

  const now = dayjs().tz('Asia/Seoul')
  const weekEnd = now.subtract(1, 'day').startOf('day')
  const weekStart = weekEnd.subtract(6, 'day').startOf('day')
  const startStr = weekStart.format('YYYY-MM-DD')
  const endStr = weekEnd.format('YYYY-MM-DD')

  try {
    const supabase = await createClient()

    const [
      { data: rawCards, error: cardsErr },
      { data: rawTrends, error: trendsErr },
    ] = await Promise.all([
      supabase
        .from('news_cards')
        .select('title, category, date')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })
        .limit(200),
      supabase
        .from('news_trends')
        .select('top3, date')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true }),
    ])

    if (cardsErr) {
      console.error('[weekly-briefing] news_cards query error:', cardsErr)
      return NextResponse.json({ error: 'db_error', detail: cardsErr.message }, { status: 500 })
    }
    if (trendsErr) {
      console.error('[weekly-briefing] news_trends query error:', trendsErr)
      return NextResponse.json({ error: 'db_error', detail: trendsErr.message }, { status: 500 })
    }

    const cards: NewsCard[] = rawCards ?? []
    const trends: NewsTrend[] = rawTrends ?? []

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(startStr, endStr, cards, trends) }],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    if (!rawText) {
      console.error('[weekly-briefing] OpenAI returned no content:', completion.choices)
      return NextResponse.json({ error: 'empty_response' }, { status: 500 })
    }

    let parsed: BriefingJson
    try {
      parsed = JSON.parse(extractJson(rawText)) as BriefingJson
    } catch (parseErr) {
      console.error('[weekly-briefing] JSON parse failed:', parseErr, '\nRaw:', rawText)
      return NextResponse.json({ error: 'parse_error' }, { status: 500 })
    }

    const { error: upsertErr } = await supabase.from('weekly_reports').upsert(
      {
        week_start: startStr,
        week_end: endStr,
        summary: parsed.summary,
        categories: parsed.categories,
        insights: parsed.insights,
        next_focus: parsed.next_focus,
      },
      { onConflict: 'week_start' },
    )

    if (upsertErr) {
      console.error('[weekly-briefing] upsert error:', upsertErr)
      return NextResponse.json({ error: 'upsert_error', detail: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, week_start: startStr, week_end: endStr })
  } catch (err) {
    console.error('[weekly-briefing] unexpected error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Vercel Cron calls GET; POST is also accepted for manual triggering
export { handler as GET, handler as POST }
