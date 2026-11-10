-- 자동차 인사이트 v2 — Supabase SQL Editor 에서 한 번 실행한다. (auto_insight.sql 을 먼저 실행한 상태여야 한다)
-- 몇 번 실행해도 안전하다(idempotent). 기존 데이터는 지우지 않는다.
--
-- 1) 새 주제 'ev_industry'(전기차·배터리 산업 동향) 허용
-- 2) 주제별 요약 테이블 auto_digest 추가
--
-- 이 SQL 을 실행하기 전에도 파이프라인은 멈추지 않는다:
--  - 새 주제는 import_market 으로 저장되고, 요약 저장만 건너뛴다(로그에 안내 문구가 나온다).

alter table public.auto_articles drop constraint if exists auto_articles_topic_check;
alter table public.auto_articles
  add constraint auto_articles_topic_check
  check (topic in ('ev_aftersales','ev_industry','import_market','sdv','ai_auto','bmw_group','regulation','other'));

create table if not exists public.auto_digest (
  date          date        not null,
  topic         text        not null,                  -- 주제 키 또는 'all'(하루 전체 총평)
  headline      text        not null default '',       -- 그 주제의 오늘 핵심 한 문장
  points        jsonb       not null default '[]',     -- 핵심 사건 2~3개
  article_count integer     not null default 0,        -- 코드가 센 기사 수(LLM 값 아님)
  updated_at    timestamptz not null default now(),
  primary key (date, topic)
);

alter table public.auto_digest enable row level security;

drop policy if exists "auto_digest public read" on public.auto_digest;
create policy "auto_digest public read" on public.auto_digest for select using (true);
