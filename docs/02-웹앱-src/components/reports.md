---
title: "reports 컴포넌트"
source_paths:
  - src/components/reports/ReportsTab.tsx
  - src/components/reports/ReportsSubNav.tsx
  - src/components/reports/ReportsPeriodSelector.tsx
  - src/components/reports/PeriodReport.tsx
  - src/components/reports/ReportArchiveList.tsx
  - src/components/reports/TrendHighlights.tsx
  - src/components/reports/ReportsDashboard.tsx
  - src/components/reports/CategoryChart.tsx
  - src/components/reports/VolumeChart.tsx
  - src/components/reports/KeywordChart.tsx
  - src/components/reports/SourcePieChart.tsx
  - src/components/reports/StatsKpiRow.tsx
tags: [component, chartjs]
last_reviewed: 2026-09-04
status: 초안
related:
  - "[[analytics]]"
  - "[[reports-generate]]"
  - "[[weekly_reports]]"
  - "[[news_trends]]"
---

# reports 컴포넌트

## 역할
`reports` 탭(`?tab=reports`)의 UI 전체. 주간/월간 리포트 열람(`?view=weekly|monthly`),
특정 리포트 상세(`?report=YYYY-MM-DD`), 통계 대시보드(`?view=dashboard`) 세 가지 뷰를 담당한다.
`ReportsTab`에 `export const revalidate = 3600`이 있어 리포트 목록/상세는 1시간 캐시.

## 컴포넌트 구조
- `ReportsTab` — 최상위. URL 쿼리(`view`, `report`)를 읽어 하위 뷰를 분기하는 Server Component.
- `ReportsSubNav` — weekly/monthly/dashboard 전환 탭 UI.
- `ReportsPeriodSelector` — 특정 기간(리포트) 선택 UI, Client Component.
- `PeriodReport` — 선택된 리포트 1건의 본문 렌더링. [[weekly_reports]]의 `period_type`에 따라
  주간/월간 레이아웃을 조금씩 다르게 그림. 섹션 구성은 요약 → **TOP 뉴스 분야 분포** →
  **분야별 심층**(`raw_data.sections`) → 인사이트 → 다음 기간 주목 포인트.
- `ReportArchiveList` — 과거 리포트 목록(날짜별). 링크는 `reportHref()`가 만드는
  `/reports/[period]/[start]` 퍼머링크를 가리킨다.
- `TrendHighlights` — [[news_trends]] 기반 TOP3 트렌드 요약 카드.
- `ReportsDashboard` — `StatsKpiRow` + 4개 차트(`CategoryChart`, `VolumeChart`, `KeywordChart`,
  `SourcePieChart`)로 구성된 통계 뷰. Chart.js 사용.

## 데이터 흐름
1. `PeriodReport`, `ReportArchiveList` → 서버 컴포넌트에서 [[weekly_reports]] 직접 조회
   (`unstable_cache` 3600초).
2. `ReportsDashboard` → 클라이언트에서 [[analytics]] 호출(기간 대비 비교 포함).
3. `TrendHighlights` → [[news_trends]] 조회.

## 왜 이렇게 되어 있는가
- 차트 4종은 Chart.js로 통일 — 색상은 [[라이브러리-및-상태관리#useChartColors|useChartColors]]
  훅으로 CSS 변수(다크/라이트 테마 대응)에서 읽는다. 새 차트를 추가할 때도 색을 하드코딩하지
  말고 이 훅을 재사용할 것.
- `PeriodReport`가 weekly/monthly를 하나의 컴포넌트로 처리하는 이유: [[weekly_reports]]가
  `period_type` 판별 컬럼으로 두 종류를 한 테이블에 저장하기 때문 — 컴포넌트도 이를 따라간다.

## 주의: 차트가 보여주는 것은 수집 건수가 아니다
"TOP 뉴스 분야 분포"는 [[news_cards]] 원문 건수가 아니라 [[news_trends]] `top3`의
분야 분포다. 수집이 "분야당 하루 5건" 고정 쿼터라 원문 건수는 항상 균일해
(모든 분야가 정확히 같은 값) 분포·추세로서 아무 정보가 없기 때문이다.
TOP3는 AI의 일별 편집 판단이라 주별로 실제 변동한다.

증감 표시(▲▼)는 `previousRange()`로 구한 직전 동일 기간과 비교해 ±10% 기준으로 판정한다.
이 집계는 전부 `src/lib/utils/category-stats.ts`가 코드로 수행하며 LLM은 관여하지 않는다 —
그 이유는 [[weekly_reports]]의 "categories는 LLM에게 맡기지 않는다" 절 참고.

## 주의사항
`ReportsDashboard`의 "이전 기간 대비" 비교는 [[analytics]]가 서버에서 계산해서 내려준다 —
컴포넌트 쪽에서 별도로 diff를 다시 계산하지 말 것.

## 관련 문서
- [[analytics]] · [[reports-generate]] · [[weekly_reports]] · [[news_trends]]
