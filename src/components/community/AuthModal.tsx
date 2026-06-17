'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/app/actions/community'

interface Props {
  onClose: () => void
}

export function AuthModal({ onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    startTransition(async () => {
      const result =
        mode === 'login'
          ? await signIn(email, password)
          : await signUp(email, password, nickname)

      if (result.error) {
        setErrorMsg(result.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-sm p-6">
        {/* 탭 */}
        <div
          className="mb-6 flex gap-1 rounded-lg p-1"
          style={{ background: 'var(--surface)' }}
        >
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setErrorMsg('')
              }}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
              style={{
                background: mode === m ? 'var(--card)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--muted)',
              }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="닉네임 (1~20자)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              required
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          />

          {errorMsg && (
            <p className="text-xs" style={{ color: 'var(--red)' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent2)', color: '#fff' }}
          >
            {isPending
              ? '처리 중...'
              : mode === 'login'
                ? '로그인'
                : '가입하기'}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs"
          style={{ color: 'var(--muted)' }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
