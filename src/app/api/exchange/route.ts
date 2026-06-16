import { NextResponse } from 'next/server'

export const revalidate = 3600 // 1시간 캐시

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    const krw = Math.round(data.rates?.KRW ?? 0)
    return NextResponse.json({ krw })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
