import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 86400 // 24h cache

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 })

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    console.error('YOUTUBE_API_KEY not configured')
    return NextResponse.json({ videoId: null }, { status: 200 })
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&key=${key}`
    const res = await fetch(url)
    if (!res.ok) return NextResponse.json({ videoId: null })
    const data = await res.json()
    const videoId = data.items?.[0]?.id?.videoId ?? null
    return NextResponse.json({ videoId })
  } catch {
    return NextResponse.json({ videoId: null })
  }
}
