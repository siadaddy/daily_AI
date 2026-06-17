#!/usr/bin/env python3
"""
📰 뉴스 수집 에이전트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
네이버 뉴스 API 수집 + Groq AI 요약 + Supabase INSERT
결과를 pipeline/output/{TODAY}.md 와 {TODAY}_data.json 에 저장
"""

import os, re, time, json, sys, requests
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# 경로 설정
PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR   = os.path.join(PIPELINE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

NAVER_CLIENT_ID     = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
NOTION_TOKEN        = os.getenv("NOTION_TOKEN", "")
GROQ_KEYS           = [k for k in [
    os.getenv("GROQ_API_KEY"), os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"), os.getenv("GROQ_API_KEY_4"),
] if k]
TODAY            = date.today().strftime("%Y-%m-%d")
MAX_PER_CATEGORY = 5
MAX_RETRIES      = 3
RETRY_DELAY      = 10

CATEGORIES = {
    "🔥 오늘의 하이라이트": ["속보", "단독", "오늘 주요뉴스"],
    "🤖 AI / 인공지능":    ["AI 인공지능", "ChatGPT", "생성형 AI", "LLM"],
    "💻 기술 / IT":       ["반도체 기술", "빅테크", "IT 기업", "스타트업 기술"],
    "💰 경제 / 금융":      ["코스피 증시", "경제 금융", "부동산 시장", "환율 금리"],
    "🚨 사건 / 사고":      ["재난 안전", "자연재해", "소방 구조"],
    "🏙️ 사회":           ["사회 이슈", "정치 뉴스", "복지 정책"],
    "🚗 자동차":          ["전기차 자동차", "현대차 기아", "자율주행"],
    "🚘 BMW":            ["BMW 뉴스", "BMW 신차"],
    "🏢 삼천리 그룹":    ["삼천리 그룹", "삼천리 에너지", "삼천리 뉴스"],
}


def _sanitize(text: str) -> str:
    text = re.sub(r"[一-鿿]", "", text)
    text = re.sub(r"[㐀-䶿]", "", text)
    text = re.sub(r"[぀-ゟ]", "", text)
    text = re.sub(r"[゠-ヿ]", "", text)
    text = re.sub(r"[؀-ۿ]", "", text)
    text = re.sub(r"[฀-๿]", "", text)
    text = re.sub(r"[Ѐ-ӿ]", "", text)
    text = re.sub(r"[ऀ-ॿ]", "", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def ask_ai(prompt: str, system: str = "") -> str:
    if not GROQ_KEYS:
        return ""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    for key_idx, api_key in enumerate(GROQ_KEYS):
        for attempt in range(1, 4):
            try:
                r = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": "llama-3.3-70b-versatile", "messages": messages, "temperature": 0.4},
                    timeout=30,
                )
                if r.status_code == 429:
                    wait = min(int(r.headers.get("retry-after", 30)) + 5, 90)
                    print(f"    ⏳ Groq 키{key_idx+1} 속도 제한 — {wait}초 대기 ({attempt}/3)...")
                    time.sleep(wait)
                    continue
                r.raise_for_status()
                return _sanitize(r.json()["choices"][0]["message"]["content"].strip())
            except Exception as e:
                if attempt == 3:
                    print(f"    ⚠️ Groq 키{key_idx+1} 실패: {e}")
        if key_idx < len(GROQ_KEYS) - 1:
            print(f"    ⚠️ Groq 키{key_idx+1} 소진 → 키{key_idx+2}로 전환...")
    return ""


def search_naver_news(keyword, display=5):
    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id":     NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": keyword, "display": display, "sort": "date"}
    try:
        r = requests.get(url, headers=headers, params=params, timeout=10)
        r.raise_for_status()
        return r.json().get("items", [])
    except Exception as e:
        print(f"    ⚠️  [{keyword}] 검색 실패: {e}")
        return []


def clean_html(text):
    return re.sub(r"<[^>]+>", "", text).strip()


def extract_source(url):
    mapping = {
        "yna.co.kr": "연합뉴스", "ytn.co.kr": "YTN",
        "mbc.co.kr": "MBC", "sbs.co.kr": "SBS",
        "kbs.co.kr": "KBS", "hankyung.com": "한국경제",
        "etnews.com": "전자신문", "heraldcorp.com": "헤럴드경제",
        "chosun.com": "조선일보", "joongang.co.kr": "중앙일보",
        "donga.com": "동아일보", "hani.co.kr": "한겨레",
        "khan.co.kr": "경향신문", "ohmynews.com": "오마이뉴스",
    }
    for domain, name in mapping.items():
        if domain in url:
            return name
    return "뉴스"


def fetch_all():
    categorized = {}
    seen_links = set()
    for cat, keywords in CATEGORIES.items():
        articles = []
        for kw in keywords:
            if len(articles) >= MAX_PER_CATEGORY:
                break
            items = search_naver_news(kw, display=MAX_PER_CATEGORY)
            for item in items:
                link = item.get("originallink") or item.get("link", "")
                if link in seen_links:
                    continue
                seen_links.add(link)
                articles.append({
                    "title":   clean_html(item.get("title", "")),
                    "link":    link,
                    "summary": clean_html(item.get("description", ""))[:200],
                    "source":  extract_source(link),
                })
                if len(articles) >= MAX_PER_CATEGORY:
                    break
            time.sleep(0.2)
        categorized[cat] = articles
        print(f"    {cat}: {len(articles)}개")
    return categorized


def build_ai_summary(categorized: dict) -> dict:
    print("  🤖 AI 요약 & TOP 3 생성 중...")
    all_articles = []
    for cat, arts in categorized.items():
        for a in arts:
            all_articles.append(f"[{cat}] [{a['source']}] {a['title']}: {a['summary']}")

    articles_text = "\n".join(all_articles)
    cat_list = list(categorized.keys())
    cat_example = {cat: "2~3문장 핵심 요약" for cat in cat_list}

    prompt = f"""오늘의 뉴스 기사들을 분석해주세요. 반드시 한국어로만 응답하세요.

[오늘의 뉴스]
{articles_text}

아래 JSON 형식으로 정확히 응답하세요.
⚠️ category_summaries의 키는 반드시 아래 목록 중 하나만 사용하세요:
{json.dumps(cat_list, ensure_ascii=False)}

{{
  "top3": [
    {{"rank": 1, "title": "제목", "why": "중요한 이유 한 문장", "category": "위 목록 중 하나"}},
    {{"rank": 2, "title": "제목", "why": "중요한 이유 한 문장", "category": "위 목록 중 하나"}},
    {{"rank": 3, "title": "제목", "why": "중요한 이유 한 문장", "category": "위 목록 중 하나"}}
  ],
  "category_summaries": {json.dumps(cat_example, ensure_ascii=False)}
}}
JSON 외 다른 텍스트는 절대 포함하지 마세요."""

    raw = ask_ai(prompt, system="당신은 한국어 뉴스 분석 전문가입니다. 항상 JSON으로만 응답합니다.")
    if not raw:
        return {"top3": [], "category_summaries": {}}
    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        valid_cats = set(cat_list)
        result["category_summaries"] = {
            k: v for k, v in result.get("category_summaries", {}).items()
            if k in valid_cats
        }
        return result
    except Exception as e:
        print(f"    ⚠️ AI 요약 파싱 실패: {e}")
        return {"top3": [], "category_summaries": {}}


def generate_talking_points(categorized: dict, top3: list) -> dict:
    top3_titles = [t.get("title", "") for t in top3]
    top3_exclude = "\n".join(f"- {t}" for t in top3_titles if t)

    other_articles = []
    for cat, arts in categorized.items():
        for a in arts[:5]:
            title   = a.get("title", "")
            summary = a.get("summary", "")[:120]
            if any(title[:15] in t or t[:15] in title for t in top3_titles):
                continue
            other_articles.append(
                f"[{cat}] {title}" + (f"\n  → {summary}" if summary else "")
            )
    articles_text = "\n\n".join(other_articles[:25])

    prompt = f"""오늘 뉴스 중 직장 동료와 점심·커피 타임에 꺼내기 좋은 이야깃거리 3개를 골라주세요.

⚠️ 아래 주제는 이미 'AI 트렌드 브리핑'에서 다뤘으므로 절대 사용하지 마세요:
{top3_exclude}

[이야깃거리 후보 뉴스]
{articles_text}

아래 JSON 형식으로만 응답하세요:
{{
  "one_line_insight": "오늘 뉴스 전체를 관통하는 흥미로운 한 줄 인사이트",
  "talking_points": [
    {{
      "topic": "이야깃거리 제목 (15자 이내)",
      "context": "배경 설명 2~3문장.",
      "question": "동료에게 던질 수 있는 대화 유도 질문 1개",
      "business_impact": "우리 일상·경제에 미치는 영향 1문장"
    }}
  ]
}}
JSON 외 다른 텍스트 없이 응답하세요."""

    raw = ask_ai(prompt, system="당신은 한국어 뉴스 큐레이터입니다. 항상 JSON으로만 응답합니다.")
    if not raw:
        return {}
    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"    ⚠️ talking_points 파싱 실패: {e}")
        return {}


def insert_to_supabase(categorized, today):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️  SUPABASE 설정 없음 — news_cards 저장 스킵")
        return
    rows = []
    for cat, articles in categorized.items():
        for a in articles:
            rows.append({
                "date":      today,
                "title":     a["title"],
                "summary":   a.get("summary", ""),
                "link":      a.get("link", ""),
                "source":    a.get("source", ""),
                "image_url": None,
                "category":  cat,
            })
    if not rows:
        return
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        client.table("news_cards").insert(rows).execute()
        print(f"    [Supabase] news_cards {len(rows)}건 insert 완료")
    except Exception as e:
        print(f"    [Supabase] news_cards insert 실패: {e}")


def insert_trends_to_supabase(ai_summary, today, talking_points=None):
    if not ai_summary or not SUPABASE_URL or not SUPABASE_KEY:
        return
    raw_sums = ai_summary.get("category_summaries", {})
    clean_sums = {
        k: v for k, v in raw_sums.items()
        if k and all("가" <= c <= "힣" or c in " /·()" or c.isascii() for c in k)
    }
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        payload = {
            "date":               today,
            "top3":               ai_summary.get("top3", []),
            "category_summaries": clean_sums,
        }
        if talking_points:
            payload["talking_points"] = talking_points
        client.table("news_trends").upsert(payload, on_conflict="date").execute()
        print("    [Supabase] news_trends insert 완료")
    except Exception as e:
        print(f"    [Supabase] news_trends insert 실패: {e}")


def save_output(categorized, ai_summary, talking_points=None):
    """pipeline/output/{TODAY}.md 와 {TODAY}_data.json 저장"""
    today_str = date.today().strftime("%Y년 %m월 %d일")
    lines = [f"# 📰 뉴스레터 - {today_str}", ""]

    top3 = ai_summary.get("top3", [])
    if top3:
        lines += ["## 📌 오늘의 TOP 3", ""]
        for item in top3:
            lines.append(f'{item["rank"]}. **{item["title"]}** — {item["why"]}')
        lines += ["", "---", ""]

    summaries = ai_summary.get("category_summaries", {})
    for cat, articles in categorized.items():
        lines.append(f"## {cat}")
        if summaries.get(cat):
            lines.append(f"> {summaries[cat]}")
            lines.append("")
        for a in articles:
            desc = f" — {a['summary']}" if a["summary"] else ""
            lines.append(f"- **[{a['source']}] [{a['title']}]({a['link']})**{desc}")
        lines.append("")

    lines += ["---", f"*수집 시각: {datetime.now().strftime('%Y-%m-%d %H:%M')}*"]
    content = "\n".join(lines)

    md_path = os.path.join(OUTPUT_DIR, f"{TODAY}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"    저장 완료: {md_path}")

    simplified = {
        cat: [
            {"title": a["title"], "source": a["source"],
             "link": a["link"], "summary": a["summary"]}
            for a in arts
        ]
        for cat, arts in categorized.items()
    }
    data = {
        "ai_summary":    ai_summary,
        "categorized":   simplified,
        "collected_at":  datetime.now().strftime("%Y-%m-%d %H:%M"),
        "talking_points": talking_points,
    }
    data_path = os.path.join(OUTPUT_DIR, f"{TODAY}_data.json")
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"    데이터 저장 완료: {data_path}")


def _retry(label, fn, *args, **kwargs):
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            last_err = e
            if attempt < MAX_RETRIES:
                print(f"  ⚠️  [{label}] 실패 (시도 {attempt}/{MAX_RETRIES}): {e}")
                print(f"      {RETRY_DELAY}초 후 재시도...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"  ❌ [{label}] {MAX_RETRIES}회 모두 실패: {e}")
    raise last_err


def main():
    print(f"\n📰 뉴스 수집 시작 — {TODAY}")
    print("━" * 50)

    # supabase_logger import (실패해도 계속)
    try:
        sys.path.insert(0, PIPELINE_DIR)
        from agents.supabase_logger import update_agent_status, log_action
        update_agent_status("수집봇", "online", "뉴스 수집 중")
        log_action("수집봇", "수집 시작", f"날짜: {TODAY}")
    except Exception:
        update_agent_status = log_action = lambda *a, **k: None

    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("❌ NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 없음 → .env 확인")
        update_agent_status("수집봇", "offline", "")
        sys.exit(1)

    print("\n[1/4] 뉴스 수집 중...")
    categorized = fetch_all()
    log_action("수집봇", "네이버 뉴스 수집 완료",
               f"총 {sum(len(v) for v in categorized.values())}건")

    print("\n[2/4] AI 요약 & TOP 3 생성 중...")
    try:
        ai_summary = _retry("AI 요약", build_ai_summary, categorized)
        top3_count = len(ai_summary.get("top3", []))
        print(f"    TOP {top3_count}개 선정 완료")
        log_action("수집봇", "AI 요약 완료", f"TOP {top3_count}")
    except Exception as e:
        print(f"  ⚠️  AI 요약 최종 실패, 빈 요약으로 계속 진행: {e}")
        ai_summary = {"top3": []}

    print("\n[2.5/4] 오늘의 이야깃거리 생성 중...")
    try:
        talking_points = generate_talking_points(categorized, ai_summary.get("top3", []))
        tp_count = len(talking_points.get("talking_points", []))
        print(f"    이야깃거리 {tp_count}개 생성 완료")
    except Exception as e:
        print(f"  ⚠️  이야깃거리 생성 실패 (무시): {e}")
        talking_points = {}

    print("\n[3/4] 출력 파일 저장 중...")
    _retry("출력 저장", save_output, categorized, ai_summary, talking_points)

    print("\n[4/4] Supabase 저장 중...")
    insert_to_supabase(categorized, TODAY)
    insert_trends_to_supabase(ai_summary, TODAY, talking_points)
    log_action("수집봇", "Supabase 저장 완료", f"{TODAY}")

    update_agent_status("수집봇", "idle", "수집 완료")
    print(f"\n✅ 뉴스 수집 완료! — {TODAY}\n")


if __name__ == "__main__":
    main()
