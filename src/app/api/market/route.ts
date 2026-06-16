import { NextResponse } from 'next/server'

export const revalidate = 300 // 5분 캐시

export async function GET() {
  try {
    const res = await fetch(
      'https://query2.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)',
          Accept: 'application/json',
        },
      }
    )
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return NextResponse.json({ price: null, change: null })

    const price = Math.round(meta.regularMarketPrice ?? 0)
    const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = prev ? Math.round(((price - prev) / prev) * 1000) / 10 : 0
    return NextResponse.json({ price, change })
  } catch {
    return NextResponse.json({ price: null, change: null }, { status: 500 })
  }
}
