---
title: "pipeline/agents 모듈"
source_paths:
  - pipeline/agents/planner.py
  - pipeline/agents/writer.py
  - pipeline/agents/designer.py
  - pipeline/agents/music_curator.py
  - pipeline/agents/supabase_logger.py
  - pipeline/agents/weekly_trend.py
tags: [pipeline, agents]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-개요]]"
  - "[[pipeline-utils]]"
---

# pipeline/agents 모듈

6개 파일이 각각 독립된 책임과 쓰는 테이블을 가진다 — 아래 `##`가 각 파일에 대응하므로
`grep`으로 특정 파일의 문서만 찾을 수 있다.

## planner.py
콘텐츠 브리프 작성. `_load_recent_used_titles(days=3)`으로 최근 3일간 [[card_news]]에 쓰인
헤드라인을 조회해 **중복 소재를 피한다**. Gemini(`ask_gemini`)에 JSON만 출력하도록 지시하는
시스템 프롬프트를 사용. [[pipeline-utils#agent_memory|agent_memory]]의 `remember`/`get_hints`로
과거 실행 힌트를 프롬프트에 반영.

## writer.py
카드뉴스 5개 + 블로그 아티클 작성. "시아아빠"(40대 직장인, BMW 딜러) 페르소나로 반말 카톡체
글쓰기 — 시스템 프롬프트에 "같은 표현 반복 금지", "레이블 달지 마", "한국어·영어만(외국어 금지)"
등 세세한 톤 규칙이 명시되어 있다. `BLACKLIST` 배열로 "와 이거 실화야", "레전드네" 같은
클리셰 표현을 명시적으로 금지 — [[pipeline-utils#quality_tracker|quality_tracker]]가 이
블랙리스트 위반을 학습 이슈로 추적한다.

## designer.py
카드뉴스 이미지 5장 생성 → Supabase Storage 업로드. 시스템 프롬프트가 "밝고 현대적인 뉴스
인포그래픽" 스타일(Bloomberg/Wired/The Economist풍)을 지정하며 어두운 하늘/폭발/참혹한 이미지를
명시적으로 금지한다. 영어 프롬프트, 70단어 이내로 제한.

## music_curator.py
장르별 플레이리스트를 큐레이션해 **Supabase**(`card_news`와 마찬가지로 `agent_memories`,
그리고 아마도 별도 음악 테이블)에 저장. `GENRE_PROMPTS`로 12개 이상 장르(2000s힙합, K-pop,
여성발라드 등)를 각각 10곡씩 분리 호출 — JSON 응답이 한 번에 너무 길면 잘리는 문제를 피하기
위한 설계. [[ai-crew-개요|ai-crew/agents/music_curator.py]]와 이름이 같지만 **완전히 다른
저장 대상**을 쓴다 — 자세한 차이는 [[ai-crew-개요]] 참고.

## supabase_logger.py
`agents`/`logs` 테이블(→ [[agents-logs]]) write 헬퍼. `AGENT_IDS` 딕셔너리가 한글 표시명
(예: `박기획`)을 테이블 upsert 키(`planner`)로 매핑한다. [[office]] 탭의 실시간 모니터링이
이 테이블을 구독하므로, 새 에이전트를 추가하면 이 매핑도 함께 갱신해야 한다.

## weekly_trend.py
매주 월요일 실행. [[card_news]] + [[news_cards]] 지난 7일 데이터로 분야별 이슈 빈도를 집계하고
Gemini로 인사이트를 생성해 [[news_trends]]에 저장. "BMW 딜러십 근무 + 삼천리 그룹 관심"이라는
구체적 페르소나로 "그래서 나한테 뭔 의미야?"에 답하는 톤을 요구하는 시스템 프롬프트.

## 관련 문서
- [[pipeline-개요]] · [[pipeline-utils]]
- [[card_news]] · [[news_trends]] · [[agents-logs]]
