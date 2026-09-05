import { unstable_cache } from 'next/cache'

/**
 * GitHub Actions가 매일 찍어 올리는 사이트 화면 캡처 목록.
 *
 * manifest.json을 함께 올리려 했으나 card-images 버킷이 이미지 MIME만 받는다
 * (application/json → 415). 대신 스토리지 목록 API로 파일명을 읽고,
 * 파일명에 실어 둔 크기를 파싱한다: `{viewport}-{key}-{w}x{h}.png`
 */
const BUCKET = 'card-images'

export interface Shot {
  key: string
  viewport: 'mobile' | 'desktop'
  width: number
  height: number
  url: string
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

/** `mobile-card-01-358x971.png` → Shot */
export function parseShotName(name: string, publicBase: string): Shot | null {
  const m = name.match(/^(mobile|desktop)-(.+)-(\d+)x(\d+)\.png$/)
  if (!m) return null
  return {
    viewport: m[1] as Shot['viewport'],
    key: m[2],
    width: Number(m[3]),
    height: Number(m[4]),
    url: `${publicBase}/${name}`,
  }
}

export const fetchScreens = unstable_cache(
  async (date: string): Promise<Shot[]> => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!base || !key) return []

    const prefix = `screens/${date}`
    const publicBase = `${base}/storage/v1/object/public/${BUCKET}/${prefix}`

    try {
      const res = await fetch(`${base}/storage/v1/object/list/${BUCKET}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix, limit: 100 }),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`list ${res.status}`)
      const rows = (await res.json()) as { name: string }[]
      return rows
        .map((r) => parseShotName(r.name, publicBase))
        .filter((s): s is Shot => s !== null)
    } catch (e) {
      // 아직 캡처 전이거나 스토리지에 닿지 못한 것 — 페이지는 계속 떠야 한다
      console.error('[naver/screens] 캡처 목록 조회 실패:', e)
      return []
    }
  },
  ['naver-screens'],
  { revalidate: 300 }
)
