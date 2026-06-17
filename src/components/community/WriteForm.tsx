'use client'

import { useState, useTransition } from 'react'
import { createPost } from '@/app/actions/community'

interface Props {
  onBack: () => void
  onSuccess: () => void
}

export function WriteForm({ onBack, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    startTransition(async () => {
      const result = await createPost(title, content)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm transition-colors hover:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          ← 취소
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          새 글 작성
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="제목 (최대 100자)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />

        <textarea
          placeholder="내용을 입력하세요 (최대 3,000자)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={3000}
          required
          rows={10}
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {content.length} / 3,000
          </span>

          {errorMsg && (
            <span className="text-xs" style={{ color: 'var(--red)' }}>
              {errorMsg}
            </span>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/10"
              style={{ color: 'var(--muted)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !content.trim()}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent2)', color: '#fff' }}
            >
              {isPending ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
