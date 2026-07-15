---
title: "dashboard 컴포넌트"
source_paths:
  - src/components/dashboard/DashboardBar.tsx
  - src/components/dashboard/ClockWidget.tsx
  - src/components/dashboard/WeatherWidget.tsx
  - src/components/dashboard/ExchangeWidget.tsx
  - src/components/dashboard/BtcWidget.tsx
  - src/components/dashboard/EthWidget.tsx
  - src/components/dashboard/KospiWidget.tsx
  - src/components/dashboard/KosdaqWidget.tsx
  - src/components/dashboard/NasdaqWidget.tsx
  - src/components/dashboard/Sp500Widget.tsx
  - src/components/dashboard/DxyWidget.tsx
  - src/components/dashboard/GoldWidget.tsx
  - src/components/dashboard/OilWidget.tsx
  - src/components/dashboard/VixWidget.tsx
  - src/components/dashboard/NewsTicker.tsx
tags: [component]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[weather]]"
  - "[[exchange]]"
  - "[[crypto]]"
  - "[[market]]"
---

# dashboard 컴포넌트

## 역할
모든 탭 상단에 항상 떠 있는 티커 바(`DashboardBar`). 13개 위젯 + 뉴스 티커로 구성.

## 위젯 구조가 모두 동일함
13개 위젯은 데이터 소스만 다를 뿐 구조가 거의 동일하다(SWR로 폴링 → 숫자/변동률 렌더링) —
개별 노트 대신 아래 표로 정리한다.

| 위젯 | 데이터 소스 (API) | 캐시(=SWR 갱신 주기 기준) |
|---|---|---|
| `ClockWidget` | 없음(클라이언트 시각, [[라이브러리-및-상태관리#useInterval|useInterval]]) | 1초 |
| `WeatherWidget` | [[weather]] | 30분 |
| `ExchangeWidget` | [[exchange]] | 1시간 |
| `BtcWidget`, `EthWidget` | [[crypto]] | 5분 |
| `KospiWidget`, `KosdaqWidget`, `NasdaqWidget`, `Sp500Widget`, `DxyWidget`, `GoldWidget`, `OilWidget`, `VixWidget` | [[market]] | 5분 |
| `NewsTicker` | Server Component에서 직접 조회(뉴스 헤드라인 흘려보내기) | — |

## 왜 이렇게 되어 있는가
CORS 회피를 위해 모든 외부 시세 API는 `/api/*` Route Handler를 거친다(`weather`, `exchange`,
`crypto`, `market`) — 브라우저에서 Yahoo Finance/CoinGecko 등을 직접 호출하면 CORS에 걸리기
때문. 새 티커를 추가할 때도 이 프록시 패턴을 그대로 따를 것.

## 관련 문서
- [[weather]] · [[exchange]] · [[crypto]] · [[market]]
