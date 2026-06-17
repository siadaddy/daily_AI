'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/app/actions/community'

const AuthModal = dynamic(
  () => import('@/components/community/AuthModal').then((m) => ({ default: m.AuthModal })),
  { loading: () => null }
)

export function UserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const nickname =
    (user?.user_metadata?.nickname as string) ??
    user?.email?.split('@')[0] ??
    '사용자'

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--muted2)' }}
        >
          로그인
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown((p) => !p)}
        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--bmw-lt)' }}
      >
        <span>👤</span>
        <span>{nickname}</span>
        <span style={{ color: 'var(--muted)', fontSize: '9px' }}>▾</span>
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-xl p-1 shadow-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <form action={signOut}>
            <button
              type="submit"
              onClick={() => setShowDropdown(false)}
              className="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:opacity-70"
              style={{ color: 'var(--muted2)' }}
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
