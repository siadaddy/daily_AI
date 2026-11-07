import Link from 'next/link'
import { fetchAutoArticles, fetchAutoDates } from '@/lib/auto/query'
import {
  TOPIC_LABEL,
  TOPIC_ORDER,
  brandCounts,
  filterArticles,
  groupByTopic,
  isAutoTopic,
  pickLead,
} from '@/lib/auto/topics'
import { AutoArticleItem } from './AutoArticleItem'
import { autoHref } from './href'

const chip =
  'inline-block border px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] transition-colors'

function Chip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={chip}
      style={{
        borderColor: active ? 'var(--text)' : 'var(--rule)',
        color: active ? 'var(--text)' : 'var(--muted)',
      }}
    >
      {children}
    </Link>
  )
}

export async function AutoBriefing({
  date,
  topic,
  brand,
}: {
  date?: string
  topic?: string
  brand?: string
}) {
  const dates = await fetchAutoDates()
  const selected = date && dates.includes(date) ? date : dates[0]

  if (!selected) {
    return (
      <p className="ed-lede py-16 text-center">
        아직 수집된 자동차 뉴스가 없습니다. 첫 수집이 끝나면 이곳에 브리핑이
        나타납니다.
      </p>
    )
  }

  const all = await fetchAutoArticles(selected)
  const activeTopic = isAutoTopic(topic) ? topic : undefined
  const activeBrand =
    brand && all.some((r) => r.brands.includes(brand)) ? brand : undefined
  const filtered = filterArticles(all, {
    topic: activeTopic,
    brand: activeBrand,
  })
  const filtering = Boolean(activeTopic || activeBrand)

  // 필터가 없을 때만 '오늘의 핵심'을 따로 세운다 — 필터 중에는 중복이 된다
  const lead = filtering ? [] : pickLead(all, 3)
  const leadIds = new Set(lead.map((r) => r.id))
  const groups = groupByTopic(filtered.filter((r) => !leadIds.has(r.id)))
  const brands = brandCounts(all).slice(0, 10)
  const topicCount = (t: string) => all.filter((r) => r.topic === t).length

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="kicker kicker-accent">
          {selected} · 기사 {all.length}건
        </p>
        <h2 className="ed-headline text-[2rem]">오늘의 자동차 인사이트</h2>
        <p className="ed-lede max-w-3xl text-[0.875rem]">
          공개된 기사만 모아 AI 가 분류·요약했습니다. 요약과 시사점은 참고용이며
          보고에 쓰기 전에 원문을 확인하세요.
        </p>
      </header>

      {dates.length > 1 && (
        <nav aria-label="날짜 선택" className="flex flex-wrap gap-2">
          {dates.slice(0, 7).map((d) => (
            <Chip key={d} href={autoHref({ date: d })} active={d === selected}>
              {d.slice(5)}
            </Chip>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3">
        <nav aria-label="주제 필터" className="flex flex-wrap gap-2">
          <Chip
            href={autoHref({ date: selected, brand: activeBrand })}
            active={!activeTopic}
          >
            전체
          </Chip>
          {TOPIC_ORDER.filter((t) => topicCount(t) > 0).map((t) => (
            <Chip
              key={t}
              href={autoHref({ date: selected, topic: t, brand: activeBrand })}
              active={activeTopic === t}
            >
              {TOPIC_LABEL[t]} {topicCount(t)}
            </Chip>
          ))}
        </nav>
        {brands.length > 0 && (
          <nav aria-label="브랜드 필터" className="flex flex-wrap gap-2">
            <Chip
              href={autoHref({ date: selected, topic: activeTopic })}
              active={!activeBrand}
            >
              모든 브랜드
            </Chip>
            {brands.map((b) => (
              <Chip
                key={b.brand}
                href={autoHref({
                  date: selected,
                  topic: activeTopic,
                  brand: b.brand,
                })}
                active={activeBrand === b.brand}
              >
                {b.brand} {b.count}
              </Chip>
            ))}
          </nav>
        )}
      </div>

      {lead.length > 0 && (
        <section aria-labelledby="auto-lead" className="flex flex-col gap-6">
          <div className="ed-section-head">
            <h2 id="auto-lead" className="ed-section-title">
              오늘의 핵심
            </h2>
          </div>
          {lead.map((a, i) => (
            <AutoArticleItem key={a.id} article={a} lead={i === 0} />
          ))}
        </section>
      )}

      {filtered.length === 0 && (
        <p className="ed-lede py-10 text-center">
          조건에 맞는 기사가 없습니다.
        </p>
      )}

      {groups.map((g) => (
        <section
          key={g.topic}
          aria-labelledby={`auto-${g.topic}`}
          className="flex flex-col gap-5"
        >
          <div className="ed-section-head">
            <h2 id={`auto-${g.topic}`} className="ed-section-title">
              {TOPIC_LABEL[g.topic]}
            </h2>
            <span className="kicker">{g.rows.length}</span>
          </div>
          {g.rows.map((a) => (
            <AutoArticleItem key={a.id} article={a} />
          ))}
        </section>
      ))}
    </div>
  )
}
