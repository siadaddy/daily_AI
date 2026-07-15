---
title: "crypto API 라우트"
source_paths:
  - src/app/api/crypto/route.ts
tags: [api, dashboard]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[dashboard]]"
---

# GET /api/crypto

## 역할
BTC/ETH의 KRW 가격과 24시간 변동률을 CoinGecko에서 가져와 반환.

## 외부 의존성
`api.coingecko.com` (무료, 키 불필요).

## 캐싱
`revalidate = 300` (5분).

## 응답
```json
{
  "btc": { "krw": 143000000, "change": 1.2 },
  "eth": { "krw": 5200000, "change": -0.5 }
}
```

## 왜 이렇게 되어 있는가
다른 라우트와 달리 실패 시에도 500과 함께 `{ btc: { krw: 0, change: 0 }, eth: {...} }` 형태의
**항상 같은 모양의 JSON**을 반환한다 — 위젯이 `undefined` 접근 에러 없이 "0"으로라도 렌더링할
수 있게 하려는 의도로 보인다. 다른 위젯 API를 추가할 때도 이 패턴(에러 시에도 정상 응답과 같은
shape 유지)을 참고할 만하다.

## 관련 문서
- [[dashboard]] — `BtcWidget`, `EthWidget`.
