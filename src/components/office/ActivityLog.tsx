'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog as ActivityLogType } from '@/lib/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogType[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setLogs((data ?? []).reverse()))

    const channel = supabase
      .channel('logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        ({ new: newRow }) => {
          setLogs((prev) => [...prev.slice(-49), newRow as ActivityLogType])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      className="flex h-64 flex-col overflow-hidden rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="border-b p-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          📋 실시간 활동 로그
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono">
        {logs.map((log) => (
          <div key={log.id} className="mb-1 flex gap-2 text-xs animate-fade-in">
            <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
              {dayjs(log.created_at).format('HH:mm:ss')}
            </span>
            <span style={{ color: 'var(--bmw-lt)', flexShrink: 0 }}>[{log.agent_name}]</span>
            <span style={{ color: 'var(--text)' }}>{log.action}</span>
            {log.detail && (
              <span style={{ color: 'var(--muted2)' }}>— {log.detail}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
