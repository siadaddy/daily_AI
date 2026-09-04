'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const AuthModal = dynamic(
  () =>
    import('@/components/community/AuthModal').then((m) => ({
      default: m.AuthModal,
    })),
  { loading: () => null }
)

/**
 * 브라우저 클라이언트는 첫 호출 때 만든다.
 *
 * 모듈 스코프에서 즉시 만들거나 렌더 중(useState 초기화 포함)에 만들면
 * SSR·프리렌더에서도 실행된다. Supabase 환경변수가 없는 환경(env가 Production
 * 스코프로만 설정된 프리뷰 배포 등)에서는 @supabase/ssr이 그 자리에서 throw해
 * SiteShell을 쓰는 모든 정적 페이지의 빌드가 죽는다.
 *
 * 아래 getter는 이펙트·이벤트 핸들러에서만 불리므로 서버에서는 절대 실행되지
 * 않는다. NewsTicker·ContentInteraction·AuthModal이 쓰는 방식과 동일하다.
 */
let browserClient: ReturnType<typeof createClient> | null = null
function getSupabase() {
  browserClient ??= createClient()
  return browserClient
}

export function UserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--muted2)',
          }}
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
        type="button"
        onClick={() => setShowDropdown((p) => !p)}
        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
        style={{
          background: 'var(--glass)',
          border: '1px solid var(--border)',
          color: 'var(--brand-light)',
        }}
      >
        <span>👤</span>
        <span>{nickname}</span>
        <span style={{ color: 'var(--muted)', fontSize: '9px' }}>▾</span>
      </button>

      {showDropdown && (
        <div
          className="absolute top-full right-0 z-[200] mt-1 min-w-[120px] rounded-xl p-1 shadow-lg"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={async () => {
              setShowDropdown(false)
              await getSupabase().auth.signOut()
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--muted2)' }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
