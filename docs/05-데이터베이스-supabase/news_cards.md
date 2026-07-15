---
title: "news_cards 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/collect.py
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-개요]]"
  - "[[analytics]]"
  - "[[card_news]]"
---

# news_cards 테이블

## 내용
네이버 뉴스 API로 매일 수집한 **원본** 뉴스. AI가 가공하기 전 원자료다. [[card_news]](AI가
생성한 카드뉴스)와 이름이 비슷하지만 **다른 테이블**이므로 혼동 주의.

## 컬럼 (`src/lib/types/index.ts`의 `NewsCard` 기준)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `date` | string | 수집일 (YYYY-MM-DD) |
| `category` | string | 카테고리 (예: `🤖 AI / 인공지능`, `💰 경제 / 금융` 등, [[pipeline-개요]]의 `CATEGORIES` 참고) |
| `title` | string | 제목 |
| `summary` | string \| null | Groq 요약 |
| `image_url` | string \| null | |
| `link` | string \| null | 원문 링크 |
| `source` | string \| null | 언론사 |
| `created_at` | string | |

## 쓰는 곳
- [[pipeline-개요|pipeline/collect.py]] — 네이버 뉴스 API 수집 + Groq 요약 후 INSERT.

## 읽는 곳
- [[analytics]] — 기간별 통계/키워드 집계.
- [[reports-generate]] — 리포트 생성 원자료.
- [[newsletter]] 탭 `RawNewsSection` — 원본 뉴스 그대로 노출.

## 관련 문서
- [[card_news]] (혼동 주의)
- [[pipeline-개요]]
