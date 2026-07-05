import { NextResponse } from 'next/server'

export const revalidate = 300 // 5분 캐시

const TICKERS: Record<string, string> = {
  kospi: '%5EKS11',
  kosdaq: '%5EKQ11',
  nasdaq: '%5EIXIC',
  sp500: '%5EGSPC',
  vix: '%5EVIX',
  gold: 'GC%3DF',
  oil: 'CL%3DF',
  dxy: 'DX-Y.NYB',
}

async function fetchTicker(encoded: string) {
  const res = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)',
        Accept: 'application/json',
      },
    }
  )
  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) return { price: null, change: null }

  const price = Math.round((meta.regularMarketPrice ?? 0) * 100) / 100
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price
  const change = prev ? Math.round(((price - prev) / prev) * 1000) / 10 : 0
  return { price, change }
}

export async function GET() {
  try {
    const entries = await Promise.all(
      Object.entries(TICKERS).map(async ([key, encoded]) => {
        try {
          return [key, await fetchTicker(encoded)] as const
        } catch {
          return [key, { price: null, change: null }] as const
        }
      })
    )
    return NextResponse.json(Object.fromEntries(entries))
  } catch {
    const nullAll = Object.fromEntries(
      Object.keys(TICKERS).map((k) => [k, { price: null, change: null }])
    )
    return NextResponse.json(nullAll, { status: 500 })
  }
}
