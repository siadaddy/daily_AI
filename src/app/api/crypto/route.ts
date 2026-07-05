import { NextResponse } from 'next/server'

export const revalidate = 300 // 5분 캐시

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=krw&include_24hr_change=true',
      { headers: { Accept: 'application/json' } }
    )
    const data = await res.json()
    const btc = data?.bitcoin
    const eth = data?.ethereum
    return NextResponse.json({
      btc: {
        krw: Math.round(btc?.krw ?? 0),
        change: Math.round((btc?.krw_24h_change ?? 0) * 10) / 10,
      },
      eth: {
        krw: Math.round(eth?.krw ?? 0),
        change: Math.round((eth?.krw_24h_change ?? 0) * 10) / 10,
      },
    })
  } catch {
    return NextResponse.json(
      { btc: { krw: 0, change: 0 }, eth: { krw: 0, change: 0 } },
      { status: 500 }
    )
  }
}
