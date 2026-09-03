---
title: "weekly_reports 테이블"
source_paths:
  - src/lib/types/index.ts
  - src/lib/reports/generate.ts
  - src/app/api/reports/generate/route.ts
tags: [table, supabase]
last_reviewed: 2026-09-04
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
| `categories` | `CategoryStat[]` | `{ name, count, trend, deltaPct? }` — **LLM이 아니라 코드가 집계**. 아래 주의 참고 |
| `insights` | string | 편집장 시각 인사이트 |
| `next_focus` | string[] | 다음 기간 주목 포인트 |
| `raw_data` | `{ sections?: ReportSection[] }` | 전용 컬럼이 없는 부가 데이터. 현재는 분야별 심층 섹션 `{ category, top_issue, insight }` |
| `created_at` | string | |

## 주의: categories는 LLM에게 맡기지 않는다
2026-09-04 이전에는 `categories`(분야명·건수·추세)를 gpt-4o-mini가 직접 생성했는데,
실측 결과 건수·분야명·추세가 모두 실데이터와 맞지 않았다(존재하지 않는 분야를 만들어내고,
이모지 접두사를 누락하고, 직전 기간 데이터가 프롬프트에 없는데도 ▲▼를 표시했다).

지금은 `src/lib/utils/category-stats.ts`의 `buildCategoryStats()`가 코드로 집계한다.
[[analytics]] 대시보드와 같은 구현을 공유한다. 집계 대상은 [[news_trends]]의 `top3`이며
(수집 원문은 분야당 하루 5건 고정 쿼터라 항상 균일), `trend`는 `previousRange()`로 구한
직전 동일 기간과 비교해 ±10% 기준으로 판정한다.

⚠️ **2026-09-04 이전에 생성된 행 20건은 여전히 조작된 `categories`를 담고 있다.**
`?start=YYYY-MM-DD` 백필로 재생성해야 교체된다.

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
- [[news_trends]] (월간 리포트가 주간 리포트를 입력으로 재사용, `top3`가 categories 집계 대상)
- [[pipeline-agents]] — 파이프라인의 `weekly_trend.py`가 이 테이블에 중복 생성하던 이력
