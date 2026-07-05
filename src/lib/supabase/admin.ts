import { createClient } from '@supabase/supabase-js'

// service-role 클라이언트 — RLS를 우회하므로 Route Handler/Server Action 등
// 서버 코드에서만 import할 것. 'use client' 파일에서 절대 사용 금지.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
