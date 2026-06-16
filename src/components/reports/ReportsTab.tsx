import { createClient } from '@/lib/supabase/server'
import { WeeklyBriefing } from './WeeklyBriefing'
import { CardArchive } from './CardArchive'
import type { WeeklyReport, NewsCard } from '@/lib/types'
import dayjs from 'dayjs'

export const revalidate = 3600

async function fetchWeeklyReport(): Promise<WeeklyReport | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

async function fetchArchive(): Promise<NewsCard[]> {
  try {
    const supabase = await createClient()
    const since = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const { data } = await supabase
      .from('news_cards')
      .select('*')
      .gte('date', since)
      .eq('rank', 1)
      .order('date', { ascending: false })
      .limit(24)
    return data ?? []
  } catch {
    return []
  }
}

export async function ReportsTab() {
  const [report, archive] = await Promise.all([fetchWeeklyReport(), fetchArchive()])

  return (
    <div className="flex flex-col gap-8">
      {/* Weekly briefing */}
      <section>
        <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--text)' }}>
          📅 주간 트렌드 브리핑
        </h2>
        <WeeklyBriefing report={report} />
      </section>

      {/* Card archive */}
      <section>
        <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--text)' }}>
          📰 카드뉴스 아카이브 (최근 30일)
        </h2>
        <CardArchive cards={archive} />
      </section>
    </div>
  )
}
