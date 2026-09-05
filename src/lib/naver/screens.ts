import { unstable_cache } from 'next/cache'

/**
 * GitHub Actions가 매일 찍어 올리는 사이트 화면 캡처.
 * `scripts/capture-site.mjs`가 같은 경로에 manifest.json을 함께 올린다.
 */
export interface Shot {
  key: string
  viewport: 'mobile' | 'desktop'
  width: number
  height: number
  bytes: number
  url: string
}

export interface ScreenManifest {
  date: string
  capturedAt: string
  shots: Shot[]
}

/** 캡처 키를 사람이 읽는 이름으로 */
export function shotLabel(key: string): string {
  if (key.startsWith('card-')) {
    const n = key.slice(5)
    return n === '01' ? '리드 기사' : `카드 ${n}`
  }
  return (
    {
      summary: '발행 정보',
      top3: '오늘의 TOP 3',
      talking: '대화 소재',
      editorial: '편집장 리뷰',
    }[key] ?? key
  )
}

/** 지면 순서대로 정렬 — 캡처 순서가 곧 화면 순서다 */
const ORDER = ['summary', 'card-', 'top3', 'talking', 'editorial']
export function sortShots(shots: Shot[]): Shot[] {
  const rank = (k: string) => {
    const i = ORDER.findIndex((o) => k.startsWith(o))
    return i === -1 ? ORDER.length : i
  }
  return [...shots].sort(
    (a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key)
  )
}

export const fetchScreens = unstable_cache(
  async (date: string): Promise<ScreenManifest | null> => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!base) return null
    const url = `${base}/storage/v1/object/public/card-images/screens/${date}/manifest.json`
    try {
      const res = await fetch(url, { cache: 'no-store' })
      // 아직 캡처 전이면 404 — 오류가 아니라 정상 상태다
      if (!res.ok) return null
      return (await res.json()) as ScreenManifest
    } catch (e) {
      console.error('[naver/screens] manifest 조회 실패:', e)
      return null
    }
  },
  ['naver-screens'],
  { revalidate: 300 }
)
