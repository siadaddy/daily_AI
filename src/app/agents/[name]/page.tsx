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
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-6">
        <Link
          href="/agents"
          className="flex w-fit items-center gap-1.5 text-xs"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft size={13} strokeWidth={2} />
          에이전트 목록
        </Link>

        <header className="glass-card flex flex-col gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{emoji}</span>
            <div className="flex flex-col">
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text)' }}
              >
                {name}
              </h1>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {role}
              </span>
            </div>
          </div>

          {agent.persona && (
            <blockquote
              className="rounded-xl px-4 py-3 text-sm leading-relaxed italic"
              style={{
                background: 'var(--glass)',
                borderLeft: '3px solid var(--accent-purple)',
                color: 'var(--muted2)',
              }}
            >
              “{agent.persona}”
              {agent.persona_updated_at && (
                <span
                  className="mt-2 block text-[11px] not-italic"
                  style={{ color: 'var(--muted)' }}
                >
                  페르소나 갱신 {agent.persona_updated_at}
                </span>
              )}
            </blockquote>
          )}

          <div className="flex gap-5 text-xs" style={{ color: 'var(--muted)' }}>
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
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            성장 일기
          </h2>
          <ol className="flex flex-col gap-2">
            {agent.diary.map((entry, i) => (
              <li
                key={`${entry.date}-${i}`}
                className="glass-card flex flex-col gap-1.5 rounded-xl p-4"
              >
                <div
                  className="flex items-center gap-2 text-[11px]"
                  style={{ color: 'var(--muted)' }}
                >
                  <CalendarDays size={12} strokeWidth={2} />
                  <time dateTime={entry.date}>{entry.date}</time>
                  {entry.trigger && (
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        background: 'var(--glass)',
                        border: '1px solid var(--border)',
                      }}
                    >
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
