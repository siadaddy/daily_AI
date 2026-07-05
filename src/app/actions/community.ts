'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  LIMITS,
  validateText,
  isValidContentKey,
  publicDbError,
} from '@/lib/utils/validation'

export async function signUp(
  email: string,
  password: string,
  nickname: string
) {
  const nick = validateText(nickname, '닉네임', LIMITS.nickname)
  if (nick.error) return { error: nick.error }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname: nick.value } },
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { error: null }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}

export async function createPost(title: string, content: string) {
  const t = validateText(title, '제목', LIMITS.postTitle)
  if (t.error) return { error: t.error }
  const c = validateText(content, '내용', LIMITS.postContent)
  if (c.error) return { error: c.error }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다' }

  const nickname =
    (user.user_metadata?.nickname as string) ??
    user.email?.split('@')[0] ??
    '익명'

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ user_id: user.id, nickname, title: t.value, content: c.value })
    .select()
    .single()

  const publicError = publicDbError(error, 'createPost')
  if (publicError) return { error: publicError }
  return { error: null, post: data }
}

export async function deletePost(postId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다' }

  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  return { error: publicDbError(error, 'deletePost') }
}

export async function createComment(postId: number, content: string) {
  const c = validateText(content, '댓글', LIMITS.comment)
  if (c.error) return { error: c.error }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다' }

  const nickname =
    (user.user_metadata?.nickname as string) ??
    user.email?.split('@')[0] ??
    '익명'

  const { error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, user_id: user.id, nickname, content: c.value })

  return { error: publicDbError(error, 'createComment') }
}

// ── 인라인 좋아요/댓글 (content_likes, content_comments) ──────────

export async function toggleLike(
  contentKey: string
): Promise<{ error: string | null }> {
  if (!isValidContentKey(contentKey)) return { error: '잘못된 요청입니다' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const { data: existing } = await supabase
    .from('content_likes')
    .select('id')
    .eq('content_key', contentKey)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('content_likes')
      .delete()
      .eq('id', existing.id)
    return { error: publicDbError(error, 'toggleLike:delete') }
  } else {
    const { error } = await supabase
      .from('content_likes')
      .insert({ content_key: contentKey, user_id: user.id })
    return { error: publicDbError(error, 'toggleLike:insert') }
  }
}

export async function addComment(
  contentKey: string,
  comment: string
): Promise<{ error: string | null }> {
  if (!isValidContentKey(contentKey)) return { error: '잘못된 요청입니다' }
  const c = validateText(comment, '댓글', LIMITS.comment)
  if (c.error) return { error: c.error }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const nickname =
    (user.user_metadata?.nickname as string) ??
    user.email?.split('@')[0] ??
    '익명'

  const { error } = await supabase.from('content_comments').insert({
    content_key: contentKey,
    user_id: user.id,
    nickname,
    comment: c.value,
  })

  return { error: publicDbError(error, 'addComment') }
}

export async function deleteComment(
  commentId: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const { error } = await supabase
    .from('content_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  return { error: publicDbError(error, 'deleteComment') }
}
