---
title: "music 컴포넌트"
source_paths:
  - src/components/music/MusicUniverse.tsx
tags: [component, iframe]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[music-search]]"
  - "[[ai-crew-개요]]"
---

# music 컴포넌트

## 역할
`music` 탭. `MusicUniverse`는 `<iframe src="/music/music.html">`로 기존 Three.js 앱을 감싸는
얇은 래퍼일 뿐이다.

## 왜 이렇게 되어 있는가
Three.js 3D 우주 UI는 React 컴포넌트 트리로 포팅하지 않고 **격리된 정적 앱**으로 유지한다 —
`CLAUDE.md`의 Key decisions에 명시된 결정. 데이터는 [[ai-crew-개요|ai-crew/]]가 생성하는
`public/music/music_*.json`을 iframe 내부 스크립트가 직접 fetch한다 — Supabase를 거치지 않는
이 프로젝트의 유일한 데이터 경로.

## 관련 문서
- [[ai-crew-개요]] — `public/music/*.json`을 생성하는 주체.
- [[music-search]] — iframe 내부(Three.js 앱)에서 곡 재생 시 YouTube videoId 조회에 사용.

## 확인 필요
`public/music/music.html`과 Three.js 앱 자체는 이 볼트가 상세히 다루지 않는다(별도 정적 앱
취급). 그 내부 구조를 문서화하려면 별도 노트를 추가할 것.
