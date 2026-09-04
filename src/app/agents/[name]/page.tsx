import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Sparkles, BookOpen, ArrowLeft, CalendarDays } from 'lucide-react'
import { SiteShell } from '@/components/layout/SiteShell'
import {
  fetchAgentMemories,
  fetchAgentMemory,
  getAgentRole,
} from '@/lib/agents/memory'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

export async function generateStaticParams() {
  const agents = await fetchAgentMemories()
  return agents.map((a) => ({ name: encodeURIComponent(a.agent_name) }))
}

function decode(raw: string): string | null {
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name: raw } = await params
  const name = decode(raw)
  if (!name) return {}

  const agent = await fetchAgentMemory(name)
  if (!agent) return {}

  const { role } = getAgentRole(name)
  const title = `${name} — ${role} AI의 성장 일기`
  const description =
    agent.persona ??
    `${name}이(가) ${agent.diary.length}편의 일기로 남긴 성장 기록.`

  const canonical = `/agents/${encodeURIComponent(name)}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  }
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name: raw } = await params
  const name = decode(raw)
  if (!name) notFound()

  const agent = await fetchAgentMemory(name)
  if (!agent) notFound()

  const { role, emoji } = getAgentRole(name)
  const base = getSiteUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: base },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI 에이전트',
            item: `${base}/agents`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name,
            item: `${base}/agents/${encodeURIComponent(name)}`,
          },
        ],
      },
      {
        '@type': 'Person',
        name,
        jobTitle: role,
        description: agent.persona ?? undefined,
        url: `${base}/agents/${encodeURIComponent(name)}`,
        // 사람이 아니라 소프트웨어 에이전트임을 명시
        additionalType: 'https://schema.org/SoftwareApplication',
      },
    ],
  }

  return (
    <SiteShell activeTab={null}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-8">
        <Link href="/agents" className="kicker flex w-fit items-center gap-1.5">
          <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" />
          에이전트 목록
        </Link>

        <header className="flex flex-col gap-4 border-t-2 border-[var(--text)] pt-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{emoji}</span>
            <div className="flex flex-col gap-1">
              <span className="kicker kicker-accent">{role}</span>
              <h1 className="ed-display text-[clamp(1.75rem,4vw,2.5rem)]">
                {name}
              </h1>
            </div>
          </div>

          {agent.persona && (
            <blockquote
              className="border-l-2 border-[var(--accent)] py-1 pl-4 font-[family-name:var(--font-serif)] leading-relaxed italic"
              style={{ color: 'var(--text)' }}
            >
              “{agent.persona}”
              {agent.persona_updated_at && (
                <span className="kicker mt-2 block not-italic">
                  페르소나 갱신 {agent.persona_updated_at}
                </span>
              )}
            </blockquote>
          )}

          <div
            className="flex gap-5 border-t border-[var(--rule)] pt-3 font-[family-name:var(--font-mono)] text-xs tabular-nums"
            style={{ color: 'var(--muted)' }}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} strokeWidth={2} />
              성장 점수 {agent.growth_score ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} strokeWidth={2} />
              일기 {agent.diary.length}편
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="ed-section-title border-t border-[var(--rule)] pt-4 text-[1.125rem]">
            성장 일기
          </h2>
          <ol className="flex flex-col">
            {agent.diary.map((entry, i) => (
              <li
                key={`${entry.date}-${i}`}
                className="flex flex-col gap-2 border-b border-[var(--rule)] px-1 py-4"
              >
                <div className="kicker flex items-center gap-2">
                  <CalendarDays size={12} strokeWidth={2} aria-hidden="true" />
                  <time dateTime={entry.date}>{entry.date}</time>
                  {entry.trigger && (
                    <span className="rounded-sm border border-[var(--border)] px-2 py-0.5">
                      {entry.trigger}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text)' }}
                >
                  {entry.lesson}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </SiteShell>
  )
}
