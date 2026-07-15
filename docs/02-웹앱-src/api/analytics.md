---
title: "analytics API 라우트"
source_paths:
  - src/app/api/analytics/route.ts
  - src/lib/utils/keywords.ts
tags: [api, reports]
tables: [news_cards, articles, news_trends]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[reports]]"
  - "[[news_cards]]"
  - "[[news_trends]]"
  - "[[articles]]"
---

# GET /api/analytics?period=day|week|month

## 역할
[[reports]] 탭 대시보드 뷰(`ReportsDashboard`)가 쓰는 집계 데이터 — 카테고리별 통계, 출처별
통계, 일별 기사량, 급상승 키워드, 그리고 **직전 동일 길이 기간 대비 증감**을 계산해 반환한다.

## 요청
| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `period` | `week` | `day`(1일) \| `week`(7일) \| `month`(30일) |

## 처리 흐름
1. `since`(조회 시작일)와 `prevSince`~`prevUntil`(직전 동일 길이 기간)을 계산.
2. [[news_cards]], `articles`, `news_trends`를 병렬 조회(`fetchAllPages`로 1000행 제한 없이 전체 수집).
3. [[라이브러리-및-상태관리#keywords.ts|extractKeywords()]]로 제목/트렌드/아티클 본문에서
   키워드 20개 추출.
4. 직전 기간 키워드와 비교해 `isNew`(신규) 또는 `count > prevCount`(급상승)인 것만
   `risingKeywords`로 필터링(최대 8개).
5. 카테고리별/출처별 카운트 + 직전 대비 `trend`(`up`/`down`/`flat`, ±10% 기준) 계산.
6. 출처는 상위 5개 + 나머지를 "기타"로 합산 — 차트 시리즈 색 슬롯이 6개이기 때문
   ([[라이브러리-및-상태관리#useChartColors|useChartColors]] 참고).

## 캐싱
응답 헤더로 `Cache-Control: s-maxage=..., stale-while-revalidate=...`를 직접 설정 —
`day`는 600초, `week`는 3600초, `month`는 7200초.

## 왜 이렇게 되어 있는가
`fetchAllPages`([[reports-generate]]와 공유하는 `src/lib/reports/generate.ts`의 헬퍼)를 쓰는
이유: Supabase가 요청당 최대 1000행만 반환하므로, 집계 대상 기간이 길면 페이지네이션이
필요하다.

## 관련 문서
- [[reports]] — `ReportsDashboard`가 소비.
- [[reports-generate]] — `fetchAllPages` 공유.
