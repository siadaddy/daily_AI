---
title: "ADR 0001: AI Office 탭은 Canvas, DOM 애니메이션으로 바꾸지 말 것"
source_paths:
  - src/components/office/OfficeCanvas.tsx
tags: [adr, decision]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[office]]"
---

# ADR 0001: Canvas 유지, DOM 애니메이션 금지

## 결정
AI Office 탭의 애니메이션(`OfficeCanvas`)은 `requestAnimationFrame` 루프를 쓰는 Canvas 구현을
유지한다. DOM 기반 애니메이션(CSS transition/transition 다수 요소)으로 바꾸지 않는다.

## 배경 (왜)
`CLAUDE.md`의 "Key decisions"에 명시된 프로젝트 차원의 결정이다. 다수의 에이전트 아이콘이
동시에 움직이는 장면에서 DOM 애니메이션은 리플로우/리페인트 비용이 커 성능이 떨어지고,
Canvas는 단일 그리기 컨텍스트로 처리량을 낮게 유지할 수 있다.

## 어떻게 적용하는가
`OfficeCanvas`를 수정할 때는 `useEffect` 안에서 RAF 루프를 시작하고 cleanup에서
`cancelAnimationFrame`을 반드시 호출하는 기존 패턴을 유지한다. 새 시각 효과를 추가할 때도
개별 DOM 요소를 늘리는 대신 Canvas 컨텍스트에 그리는 방식으로 구현한다.

## 관련 문서
- [[office]]
