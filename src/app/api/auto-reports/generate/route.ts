import { NextRequest, NextResponse } from 'next/server'
import { generateAutoReport, resolveAutoRange } from '@/lib/auto/report'

export const maxDuration = 60

/**
 * 자동차 인사이트 주간·월간 보고서 생성 (크론 + 수동 백필).
 * `Authorization: Bearer $CRON_SECRET` 필요 — /api/reports/generate 와 같은 규칙.
 * `?period=weekly|monthly[&start=YYYY-MM-DD]`
 */
async function handler(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const period =
    req.nextUrl.searchParams.get('period') === 'monthly' ? 'monthly' : 'weekly'
  const range = resolveAutoRange(period, req.nextUrl.searchParams.get('start'))
  if ('error' in range) {
    return NextResponse.json({ error: range.error }, { status: 400 })
  }

  const result = await generateAutoReport({
    periodType: period,
    start: range.start,
    end: range.end,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: result.status }
    )
  }
  return NextResponse.json(result)
}

// Vercel Cron 은 GET, 수동 트리거용 POST 도 허용
export { handler as GET, handler as POST }
