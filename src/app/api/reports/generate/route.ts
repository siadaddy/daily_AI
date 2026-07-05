import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { generateReport } from '@/lib/reports/generate'
import type { PeriodType } from '@/lib/types'

dayjs.extend(utc)
dayjs.extend(timezone)

export const maxDuration = 60

// 기간 계산: start 미지정 시 "방금 끝난 기간"(주간=어제까지 7일, 월간=지난달)
// start 지정 시 과거 기간 백필/재생성 (주간=해당일부터 7일, 월간=해당 월)
function resolveRange(
  periodType: PeriodType,
  startParam: string | null
): { start: string; end: string } | { error: string } {
  if (startParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startParam)) {
      return { error: 'invalid_start' }
    }
    const start = dayjs(startParam)
    if (!start.isValid()) return { error: 'invalid_start' }

    if (periodType === 'weekly') {
      return {
        start: start.format('YYYY-MM-DD'),
        end: start.add(6, 'day').format('YYYY-MM-DD'),
      }
    }
    const monthStart = start.startOf('month')
    return {
      start: monthStart.format('YYYY-MM-DD'),
      end: monthStart.endOf('month').format('YYYY-MM-DD'),
    }
  }

  const now = dayjs().tz('Asia/Seoul')
  if (periodType === 'weekly') {
    const end = now.subtract(1, 'day').startOf('day')
    return {
      start: end.subtract(6, 'day').format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    }
  }
  const prevMonth = now.subtract(1, 'month')
  return {
    start: prevMonth.startOf('month').format('YYYY-MM-DD'),
    end: prevMonth.endOf('month').format('YYYY-MM-DD'),
  }
}

async function handler(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const rawPeriod = req.nextUrl.searchParams.get('period') ?? 'weekly'
  const periodType: PeriodType = rawPeriod === 'monthly' ? 'monthly' : 'weekly'

  const range = resolveRange(periodType, req.nextUrl.searchParams.get('start'))
  if ('error' in range) {
    return NextResponse.json({ error: range.error }, { status: 400 })
  }

  const result = await generateReport({
    periodType,
    start: range.start,
    end: range.end,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: result.status }
    )
  }

  return NextResponse.json({
    ok: true,
    period_type: result.period_type,
    week_start: result.week_start,
    week_end: result.week_end,
  })
}

// Vercel Cron은 GET으로 호출; 수동 트리거용 POST도 허용
export { handler as GET, handler as POST }
