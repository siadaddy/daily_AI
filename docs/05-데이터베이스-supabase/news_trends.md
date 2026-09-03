---
title: "news_trends 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/collect.py
tags: [table, supabase]
last_reviewed: 2026-09-04
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[reports]]"
  - "[[reports-generate]]"
---

# news_trends 테이블

## 내용
일별 TOP3 트렌드 분석과 대화 소재. `collect.py`가 수집 직후 Groq로 생성해 **매일 1행**
upsert한다(`on_conflict=date`). 주간·월간 집계는 이 데이터를 모아 [[weekly_reports]]가
별도로 생성한다.

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
- [[pipeline-개요|pipeline/collect.py]] — 그날 수집한 기사로 Groq가 TOP3·분야별 요약·대화 소재를
  생성해 `date` 기준 upsert.

## 읽는 곳
- [[newsletter]] 탭 — `AiPicksSection`(TOP3 + `one_line_insight`)과
  `TalkingPointsSection`(`talking_points.talking_points[]`의 3건).
- [[reports]] 탭 `TrendHighlights`.
- [[reports-generate]] — 리포트 프롬프트에 일별 TOP3를 포함하고, **`top3`의 분야 분포를
  리포트 `categories` 집계 대상으로 사용**한다. 수집은 분야당 하루 5건 고정 쿼터라
  `news_cards` 원문 건수로는 분포·추세 정보를 얻을 수 없기 때문.
- [[analytics]] — 트렌드 제목도 키워드 추출 입력에 포함.

## 관련 문서
- [[weekly_reports]]
- [[pipeline-agents]]
