---
title: "exchange API 라우트"
source_paths:
  - src/app/api/exchange/route.ts
tags: [api, dashboard]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[dashboard]]"
---

# GET /api/exchange

## 역할
USD/KRW 환율을 조회해 원 단위로 반올림한 값만 반환하는 얇은 프록시.

## 외부 의존성
`open.er-api.com` (무료, 키 불필요).

## 캐싱
`revalidate = 3600` (1시간).

## 응답
```json
{ "krw": 1345 }
```

실패 시 500 + `{ error: 'fetch failed' }`.

## 관련 문서
- [[dashboard]] — `ExchangeWidget`.
