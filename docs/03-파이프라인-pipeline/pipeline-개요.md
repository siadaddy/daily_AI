---
title: "pipeline 개요"
source_paths:
  - pipeline/collect.py
  - pipeline/main.py
  - pipeline/check_gemini_keys.py
tags: [pipeline, python]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[pipeline-utils]]"
  - "[[데이터-흐름]]"
---

# pipeline 개요

GitHub Actions `pipeline-daily.yml`이 매일 06:00 KST(전날 21:00 UTC)에 실행하는 Python 파이프라인.
자세한 실행 순서는 [[데이터-흐름]] 참고.

## 진입점

### collect.py (427줄)
네이버 뉴스 API로 카테고리별(`CATEGORIES` 딕셔너리 — 🔥 오늘의 하이라이트, 🤖 AI/인공지능,
💻 기술/IT, 💰 경제/금융, 🚨 사건/사고, 🏙️ 사회, 🚗 자동차, 🚘 BMW, 🏢 삼천리 그룹, 카테고리당
최대 5건)로 뉴스를 수집하고 Groq(`GROQ_KEYS` 여러 개 순환 사용)로 요약해 [[news_cards]]에
INSERT한다. 동시에 `pipeline/output/{날짜}.md`와 `{날짜}_data.json`으로도 저장 — 이 파일이
`main.py`의 입력이 된다.

### main.py (290줄)
`collect.py`의 출력 파일을 읽어 [[pipeline-agents|planner → writer → designer → music_curator →
weekly_trend]] 순서로 실행하고, 각 단계 결과를 [[card_news]]/[[articles]]에 저장한다.
실패 시 `retry()` 헬퍼로 최대 3회, 10초 간격 재시도. 완료/실패는 ntfy.sh로 푸시 알림
(`NTFY_TOPIC`).

### check_gemini_keys.py
Gemini API 키 유효성을 점검하는 유틸리티 스크립트(운영 점검용, 파이프라인 본 실행 흐름에는
포함되지 않음).

## 왜 이렇게 되어 있는가
- 요약에 Groq를 쓰고 카드뉴스/블로그 생성에는 Gemini를 쓰는 이유(→ [[pipeline-utils]]의
  `gemini_client.py`가 실제로는 Groq와 Gemini 둘 다 다루는 모듈): 원문 요약처럼 짧고 빠른
  작업은 Groq, 창작성이 필요한 긴 글은 Gemini로 나눠 쓰는 것으로 보인다.
- `retry()` + `RETRY_DELAY=10`초는 외부 API(Naver/Groq/Gemini) 일시 장애에 대비한 방어적 설계 —
  GitHub Actions는 실패해도 재실행 비용이 크므로 스크립트 내부에서 먼저 재시도한다.

## 관련 문서
- [[pipeline-agents]] · [[pipeline-utils]]
- [[데이터-흐름]]
- [[news_cards]] · [[card_news]] · [[articles]]
