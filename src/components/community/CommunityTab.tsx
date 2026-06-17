'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/community'
import { PostList } from '@/components/community/PostList'
import { PostDetail } from '@/components/community/PostDetail'
import type { User } from '@supabase/supabase-js'

const AuthModal = dynamic(
  () =>
    import('@/components/community/AuthModal').then((m) => ({
      default: m.AuthModal,
    })),
  { ssr: false }
)

const WriteForm = dynamic(
  () =>
    import('@/components/community/WriteForm').then((m) => ({
      default: m.WriteForm,
    })),
  { ssr: false }
)

type View = 'list' | 'detail' | 'write'

export function CommunityTab() {
  const [view, setView] = useState<View>('list')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleSelectPost(id: number) {
    setSelectedPostId(id)
    setView('detail')
  }

  function handleWriteClick() {
    if (!user) {
      setShowAuth(true)
    } else {
      setView('write')
    }
  }

  const nickname =
    (user?.user_metadata?.nickname as string) ?? user?.email?.split('@')[0]

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 바 */}
      <div className="flex items-center justify-between">
        <h2
          className="flex items-center gap-2 text-lg font-bold"
          style={{ color: 'var(--text)' }}
        >
          <span style={{ color: 'var(--accent2)' }}>💬</span>
          커뮤니티
        </h2>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {nickname}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
                style={{ color: 'var(--muted)' }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="rounded-lg px-3 py-1.5 text-xs transition-colors"
              style={{
                background: 'var(--surface)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              로그인
            </button>
          )}

          {view === 'list' && (
            <button
              type="button"
              onClick={handleWriteClick}
              className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent2)', color: '#fff' }}
            >
              ✏️ 글쓰기
            </button>
          )}
        </div>
      </div>

      {/* 뷰 */}
      {view === 'list' && <PostList onSelectPost={handleSelectPost} />}

      {view === 'detail' && selectedPostId !== null && (
        <PostDetail
          postId={selectedPostId}
          currentUserId={user?.id ?? null}
          onBack={() => setView('list')}
          onAuthRequired={() => setShowAuth(true)}
        />
      )}

      {view === 'write' && (
        <WriteForm
          onBack={() => setView('list')}
          onSuccess={() => setView('list')}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
