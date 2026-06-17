'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { PostListItem } from '@/components/community/PostListItem'
import type { CommunityPost } from '@/lib/types'

type PostWithCount = CommunityPost & { comment_count: number }

const fetcher = async (): Promise<PostWithCount[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, community_comments(count)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    comment_count:
      (row.community_comments as unknown as [{ count: number }])?.[0]?.count ??
      0,
  }))
}

interface Props {
  onSelectPost: (id: number) => void
}

export function PostList({ onSelectPost }: Props) {
  const {
    data: posts = [],
    mutate,
    isLoading,
  } = useSWR<PostWithCount[]>('community-posts', fetcher)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('community-posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        () => {
          mutate()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_posts' },
        () => {
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-11 animate-pulse rounded-lg"
            style={{ background: 'var(--card)' }}
          />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div
        className="py-16 text-center text-sm"
        style={{ color: 'var(--muted)' }}
      >
        아직 게시글이 없어요. 첫 글을 남겨보세요!
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-3 border-b px-4 py-2"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <span
          className="w-8 text-center text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          #
        </span>
        <span
          className="flex-1 text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          제목
        </span>
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          닉네임
        </span>
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          댓글
        </span>
        <span
          className="w-16 text-right text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          날짜
        </span>
      </div>

      {posts.map((post, i) => (
        <PostListItem
          key={post.id}
          post={post}
          index={i}
          onClick={onSelectPost}
        />
      ))}
    </div>
  )
}
