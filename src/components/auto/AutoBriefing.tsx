import Link from 'next/link'
import {
  fetchAutoArticles,
  fetchAutoDates,
  fetchAutoDigest,
} from '@/lib/auto/query'
import {
  SECTION_VISIBLE,
  SECTION_VISIBLE_FILTERED,
  TOPIC_LABEL,
  TOPIC_ORDER,
  brandCounts,
  filterArticles,
  groupByTopic,
  isAutoTopic,
  pickLead,
} from '@/lib/auto/topics'
import type { AutoDigest } from '@/lib/auto/types'
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

/** AI 가 쓴 주제별(또는 하루 전체) 요약. 건수는 코드가 센 값이고, 문장은 AI 가 쓴 것이라 라벨로 밝힌다. */
function DigestBlock({ digest, label }: { digest: AutoDigest; label: string }) {
  if (!digest.headline && digest.points.length === 0) return null
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <p className="kicker kicker-accent">{label}</p>
      {digest.headline && (
        <p className="ed-display text-[1.0625rem] leading-snug">
          {digest.headline}
        </p>
      )}
      {digest.points.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {digest.points.map((pt, i) => (
            <li key={i} className="flex gap-2 text-[0.875rem] leading-relaxed">
              <span
                aria-hidden="true"
                className="font-[family-name:var(--font-mono)]"
                style={{ color: 'var(--muted)' }}
              >
                ·
              </span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
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

  const [all, digests] = await Promise.all([
    fetchAutoArticles(selected),
    fetchAutoDigest(selected),
  ])
  const digestOf = new Map(digests.map((d) => [d.topic, d]))
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

      {!filtering && digestOf.get('all') && (
        <section aria-label="오늘의 총평">
          <DigestBlock
            digest={digestOf.get('all')!}
            label="오늘의 총평 · AI 요약"
          />
        </section>
      )}

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

      {groups.map((g) => {
        const visible = activeTopic
          ? SECTION_VISIBLE_FILTERED
          : g.topic === 'other'
            ? 0
            : SECTION_VISIBLE
        const head = g.rows.slice(0, visible)
        const rest = g.rows.slice(visible)
        // 브랜드 필터 중에는 주제 요약이 필터 결과와 어긋나므로 쓰지 않는다
        const digest = activeBrand ? undefined : digestOf.get(g.topic)
        return (
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
            {digest && <DigestBlock digest={digest} label="AI 요약" />}
            {head.map((a) => (
              <AutoArticleItem key={a.id} article={a} />
            ))}
            {rest.length > 0 && (
              <details className="flex flex-col gap-5">
                <summary
                  className="kicker cursor-pointer border-t border-[var(--rule)] pt-4 select-none hover:underline"
                  style={{ color: 'var(--muted)' }}
                >
                  나머지 {rest.length}건 보기
                </summary>
                {rest.map((a) => (
                  <AutoArticleItem key={a.id} article={a} />
                ))}
              </details>
            )}
          </section>
        )
      })}
    </div>
  )
}
