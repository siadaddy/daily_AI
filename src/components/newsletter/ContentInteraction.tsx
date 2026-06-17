'use client'

import { memo, useState, useEffect, useTransition, useRef } from 'react'
import useSWR from 'swr'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { toggleLike, addComment, deleteComment } from '@/app/actions/community'

interface Comment {
  id: number
  user_id: string
  nickname: string
  comment: string
  created_at: string
}

interface InteractionData {
  likeCount: number
  isLiked: boolean
  comments: Comment[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function makeSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// React.memo — Realtime 업데이트 시 LikeButton만 독립적으로 re-render
const LikeButton = memo(function LikeButton({
  contentKey,
  likeCount,
  isLiked,
  disabled,
  onToggle,
}: {
  contentKey: string
  likeCount: number
  isLiked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: isLiked ? 'rgba(239,68,68,0.12)' : 'var(--glass)',
        border: `1px solid ${isLiked ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
        color: isLiked ? '#ef4444' : 'var(--muted2)',
      }}
    >
      <span>{isLiked ? '❤️' : '🤍'}</span>
      <span>{likeCount}</span>
    </button>
  )
})

export function ContentInteraction({ contentKey }: { contentKey: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // 유저 상태
  useEffect(() => {
    const supabase = makeSupabase()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // SWR: likes + comments 패치 (client-swr-dedup)
  const { data, mutate } = useSWR<InteractionData>(
    `interaction:${contentKey}`,
    async () => {
      const supabase = makeSupabase()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const [likesRes, myLikeRes, commentsRes] = await Promise.all([
        supabase.from('content_likes').select('id', { count: 'exact', head: true }).eq('content_key', contentKey),
        currentUser
          ? supabase.from('content_likes').select('id').eq('content_key', contentKey).eq('user_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('content_comments').select('*').eq('content_key', contentKey).order('created_at', { ascending: true }),
      ])

      return {
        likeCount: likesRes.count ?? 0,
        isLiked: !!myLikeRes.data,
        comments: (commentsRes.data ?? []) as Comment[],
      }
    },
    { revalidateOnFocus: false }
  )

  // Realtime: 댓글 실시간 반영
  useEffect(() => {
    const supabase = makeSupabase()
    const channel = supabase
      .channel(`comments-${contentKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_comments', filter: `content_key=eq.${contentKey}` },
        () => mutate()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [contentKey, mutate])

  function handleLike() {
    if (!user) { alert('로그인 후 좋아요를 누를 수 있어요'); return }
    startTransition(async () => {
      // Optimistic update
      mutate(
        (prev) => prev
          ? { ...prev, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1, isLiked: !prev.isLiked }
          : prev,
        false
      )
      await toggleLike(contentKey)
      mutate()
    })
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    startTransition(async () => {
      const result = await addComment(contentKey, commentText.trim())
      if (!result.error) {
        setCommentText('')
        mutate()
      }
    })
  }

  function handleDelete(commentId: number) {
    startTransition(async () => {
      await deleteComment(commentId)
      mutate()
    })
  }

  const likeCount = data?.likeCount ?? 0
  const isLiked = data?.isLiked ?? false
  const comments = data?.comments ?? []

  return (
    <div
      className="flex flex-col gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
    >
      {/* 좋아요 + 댓글 토글 */}
      <div className="flex items-center gap-3">
        <LikeButton
          contentKey={contentKey}
          likeCount={likeCount}
          isLiked={isLiked}
          disabled={isPending}
          onToggle={handleLike}
        />
        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
          style={{
            background: showComments ? 'rgba(167,139,250,0.12)' : 'var(--glass)',
            border: `1px solid ${showComments ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
            color: showComments ? 'var(--accent2)' : 'var(--muted2)',
          }}
        >
          <span>💬</span>
          <span>댓글 {comments.length > 0 ? comments.length : ''}</span>
          <span style={{ fontSize: '9px', opacity: 0.7 }}>{showComments ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {comments.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>첫 댓글을 남겨보세요</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-0.5 shrink-0 text-xs font-semibold" style={{ color: 'var(--bmw-lt)' }}>
                  {c.nickname}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                  {c.comment}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="text-[10px] hover:opacity-70 disabled:opacity-40"
                    style={{ color: 'var(--muted)' }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* 댓글 입력 */}
          {user ? (
            <form onSubmit={handleComment} className="flex gap-2 pt-1">
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 남겨보세요..."
                maxLength={500}
                className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={isPending || !commentText.trim()}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent2)', color: '#fff' }}
              >
                {isPending ? '...' : '등록'}
              </button>
            </form>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              로그인 후 댓글을 남길 수 있어요
            </p>
          )}
        </div>
      )}
    </div>
  )
}
