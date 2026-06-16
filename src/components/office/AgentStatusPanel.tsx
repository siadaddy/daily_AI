'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agent } from '@/lib/types'

export function AgentStatusPanel() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('agents')
      .select('*')
      .order('id')
      .then(({ data }) => setAgents(data ?? []))

    const channel = supabase
      .channel('agents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        supabase
          .from('agents')
          .select('*')
          .order('id')
          .then(({ data }) => setAgents(data ?? []))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const onlineCount = agents.filter((a) => a.status === 'online').length

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          🤖 AI 크루 상태
        </h3>
        <span className="badge badge-green animate-blink">
          {onlineCount}/{agents.length} ONLINE
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 rounded-xl p-2"
            style={{ background: 'var(--glass)' }}
          >
            <span className="text-xl">{agent.avatar ?? '🤖'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {agent.name}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>
                {agent.current_task ?? agent.role}
              </p>
            </div>
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                background:
                  agent.status === 'online'
                    ? 'var(--green)'
                    : agent.status === 'idle'
                      ? 'var(--gold)'
                      : 'var(--muted)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
