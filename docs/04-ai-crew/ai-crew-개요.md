---
title: "ai-crew 개요"
source_paths:
  - ai-crew/agents/music_curator.py
  - ai-crew/utils/agent_memory.py
  - ai-crew/utils/gemini_client.py
  - ai-crew/requirements.txt
tags: [ai-crew, python, music]
last_reviewed: 2026-07-15
status: 초안
related:
  - "[[pipeline-agents]]"
  - "[[music]]"
---

# ai-crew 개요

`pipeline/`과 파일명은 같지만 완전히 다른 저장 대상을 쓰는 **독립 실행** 뮤직 큐레이터.
수동으로 실행하며, GitHub Actions에 연결되어 있지 않다(`CLAUDE.md` 기준).

## pipeline/agents/music_curator.py 와의 차이점

| 항목 | `pipeline/agents/music_curator.py` | `ai-crew/agents/music_curator.py` |
|---|---|---|
| 결과 저장 위치 | Supabase (`agent_memories` 등) | `public/music/music_*.json` 파일 |
| 기존 곡 목록 로드 | `agent_memories?agent_name=eq.한뮤직&select=events`를 Supabase REST로 직접 조회 | `public/music/music.json`을 로컬 파일로 직접 읽음(`_load_existing_songs`) |
| 장르 프롬프트 수 | `GENRE_PROMPTS` 13개 | `GENRE_PROMPTS` 14개(`슬픈감성발라드` 추가) — pipeline보다 항목이 하나 더 많다 |
| JSON 복구 로직 | 없음 | `_extract_songs()` — 손상된 JSON에서도 `{`...`}` 객체 단위로 곡을 최대한 복구 추출하는 강건한 파서 보유 |
| 실행 방식 | GitHub Actions `main.py`의 일부로 매일 자동 실행 | 수동 실행, `public/music/*.json`이 [[music]] 탭 iframe(Three.js)이 직접 fetch하는 최종 산출물 |

두 파일은 곡 선정 프롬프트(아티스트 예시 등)는 대체로 동일하지만, **저장/로드 계층이 완전히
다르다** — 한쪽을 고쳤다고 다른 쪽도 고쳐야 하는 게 아니다([[전체-구조]] 참고).

## utils/agent_memory.py, utils/gemini_client.py
pipeline의 동명 파일과 마찬가지로 이름은 같지만 별도 구현. 자세한 pipeline 쪽 설명은
[[pipeline-utils]] 참고 — ai-crew 쪽은 Supabase 대신 로컬 파일/자체 REST 호출 위주로 단순화된
버전으로 추정된다(정확한 diff는 필요 시 재확인).

## 확인 필요 — anthropic 의존성
`ai-crew/requirements.txt`에 `anthropic` 패키지가 포함되어 있지만, 현재 코드
(`agents/music_curator.py`, `utils/agent_memory.py`, `utils/gemini_client.py`)에서
`import anthropic` 또는 `from anthropic`을 찾지 못했다 — 실제로 사용되지 않는 의존성이거나,
이 볼트가 다루지 않은 다른 스크립트에서 쓰일 수 있다. `CLAUDE.md`에도 명시되어 있지 않은
문서 공백이니 코드를 다시 확인해 채울 것.

## 관련 문서
- [[pipeline-agents]] (music_curator 섹션)
- [[music]]
- [[전체-구조]]
