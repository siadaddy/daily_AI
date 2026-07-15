---
title: "weather API 라우트"
source_paths:
  - src/app/api/weather/route.ts
tags: [api, dashboard]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[dashboard]]"
---

# GET /api/weather

## 역할
서울(위도 37.5665, 경도 126.9780) 기온·날씨코드·미세먼지(PM2.5)를 외부 API에서 가져와
반환한다. `WeatherWidget`이 브라우저에서 직접 외부 API를 호출하면 CORS에 걸리므로 이 라우트가
서버에서 대신 호출하는 프록시 역할을 한다.

## 외부 의존성
- `api.open-meteo.com` — 기온/날씨코드
- `air-quality-api.open-meteo.com` — PM2.5

인증 불필요(무료 공개 API), API 키 없음.

## 캐싱
`revalidate = 1800` (30분).

## 응답
```json
{ "temp": 12, "code": 3, "pm25": 18 }
```

## 왜 이렇게 되어 있는가
두 API를 `Promise.all`로 병렬 호출해 지연을 최소화한다. 실패 시 500과 `{ error: 'fetch failed' }`
를 반환 — 위젯 쪽에서 이 형태의 에러 응답을 처리하는지 [[dashboard]] 노트 참고.

## 관련 문서
- [[dashboard]] — `WeatherWidget`이 SWR로 이 라우트를 폴링.
