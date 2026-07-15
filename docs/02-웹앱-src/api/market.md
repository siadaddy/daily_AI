---
title: "market API 라우트"
source_paths:
  - src/app/api/market/route.ts
tags: [api, dashboard]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[dashboard]]"
---

# GET /api/market

## 역할
8개 지수/원자재 티커(KOSPI, KOSDAQ, NASDAQ, S&P500, VIX, Gold, Oil, DXY)를 한 번에 조회.

## 외부 의존성
`query2.finance.yahoo.com` (비공식 Yahoo Finance 차트 API). `User-Agent` 헤더를 봇처럼 위장해
호출한다(`Mozilla/5.0 (compatible; bot/1.0)`) — 공식 문서가 없는 API라 차단될 수 있음에 유의.

## 캐싱
`revalidate = 300` (5분).

## 응답
```json
{
  "kospi": { "price": 2650.12, "change": 0.3 },
  "kosdaq": { "price": ... }, "nasdaq": { ... }, "sp500": { ... },
  "vix": { ... }, "gold": { ... }, "oil": { ... }, "dxy": { ... }
}
```
개별 티커 실패 시 해당 티커만 `{ price: null, change: null }`, 전체 실패 시 500 + 모든 티커
null.

## 왜 이렇게 되어 있는가
8개 티커를 `Promise.all`로 병렬 조회하되, 각 티커 호출을 개별 `try/catch`로 감싸 **한 티커의
실패가 나머지를 막지 않게** 한다 — 8개 위젯 전체가 죽는 것보다 일부만 null이 나은 설계.

## 관련 문서
- [[dashboard]] — `KospiWidget`, `KosdaqWidget`, `NasdaqWidget`, `Sp500Widget`, `VixWidget`,
  `GoldWidget`, `OilWidget`, `DxyWidget`.
