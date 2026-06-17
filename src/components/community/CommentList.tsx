'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import { createClient } from '@/lib/supabase/client'
import { CommentForm } from '@/components/community/CommentForm'
import type { CommunityComment } from '@/lib/types'

dayjs.extend(relativeTime)
dayjs.locale('ko')

const fetcher = async (postId: number): Promise<CommunityComment[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

interface Props {
  postId: number
  currentUserId: string | null
  onAuthRequired: () => void
}

export function CommentList({ postId, currentUserId, onAuthRequired }: Props) {
  const {
    data: comments = [],
    mutate,
    isLoading,
  } = useSWR<CommunityComment[]>(`community-comments-${postId}`, () =>
    fetcher(postId)
  )

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`community-comments-rt-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => mutate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, mutate])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        💬 댓글{' '}
        <span style={{ color: 'var(--accent2)' }}>
          {isLoading ? '...' : comments.length}
        </span>
      </h3>

      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div
          className="flex flex-col divide-y"
          style={{ borderColor: 'var(--border)' }}
        >
          {comments.map((c) => (
            <div key={c.id} className="py-3">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  {c.nickname}
                </span>
                {currentUserId === c.user_id && (
                  <span
                    className="rounded px-1 text-[10px]"
                    style={{
                      background: 'var(--accent2)20',
                      color: 'var(--accent2)',
                    }}
                  >
                    나
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {dayjs(c.created_at).fromNow()}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text)' }}
              >
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 댓글 작성 */}
      <CommentForm
        postId={postId}
        isLoggedIn={!!currentUserId}
        onAuthRequired={onAuthRequired}
      />
    </div>
  )
}
