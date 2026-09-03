import { createClient } from '@supabase/supabase-js'

/**
 * 쿠키/세션 없이 공개 데이터만 읽는 익명 클라이언트.
 * 빌드 타임 정적 생성(generateStaticParams, sitemap)과 캐시된 서버 조회용.
 * 인증이 필요한 경로에서는 `@/lib/supabase/server`를 사용할 것.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
