import { NextResponse } from 'next/server'

export const revalidate = 1800 // 30분 캐시

export async function GET() {
  try {
    const [weatherRes, airRes] = await Promise.all([
      fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weathercode&timezone=Asia%2FSeoul'
      ),
      fetch(
        'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.5665&longitude=126.9780&current=pm2_5&timezone=Asia%2FSeoul'
      ),
    ])

    const weather = await weatherRes.json()
    const air = await airRes.json()

    return NextResponse.json({
      temp: Math.round(weather.current.temperature_2m),
      code: weather.current.weathercode,
      pm25: Math.round(air.current.pm2_5),
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
