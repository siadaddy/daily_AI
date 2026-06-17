'use client'

import { useEffect, useTransition } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import { createClient } from '@/lib/supabase/client'
import { deletePost } from '@/app/actions/community'
import { CommentList } from '@/components/community/CommentList'
import type { CommunityPost } from '@/lib/types'

dayjs.extend(relativeTime)
dayjs.locale('ko')

const fetcher = async (postId: number): Promise<CommunityPost | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) return null
  return data
}

interface Props {
  postId: number
  currentUserId: string | null
  onBack: () => void
  onAuthRequired: () => void
}

export function PostDetail({
  postId,
  currentUserId,
  onBack,
  onAuthRequired,
}: Props) {
  const { data: post, isLoading } = useSWR<CommunityPost | null>(
    `community-post-${postId}`,
    () => fetcher(postId)
  )

  const [isDeleting, startDeleteTransition] = useTransition()

  // 조회수 증가
  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('increment_post_view', { p_id: postId }).then(() => {})
  }, [postId])

  function handleDelete() {
    if (!confirm('정말 삭제하시겠어요?')) return
    startDeleteTransition(async () => {
      const result = await deletePost(postId)
      if (result.error) {
        alert(result.error)
      } else {
        onBack()
      }
    })
  }

  if (isLoading) {
    return (
      <div className="glass-card flex flex-col gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 animate-pulse rounded"
            style={{ background: 'var(--card)' }}
          />
        ))}
      </div>
    )
  }

  if (!post) {
    return (
      <div
        className="glass-card p-6 text-center text-sm"
        style={{ color: 'var(--muted)' }}
      >
        게시글을 찾을 수 없어요.
        <button type="button" onClick={onBack} className="ml-2 underline">
          목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card flex flex-col gap-6 p-6">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm transition-colors hover:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          ← 목록
        </button>

        {currentUserId === post.user_id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: 'var(--red)' }}
          >
            {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
          </button>
        )}
      </div>

      {/* 게시글 본문 */}
      <div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)' }}>
          {post.title}
        </h1>
        <div
          className="mb-4 flex items-center gap-2 text-xs"
          style={{ color: 'var(--muted)' }}
        >
          <span className="font-medium" style={{ color: 'var(--accent2)' }}>
            {post.nickname}
          </span>
          <span>·</span>
          <span>{dayjs(post.created_at).fromNow()}</span>
          <span>·</span>
          <span>조회 {post.view_count}</span>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text)' }}
          >
            {post.content}
          </p>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      {/* 댓글 */}
      <CommentList
        postId={postId}
        currentUserId={currentUserId}
        onAuthRequired={onAuthRequired}
      />
    </div>
  )
}
