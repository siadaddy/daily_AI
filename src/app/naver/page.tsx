import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getToday } from '@/lib/dates'

/**
 * 북마크용 고정 주소. 날짜가 매일 바뀌므로 /naver 하나만 저장해 두면
 * 항상 그날 지면의 옮겨쓰기 화면으로 간다.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '네이버 블로그용 옮겨쓰기',
  robots: { index: false, follow: false },
}

export default function NaverTodayPage() {
  redirect(`/news/${getToday()}/naver`)
}
