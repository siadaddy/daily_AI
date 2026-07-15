---
title: "weekly_reports 테이블"
source_paths:
  - src/lib/types/index.ts
  - src/lib/reports/generate.ts
  - src/app/api/reports/generate/route.ts
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[reports-generate]]"
  - "[[reports]]"
---

# weekly_reports 테이블

## 내용
주간 **및** 월간 리포트를 한 테이블에 저장한다. `period_type` 컬럼(`'weekly' | 'monthly'`)으로
구분한다.

## 컬럼 (`src/lib/types/index.ts`의 `PeriodReport` 기준, `WeeklyReport`는 이 타입의 별칭)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `period_type` | `'weekly' \| 'monthly'` | 판별자 |
| `week_start` | string | 기간 시작일 (월간도 이 컬럼명을 그대로 씀 — 월의 시작일) |
| `week_end` | string | 기간 종료일 |
| `summary` | string | OpenAI가 생성한 3~5문장 요약 |
| `categories` | `CategoryStat[]` | `{ name, count, trend, deltaPct? }` |
| `insights` | string | 편집장 시각 인사이트 |
| `next_focus` | string[] | 다음 기간 주목 포인트 |
| `created_at` | string | |

## 제약조건
- Unique: `(period_type, week_start)` — [[reports-generate]]가 이 키로 upsert하므로 같은
  기간에 재생성해도 중복 행이 생기지 않는다.
- RLS: service-role만 쓰기 가능 — `createAdminClient()` 필수, 일반 서버 클라이언트로 upsert
  시도하면 실패한다.

## 쓰는 곳
- [[reports-generate]] (`src/lib/reports/generate.ts`의 `generateReport()`) — Vercel Cron 또는
  수동 트리거로 OpenAI 호출 후 upsert.

## 읽는 곳
- [[reports]] 탭 `PeriodReport`, `ReportArchiveList` — 일반 서버 클라이언트로 조회(읽기는
  service-role 불필요).

## 관련 문서
- [[reports-generate]]
- [[news_trends]] (월간 리포트가 주간 리포트를 입력으로 재사용)
