---
title: "news_trends 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/agents/weekly_trend.py
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[reports]]"
  - "[[reports-generate]]"
---

# news_trends 테이블

## 내용
일별 TOP3 트렌드 분석. 이름과 달리 파일명은 `weekly_trend.py`이지만 **매일 실행되어 하루치
TOP3를 기록**하는 것으로 보인다(주간 집계는 이 데이터를 모아 [[weekly_reports]]가 별도로 생성) —
정확한 실행 주기는 `pipeline-daily.yml` 워크플로 파일로 재확인 필요.

## 컬럼 (`src/lib/types/index.ts`의 `NewsTrend` 기준)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `date` | string | |
| `top3` | `Top3Item[]` | `{ rank, title, category, why }` |
| `category_summaries` | `Record<string, unknown>` | |
| `talking_points` | `{ one_line_insight?, talking_points?: [...] }` | 각 항목 `{ topic, context, question, business_impact }` |
| `created_at` | string | |

## 쓰는 곳
- [[pipeline-agents|pipeline/agents/weekly_trend.py]] — `card_news` + `news_cards` 지난 7일 데이터
  분석 후 Gemini로 인사이트 생성.

## 읽는 곳
- [[reports]] 탭 `TrendHighlights`.
- [[reports-generate]] — 리포트 생성 프롬프트에 일별 TOP3를 포함.
- [[analytics]] — 트렌드 제목도 키워드 추출 입력에 포함.

## 관련 문서
- [[weekly_reports]]
- [[pipeline-agents]]
