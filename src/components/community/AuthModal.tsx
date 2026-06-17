'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  onClose: () => void
}

function makeSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function toKoreanError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다'
  if (msg.includes('Email not confirmed')) return '이메일 인증이 필요합니다. 가입 시 받은 메일을 확인해주세요'
  if (msg.includes('User already registered')) return '이미 가입된 이메일입니다. 로그인을 시도해보세요'
  if (msg.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 합니다'
  if (msg.includes('Unable to validate email')) return '유효하지 않은 이메일 형식입니다'
  return msg
}

export function AuthModal({ onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    startTransition(async () => {
      const supabase = makeSupabase()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setErrorMsg(toKoreanError(error.message))
        } else {
          router.refresh()
          onClose()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname } },
        })
        if (error) {
          setErrorMsg(toKoreanError(error.message))
        } else if (data.user && !data.session) {
          // 이메일 인증 필요한 경우
          setSuccessMsg('가입 완료! 이메일로 인증 링크가 발송되었습니다. 확인 후 로그인해주세요.')
        } else {
          router.refresh()
          onClose()
        }
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
                setSuccessMsg('')
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
            <p className="text-xs" style={{ color: 'var(--red, #ef4444)' }}>
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="text-xs" style={{ color: '#22c55e' }}>
              {successMsg}
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
