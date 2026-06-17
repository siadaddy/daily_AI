'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signUp(
  email: string,
  password: string,
  nickname: string
) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
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
    .insert({ user_id: user.id, nickname, title, content })
    .select()
    .single()

  if (error) return { error: error.message }
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

  if (error) return { error: error.message }
  return { error: null }
}

export async function createComment(postId: number, content: string) {
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
    .insert({ post_id: postId, user_id: user.id, nickname, content })

  if (error) return { error: error.message }
  return { error: null }
}
