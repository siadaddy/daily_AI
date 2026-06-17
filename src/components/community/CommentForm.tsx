'use client'

import { useState, useTransition } from 'react'
import { createComment } from '@/app/actions/community'

interface Props {
  postId: number
  onAuthRequired: () => void
  isLoggedIn: boolean
}

export function CommentForm({ postId, onAuthRequired, isLoggedIn }: Props) {
  const [content, setContent] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      onAuthRequired()
      return
    }
    setErrorMsg('')
    startTransition(async () => {
      const result = await createComment(postId, content)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setContent('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <textarea
          placeholder={
            isLoggedIn
              ? '댓글을 남겨보세요...'
              : '로그인 후 댓글을 작성할 수 있어요'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={2}
          required
          className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          onClick={() => !isLoggedIn && onAuthRequired()}
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="self-end rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent2)', color: '#fff' }}
        >
          {isPending ? '...' : '등록'}
        </button>
      </div>

      <div className="flex items-center justify-between">
        {errorMsg ? (
          <span className="text-xs" style={{ color: 'var(--red)' }}>
            {errorMsg}
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {content.length} / 500
        </span>
      </div>
    </form>
  )
}
