-- 자동차 인사이트 허브 — Supabase SQL Editor 에서 한 번 실행한다.
-- 기존 테이블(news_cards, card_news, weekly_reports …)은 건드리지 않는다.
-- 읽기: 누구나(anon) / 쓰기: service-role 만 (service-role 은 RLS 를 우회하므로 쓰기 정책을 만들지 않는다).

create table if not exists public.auto_articles (
  id            bigint generated always as identity primary key,
  date          date        not null,                 -- 수집일(KST)
  title         text        not null,                 -- 한국어 제목(영문 기사는 번역본)
  title_original text       not null default '',      -- 영문 기사의 원제목
  summary_ko    text        not null default '',      -- 한국어 요약(영문 기사는 번역·요약)
  link          text        not null unique,          -- 정규화된 원문 링크
  source        text        not null default '',
  source_type   text        not null default 'trade'  -- naver | global | trade | google | gov
                check (source_type in ('naver','global','trade','google','gov')),
  topic         text        not null default 'other'
                check (topic in ('ev_aftersales','import_market','sdv','ai_auto','bmw_group','regulation','other')),
  brands        text[]      not null default '{}',
  importance    smallint    not null default 3 check (importance between 1 and 5),
  is_breaking   boolean     not null default false,
  lang          text        not null default 'ko',
  published_at  timestamptz,
  so_what       text        not null default '',      -- 서비스본부 관점 시사점 한 줄
  created_at    timestamptz not null default now()
);

create index if not exists auto_articles_date_idx       on public.auto_articles (date desc, importance desc);
create index if not exists auto_articles_topic_idx      on public.auto_articles (topic, date desc);
create index if not exists auto_articles_brands_idx     on public.auto_articles using gin (brands);

create table if not exists public.auto_reports (
  id            bigint generated always as identity primary key,
  period_type   text        not null check (period_type in ('weekly','monthly')),
  period_start  date        not null,
  period_end    date        not null,
  content       jsonb       not null,
  created_at    timestamptz not null default now(),
  unique (period_type, period_start)
);

create table if not exists public.auto_competitor_log (
  id            bigint generated always as identity primary key,
  date          date        not null,
  brand         text        not null,
  item          text        not null                  -- service_policy | price | campaign | recall
                check (item in ('service_policy','price','campaign','recall')),
  note          text        not null,
  source_link   text        not null default '',
  article_id    bigint references public.auto_articles(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (brand, item, source_link)
);

create index if not exists auto_competitor_log_idx on public.auto_competitor_log (brand, date desc);

alter table public.auto_articles       enable row level security;
alter table public.auto_reports        enable row level security;
alter table public.auto_competitor_log enable row level security;

drop policy if exists "auto_articles public read"       on public.auto_articles;
drop policy if exists "auto_reports public read"        on public.auto_reports;
drop policy if exists "auto_competitor_log public read" on public.auto_competitor_log;

create policy "auto_articles public read"       on public.auto_articles       for select using (true);
create policy "auto_reports public read"        on public.auto_reports        for select using (true);
create policy "auto_competitor_log public read" on public.auto_competitor_log for select using (true);
