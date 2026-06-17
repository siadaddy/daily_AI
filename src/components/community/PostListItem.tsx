'use client'

import { memo } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import type { CommunityPost } from '@/lib/types'

dayjs.extend(relativeTime)
dayjs.locale('ko')

interface Props {
  post: CommunityPost & { comment_count?: number }
  index: number
  onClick: (id: number) => void
}

export const PostListItem = memo(function PostListItem({
  post,
  index,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(post.id)}
      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-white/5"
      style={{ borderColor: 'var(--border)' }}
    >
      <span
        className="w-8 shrink-0 text-center text-xs"
        style={{ color: 'var(--muted2)' }}
      >
        {index + 1}
      </span>

      <span
        className="min-w-0 flex-1 truncate text-sm font-medium"
        style={{ color: 'var(--text)' }}
      >
        {post.title}
      </span>

      <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>
        {post.nickname}
      </span>

      <span
        className="flex shrink-0 items-center gap-1 text-xs"
        style={{ color: 'var(--accent2)' }}
      >
        <span>💬</span>
        <span>{post.comment_count ?? 0}</span>
      </span>

      <span
        className="w-16 shrink-0 text-right text-xs"
        style={{ color: 'var(--muted)' }}
      >
        {dayjs(post.created_at).fromNow()}
      </span>
    </button>
  )
})
