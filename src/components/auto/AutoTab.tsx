import { AutoSubNav } from './AutoSubNav'
import { AutoBriefing } from './AutoBriefing'
import { AutoCompetitors } from './AutoCompetitors'
import { AutoReports } from './AutoReports'
import type { AutoView } from './href'

export const revalidate = 300

export interface AutoTabParams {
  view?: string
  date?: string
  topic?: string
  brand?: string
  period?: string
  report?: string
}

/** `?tab=auto` — 자동차 인사이트. 데이터는 news_cards 와 완전히 분리된 auto_* 테이블. */
export async function AutoTab({ params }: { params: AutoTabParams }) {
  const view: AutoView =
    params.view === 'competitors' || params.view === 'reports'
      ? params.view
      : 'briefing'

  return (
    <div className="flex flex-col gap-6">
      <AutoSubNav view={view} />
      {view === 'briefing' && (
        <AutoBriefing
          date={params.date}
          topic={params.topic}
          brand={params.brand}
        />
      )}
      {view === 'competitors' && <AutoCompetitors />}
      {view === 'reports' && (
        <AutoReports period={params.period} report={params.report} />
      )}
    </div>
  )
}
