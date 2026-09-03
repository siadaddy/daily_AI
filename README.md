# 시아아빠의 AI 데일리

한국 AI·기술 뉴스를 **매일 자동으로 수집·요약·분석**하는 대시보드입니다.
매일 06:00 KST에 파이프라인이 돌아 카드뉴스·블로그 아티클·트렌드 분석을 만들고, Next.js 앱이 이를 서빙합니다.

## 구성

| 디렉터리    | 내용                                                                          | 실행                                                 |
| ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/`      | Next.js 16 + React 19 웹 앱                                                   | Vercel                                               |
| `pipeline/` | 뉴스 수집(네이버 API) → 기획·집필·이미지 생성(Gemini/Groq/HF) → Supabase 저장 | GitHub Actions `pipeline-daily.yml` (매일 06:00 KST) |
| `ai-crew/`  | 음악 큐레이터 — `public/music/music_*.json` 생성 (Music Universe 탭이 소비)   | 수동 실행                                            |

> `pipeline/`과 `ai-crew/`는 파일명이 겹치지만 **의도적으로 분기된 별도 코드**입니다. 하나를 고쳐도 다른 쪽에 적용되지 않습니다.

## 개발

```bash
npm run dev              # 개발 서버 (localhost:3000)
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npm test                 # Vitest (src/lib 단위 테스트)
npx prettier --write .   # 포맷 (커밋 전 실행)
```

`.env.example`을 복사해 `.env.local`을 만들고 Supabase·OpenAI·YouTube 키를 채웁니다.
파이프라인은 별도로 `pipeline/.env` (`pipeline/.env.example` 참고)를 사용합니다.

## 라우트

콘텐츠는 탭 SPA(`/?tab=`)와 **독립 라우트** 양쪽으로 접근됩니다. 독립 라우트가 정식 경로(canonical)이며 검색엔진 색인 대상입니다.

| 경로                                                 | 내용                                    |
| ---------------------------------------------------- | --------------------------------------- |
| `/`                                                  | 오늘의 뉴스레터 (+ `?tab=`으로 탭 전환) |
| `/news/[date]`                                       | 날짜별 뉴스레터 아카이브                |
| `/reports/[period]/[start]`                          | 주간·월간 리포트 퍼머링크               |
| `/keyword` · `/keyword/[keyword]`                    | 키워드별 전 기간 뉴스 아카이브          |
| `/agents` · `/agents/[name]`                         | AI 에이전트 페르소나·성장 일기          |
| `/about` · `/about/ai-usage`                         | 서비스 소개, AI 활용 고지               |
| `/sitemap.xml` `/feed.xml` `/llms.txt` `/robots.txt` | 색인·구독·AI 크롤러용                   |

`?tab=`/`?date=` 형태의 기존 URL은 계속 동작하며 canonical만 위 경로를 가리킵니다.

## 데이터

Supabase에 저장됩니다. `news_cards`(수집 원문)와 `card_news`(AI 생성 카드)는 **서로 다른 테이블**입니다.

| 테이블                              | 내용                                      |
| ----------------------------------- | ----------------------------------------- |
| `news_cards`                        | 매일 수집한 뉴스 원문                     |
| `card_news`                         | AI 생성 카드뉴스 (일 5건)                 |
| `articles`                          | AI 생성 블로그 아티클                     |
| `news_trends`                       | 일별 TOP3 + 대화 소재                     |
| `weekly_reports`                    | 주간·월간 리포트 (`period_type`으로 구분) |
| `agents`, `logs`                    | AI Office 탭 상태·활동 로그               |
| `agent_memories`                    | 에이전트 페르소나·성장 일기               |
| `content_likes`, `content_comments` | 콘텐츠 좋아요·댓글                        |

자세한 아키텍처와 설계 결정은 [`CLAUDE.md`](CLAUDE.md)와 [`docs/`](docs/) 옵시디언 볼트를 참고하세요.
