import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { fetchAutoReports } from '@/lib/auto/query'
import { TOPIC_LABEL } from '@/lib/auto/topics'
import type { AutoReport } from '@/lib/auto/types'
import { autoHref } from './href'

function ReportBody({ report }: { report: AutoReport }) {
  const c = report.content
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="kicker kicker-accent">
          {report.period_type === 'weekly' ? '주간' : '월간'} ·{' '}
          {report.period_start} ~ {report.period_end}
        </p>
        <h2 className="ed-headline text-[2rem]">{c.headline}</h2>
        <p className="ed-lede max-w-3xl">{c.summary}</p>
      </header>

      {/* 아래 수치는 코드가 집계한 값이다(AI 가 쓴 값이 아님) */}
      <section aria-label="집계" className="flex flex-col gap-3">
        <p className="kicker">
          기사 {c.stats.total}건 · 속보 {c.stats.breakingCount}건 (코드 집계)
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 font-[family-name:var(--font-mono)] text-xs tabular-nums">
          {c.stats.byTopic.map((t) => (
            <li key={t.topic}>
              {TOPIC_LABEL[t.topic]} <strong>{t.count}</strong>
            </li>
          ))}
        </ul>
      </section>

      {c.sections.map((s) => (
        <section key={s.topic} className="flex flex-col gap-3">
          <div className="ed-section-head">
            <h3 className="ed-section-title">{s.title}</h3>
          </div>
          <p className="ed-lede max-w-3xl whitespace-pre-line">{s.body}</p>
        </section>
      ))}

      {c.implications.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="ed-section-head">
            <h3 className="ed-section-title">서비스본부 시사점</h3>
            <span className="kicker kicker-accent">AI 해석 · 검토 필요</span>
          </div>
          <ol className="flex max-w-3xl list-decimal flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed">
            {c.implications.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ol>
        </section>
      )}

      {c.sources.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="ed-section-head">
            <h3 className="ed-section-title">근거 기사</h3>
            <span className="kicker">{c.sources.length}</span>
          </div>
          <ul className="flex flex-col gap-1.5 text-[0.8125rem]">
            {c.sources.map((s) => (
              <li key={s.link}>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {s.title}
                  <ArrowUpRight
                    size={11}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="ml-0.5 inline"
                    style={{ color: 'var(--muted)' }}
                  />
                </a>{' '}
                <span className="kicker">{s.source}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export async function AutoReports({
  period,
  report,
}: {
  period?: string
  report?: string
}) {
  const periodType = period === 'monthly' ? 'monthly' : 'weekly'
  const reports = await fetchAutoReports(periodType)
  const selected = reports.find((r) => r.period_start === report) ?? reports[0]

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="보고서 종류" className="flex gap-4">
        {(['weekly', 'monthly'] as const).map((p) => (
          <Link
            key={p}
            href={autoHref({ view: 'reports', period: p })}
            scroll={false}
            aria-current={periodType === p ? 'true' : undefined}
            className="kicker pb-1"
            style={{
              color: periodType === p ? 'var(--text)' : 'var(--muted)',
              borderBottom: `1px solid ${periodType === p ? 'var(--text)' : 'transparent'}`,
            }}
          >
            {p === 'weekly' ? '주간' : '월간'}
          </Link>
        ))}
      </nav>

      {!selected ? (
        <p className="ed-lede py-16 text-center">
          아직 생성된 {periodType === 'weekly' ? '주간' : '월간'} 보고서가
          없습니다. 주간 보고서는 매주 월요일, 월간 보고서는 매월 1일에
          만들어집니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_220px]">
          <ReportBody report={selected} />
          <aside aria-label="지난 보고서">
            <p className="kicker mb-3">지난 보고서</p>
            <ul className="flex flex-col gap-2 font-[family-name:var(--font-mono)] text-xs tabular-nums">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    href={autoHref({
                      view: 'reports',
                      period: periodType,
                      report: r.period_start,
                    })}
                    scroll={false}
                    aria-current={
                      r.period_start === selected.period_start
                        ? 'true'
                        : undefined
                    }
                    style={{
                      color:
                        r.period_start === selected.period_start
                          ? 'var(--text)'
                          : 'var(--muted)',
                    }}
                  >
                    {r.period_start}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  )
}
