---
title: "reports/generate API 라우트"
source_paths:
  - src/app/api/reports/generate/route.ts
  - src/lib/reports/generate.ts
tags: [api, cron, openai]
tables: [weekly_reports, news_cards, news_trends]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[reports]]"
  - "[[weekly_reports]]"
  - "[[weekly-briefing-generate]]"
---

# GET/POST /api/reports/generate

## 역할
주간/월간 리포트를 OpenAI(`gpt-4o-mini`)로 생성해 [[weekly_reports]]에 upsert한다. 라우트
자체는 인증 + 기간 계산만 하고, 실제 생성 로직은 `src/lib/reports/generate.ts`의
`generateReport()`에 분리되어 있다 — [[analytics]]도 이 파일의 `fetchAllPages` 헬퍼를 공유한다.

## 트리거
- Vercel Cron: 매주 월요일 01:00 UTC(주간), 매월 1일 01:30 UTC(월간) — `vercel.json` 참고.
- 수동 백필: `?start=YYYY-MM-DD` 쿼리로 특정 시작일부터 재생성 가능.
- GET과 POST 둘 다 같은 핸들러(`handler`)를 사용 — Vercel Cron은 GET으로 호출하고, 수동
  트리거용으로 POST도 열어둔 것.

## 요청
| 파라미터 | 필수 | 설명 |
|---|---|---|
| `period` | X (기본 `weekly`) | `weekly` \| `monthly` |
| `start` | X | 백필용 시작일(YYYY-MM-DD). 없으면 "방금 끝난 기간"(주간=어제까지 7일, 월간=지난달) 자동 계산 |

인증: `Authorization: Bearer $CRON_SECRET` 헤더 필수(없거나 불일치하면 401).

`maxDuration = 60` — OpenAI 호출 + 대량 DB 조회를 고려해 기본 제한보다 늘려둠.

## 처리 흐름 (`generateReport()`)
1. `news_trends`에서 기간 내 데이터 조회.
2. **주간**: `news_cards`에서 기간 내 최대 200건 제목/카테고리를 프롬프트에 그대로 나열.
3. **월간**: 원문 제목 대신 `fetchAllPages`로 전체 수집한 `news_cards`의 카테고리별/주별
   집계 + 키워드 20개 + 그 달의 [[weekly_reports|weekly_reports(period_type=weekly)]] 요약들을
   입력으로 사용 — 월간은 개별 기사가 아니라 "큰 흐름"을 분석하도록 프롬프트가 설계됨.
4. OpenAI에 프롬프트 전달, 코드펜스 유무와 상관없이 JSON을 추출(`extractJson()`)해서 파싱.
5. `createAdminClient()`(service-role)로 `weekly_reports`에
   `onConflict: 'period_type,week_start'`로 upsert.

## 왜 이렇게 되어 있는가
- service-role 클라이언트가 필요한 이유: `weekly_reports`의 RLS가 service-role 쓰기만 허용.
  일반 서버 클라이언트로 시도하면 RLS 에러가 난다.
- 월간이 원문 대신 집계+주간요약을 쓰는 이유: 한 달치 원문 제목을 전부 프롬프트에 넣으면
  토큰이 너무 커지고, 월 단위 분석은 개별 기사보다 추세가 더 중요하기 때문.

## 레거시 별칭
[[weekly-briefing-generate]]는 이 라우트의 구버전 경로명이 남아있는 것 — 신규 코드는 이 라우트
(`reports/generate`)를 사용.

## 관련 문서
- [[reports]] — 생성된 리포트를 소비하는 UI.
- [[weekly_reports]] — 대상 테이블.
- [[analytics]] — `fetchAllPages` 공유.
