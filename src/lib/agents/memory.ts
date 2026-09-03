import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

export interface DiaryEntry {
  date: string
  lesson: string
  trigger?: string
}

export interface AgentMemory {
  agent_name: string
  persona: string | null
  growth_score: number | null
  diary: DiaryEntry[]
  persona_updated_at: string | null
  updated_at: string | null
}

/** 파이프라인 에이전트별 역할 — agents 테이블이 비어 있어 이름으로 매핑한다 */
const ROLES: Record<string, { role: string; emoji: string }> = {
  박기획: { role: '콘텐츠 기획', emoji: '🧭' },
  이작가: { role: '카드뉴스·아티클 집필', emoji: '✍️' },
  최디자: { role: '카드 이미지 디자인', emoji: '🎨' },
  한뮤직: { role: '음악 큐레이션', emoji: '🎧' },
  AI주간트렌드: { role: '주간 트렌드 분석', emoji: '📈' },
}

export function getAgentRole(name: string): { role: string; emoji: string } {
  return ROLES[name] ?? { role: 'AI 에이전트', emoji: '🤖' }
}

function normalizeDiary(value: unknown): DiaryEntry[] {
  const raw =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value)
          } catch {
            return []
          }
        })()
      : value

  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is DiaryEntry =>
      !!e && typeof e === 'object' && typeof e.lesson === 'string'
  )
}

export const fetchAgentMemories = unstable_cache(
  async (): Promise<AgentMemory[]> => {
    const { data } = await createPublicClient()
      .from('agent_memories')
      .select(
        'agent_name, persona, growth_score, diary, persona_updated_at, updated_at'
      )
      .order('growth_score', { ascending: false })

    return (data ?? []).map((row) => ({
      agent_name: row.agent_name,
      persona: row.persona ?? null,
      growth_score: row.growth_score ?? null,
      diary: normalizeDiary(row.diary),
      persona_updated_at: row.persona_updated_at ?? null,
      updated_at: row.updated_at ?? null,
    }))
  },
  ['agent-memories'],
  { revalidate: 3600 }
)

export async function fetchAgentMemory(
  name: string
): Promise<AgentMemory | null> {
  const all = await fetchAgentMemories()
  return all.find((a) => a.agent_name === name) ?? null
}
