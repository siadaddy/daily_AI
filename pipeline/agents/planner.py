import json, re, html, os
from datetime import date, timedelta
from utils.gemini_client import ask_gemini
from utils.agent_memory import remember, get_hints

SYSTEM = """당신은 콘텐츠 브리프를 작성하는 편집자입니다. JSON만 출력합니다."""

NEWSLETTER_MAX_CHARS = 3000
ARTICLE_PER_CAT = 3


def _load_recent_used_titles(days: int = 3) -> list:
    """최근 N일간 카드뉴스에 사용된 헤드라인 로드 (Supabase card_news 테이블)"""
    try:
        from supabase import create_client
        client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_KEY", ""),
        )
        cutoff = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
        resp = client.table("card_news").select("date, cards").gte("date", cutoff).execute()
        used = []
        for row in (resp.data or []):
            for card in (row.get("cards") or []):
                h = card.get("headline", "").strip()
                if h:
                    used.append(h)
        return used
    except Exception as e:
        print(f"  ⚠️  최근 사용 헤드라인 로드 실패 (무시): {e}")
        return []


_PLAN_STOP = {
    '의','을','를','이','가','은','는','에','도','와','과','로','으로',
    '그','및','등','관련','대한','위한','따른','하는','하고','하여',
    '했다','한다','있다','있어','됐다','통해','위해','대해',
}


def _title_overlap(t1: str, t2: str) -> float:
    def kw(s):
        return {w for w in re.sub(r'[^\w\s]', '', s).split()
                if len(w) > 1 and w not in _PLAN_STOP}
    ka, kb = kw(t1), kw(t2)
    if not ka or not kb:
        return 0.0
    return len(ka & kb) / min(len(ka), len(kb))


def run(newsletter_text: str, newsletter_data: dict = None) -> dict:
    print("🎯 기획자 에이전트 실행 중...")

    if len(newsletter_text) > NEWSLETTER_MAX_CHARS:
        newsletter_text = newsletter_text[:NEWSLETTER_MAX_CHARS] + "\n...(이하 생략)"

    article_list_text = ""
    if newsletter_data and newsletter_data.get("categorized"):
        candidates = []
        for cat, articles in newsletter_data["categorized"].items():
            for a in articles[:ARTICLE_PER_CAT]:
                candidates.append((cat, a))

        recent_used = _load_recent_used_titles(days=3)
        if recent_used:
            print(f"  📅 최근 3일 사용 헤드라인 {len(recent_used)}건 로드 (중복 방지)")

        DEDUP_THR = 0.7
        deduped, seen_titles = [], list(recent_used)
        cross_removed = 0
        for cat, a in candidates:
            title = html.unescape(a.get("title", ""))
            if any(_title_overlap(title, t) >= DEDUP_THR for t in seen_titles):
                cross_removed += 1
                continue
            deduped.append((cat, a))
            seen_titles.append(title)

        removed = len(candidates) - len(deduped)
        if removed:
            print(f"  🔍 중복 기사 {removed}건 제거 (날짜간 {cross_removed}건 포함)")

        lines = []
        for cat, a in deduped:
            title   = html.unescape(a.get("title", ""))
            link    = a.get("link", "")
            summary = html.unescape(a.get("summary", "") or a.get("body", "")).strip()[:400]
            if summary:
                lines.append(f"[{cat}] {title}\n  내용: {summary}\n  URL: {link}")
            else:
                lines.append(f"[{cat}] {title}\n  URL: {link}")
        article_list_text = "\n\n".join(lines)

    memory_hints = get_hints("박기획")

    prompt = f"""아래 뉴스 데이터에서 오늘의 핵심 뉴스 5개를 골라 콘텐츠 브리프를 JSON으로 작성하세요.{memory_hints}

=== 원문 뉴스 (제목 + 실제 내용 요약 + URL) ===
{article_list_text if article_list_text else newsletter_text}

=== 출력 JSON 형식 ===
{{
  "instagram": [
    {{
      "headline": "핵심 제목 (25자 이내, 클릭하고 싶어지는 제목)",
      "angle": "이 뉴스가 30~40대 독자의 삶·돈·일에 어떤 영향을 주는가 (한 줄). 단순 요약 금지 — '그래서 나한테 뭔 의미야?'에 답해야 함",
      "reader_insight": "독자가 이 카드를 읽고 얻어가야 할 핵심 관점 1문장. 시아아빠 목소리로.",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "tone": "정보전달 | 공감 | 놀라움 | 실용",
      "source_facts": "위 [내용]에서 직접 뽑은 구체적 사실들. 형식: '주체+행동+수치/결과' 로 2~4문장. 위 내용에 없는 건 절대 쓰지 마세요.",
      "source_url": "URL 그대로 복사",
      "source_name": "언론사명"
    }}
  ],
  "blog": {{
    "title": "오늘 뉴스 중 가장 임팩트 있는 단일 주제의 블로그 제목 (구체적 사건/기업/인물명 포함)",
    "main_points": [
      "이 사건의 배경 — 왜 생겼는가",
      "핵심 내용 — 구체적으로 무슨 일인가",
      "시아아빠의 해석 — 내가 이 뉴스를 이렇게 읽는 이유, 독자가 놓치면 안 되는 포인트"
    ],
    "tone": "친근하고 읽기 쉬운",
    "target": "뉴스에 관심 있는 30~40대",
    "source_facts": "위 [내용]에서 직접 뽑은 핵심 사실 4~6개. 수치·이름·날짜 포함. 없는 내용 창작 금지."
  }}
}}

규칙:
- instagram[0]: 반드시 자동차/모빌리티/전기차/수소차/자동차부품/자동차금융 관련 뉴스여야 함. 동물/사건사고/연예/스포츠는 절대 금지.
- 🏢 삼천리 그룹 카테고리에 사업전략·실적·신사업 관련 뉴스가 있으면 5개 카드 중 하나에 반드시 포함.
- 5개 카드는 반드시 서로 다른 사건/인물/기업을 다뤄야 함.
- 제외: 범죄, 연예인 사생활, 정치 편향, 미검증 루머
- 제외: 시군구 단위 지자체 소식, 복지/행사 안내
- instagram 5개 중 경제/산업/기술/국제 뉴스 최소 3개 이상 포함 필수
- blog는 반드시 instagram 5개 카드와 다른 주제로 선정
- source_facts는 반드시 50자 이상의 구체적 사실로 작성
- JSON만 출력, 다른 텍스트 없이
"""
    raw = ask_gemini(prompt, system=SYSTEM, temperature=0.65, json_mode=True, max_tokens=2500)
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        brief = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError(f"JSON 블록을 찾을 수 없음: {raw[:200]}")
        brief = json.loads(match.group())

    # blog ↔ instagram 주제 중복 검증
    blog_title = brief.get("blog", {}).get("title", "")
    instagram  = brief.get("instagram", [])
    overlap_pairs = [
        (i, _title_overlap(blog_title, item.get("headline", "")))
        for i, item in enumerate(instagram)
    ]
    max_overlap_idx, max_overlap_val = max(overlap_pairs, key=lambda x: x[1], default=(-1, 0.0))

    if max_overlap_val >= 0.7:
        card_headlines = "\n".join(
            f"  - 카드{i+1}: {item.get('headline','')}" for i, item in enumerate(instagram)
        )
        print(f"  ⚠️  blog 주제 '{blog_title[:35]}' ↔ 카드{max_overlap_idx+1} 겹침({max_overlap_val:.0%}) → blog 재선정")
        blog_regen_prompt = f"""아래 뉴스에서 blog 주제를 하나 골라 JSON으로 작성하세요.
단, 아래 instagram 카드 5개 주제와 완전히 달라야 합니다.

=== 이미 사용된 instagram 카드 주제 (blog 주제로 금지) ===
{card_headlines}

=== 원문 뉴스 ===
{article_list_text if article_list_text else newsletter_text}

출력 형식 (JSON 객체만):
{{"title": "단일 주제 블로그 제목", "main_points": ["배경","내용","의미/영향"], "tone": "친근하고 읽기 쉬운", "target": "뉴스에 관심 있는 30~40대", "source_facts": "해당 주제 구체적 사실 4~6개"}}

JSON만 출력"""
        try:
            import time as _time; _time.sleep(3)
            raw_blog = ask_gemini(blog_regen_prompt, system=SYSTEM, temperature=0.65, json_mode=True, max_tokens=800)
            raw_blog = raw_blog.replace("```json","").replace("```","").strip()
            new_blog = json.loads(raw_blog)
            new_title = new_blog.get("title", "")
            still_overlap = any(
                _title_overlap(new_title, item.get("headline","")) >= 0.7
                for item in instagram
            )
            if not still_overlap:
                brief["blog"] = new_blog
                print(f"  ✅ blog 재선정 완료: '{new_title[:40]}'")
            else:
                print(f"  ⚠️  blog 재선정 후에도 겹침 — 그대로 사용")
        except Exception as e:
            print(f"  ⚠️  blog 재선정 실패: {e} — 원본 유지")

    # instagram[0] 자동차 주제 검증
    _CAR_KW = {
        '자동차','차량','전기차','수소차','모빌리티','BMW','현대차','기아','테슬라',
        '벤츠','아우디','폭스바겐','토요타','혼다','EV','하이브리드','자율주행','충전',
        '배터리','내연기관','SUV','세단','트럭','부품','딜러','출고','리콜','카셰어링',
        '모터쇼','자동차금융','할부','카풀','완성차','카니발','팰리세이드','아이오닉',
        '제네시스','포르쉐','람보르기니','페라리','닛산','쉐보레','지프','포드',
    }

    def _is_car(item: dict) -> bool:
        text = (item.get('headline','') + item.get('angle','') + str(item.get('keywords',[])))
        return any(kw in text for kw in _CAR_KW)

    instagram = brief.get("instagram", [])
    if instagram and not _is_car(instagram[0]):
        swap_idx = next((i for i, it in enumerate(instagram[1:], 1) if _is_car(it)), None)
        if swap_idx:
            print(f"  ⚠️  instagram[0] 자동차 무관 → 카드{swap_idx+1}과 swap")
            instagram[0], instagram[swap_idx] = instagram[swap_idx], instagram[0]
        else:
            print("  ⚠️  instagram[0] 자동차 무관 + 대체 없음 → 강제 재생성")
            car_prompt = f"""아래 뉴스에서 자동차/모빌리티/전기차/수소차 관련 기사 하나를 골라 카드뉴스 브리프 JSON을 작성하세요.

=== 원문 뉴스 ===
{article_list_text if article_list_text else newsletter_text}

출력 형식 (JSON 객체만):
{{"headline":"...","angle":"...","keywords":[...],"tone":"...","source_facts":"실제 뉴스 내용에서 뽑은 구체적 사실 3~4문장 (최소 80자)","source_url":"...","source_name":"..."}}"""
            try:
                import time as _time; _time.sleep(3)
                raw_car = ask_gemini(car_prompt, system=SYSTEM, temperature=0.5, json_mode=True, max_tokens=600)
                raw_car = raw_car.replace("```json","").replace("```","").strip()
                car_item = json.loads(raw_car)
                if _is_car(car_item):
                    brief["instagram"][0] = car_item
                    print("  ✅ instagram[0] 자동차 카드 재생성 완료")
                else:
                    print("  ⚠️  재생성 후에도 자동차 무관 — 원본 유지")
            except Exception as e:
                print(f"  ⚠️  instagram[0] 재생성 실패: {e}")

    # source_facts 품질 검증
    _INVALID_FACTS = {"없음", "해당없음", "정보없음", "해당 없음", "정보 없음"}
    regenerated = 0
    for idx, item in enumerate(brief.get("instagram", [])):
        facts = str(item.get("source_facts", "")).strip()
        need_regen = len(facts) < 50 or any(kw in facts for kw in _INVALID_FACTS)
        if not need_regen:
            continue
        print(f"  ⚠️  카드{idx+1} source_facts 부실({len(facts)}자) → 단일 재생성...")
        single_prompt = f"""아래 뉴스 기사에서 카드뉴스 브리프 1개만 JSON으로 작성하세요.

=== 원문 뉴스 ===
{article_list_text if article_list_text else newsletter_text}

대상 카드:
headline: {item.get('headline')}
angle: {item.get('angle')}

출력 형식 (JSON 객체만):
{{"headline":"...","angle":"...","keywords":[...],"tone":"...","source_facts":"실제 뉴스 내용에서 뽑은 구체적 사실 3~4문장 (최소 80자)","source_url":"...","source_name":"..."}}

source_facts는 반드시 80자 이상. "없음" 금지."""
        try:
            import time as _time; _time.sleep(3)
            raw2 = ask_gemini(single_prompt, system=SYSTEM, temperature=0.65, json_mode=True, max_tokens=600)
            raw2 = raw2.replace("```json","").replace("```","").strip()
            patched = json.loads(raw2)
            if len(str(patched.get("source_facts","")).strip()) >= 50:
                brief["instagram"][idx] = patched
                regenerated += 1
                print(f"  ✅ 카드{idx+1} source_facts 재생성 완료")
            else:
                print(f"  ⚠️  카드{idx+1} 재생성 후에도 부실 — 원본 유지")
        except Exception as e:
            print(f"  ⚠️  카드{idx+1} 재생성 실패: {e}")

    total = len(brief['instagram'])
    regen_note = f" (source_facts 재생성 {regenerated}건)" if regenerated else ""
    print(f"  ✅ 인스타 {total}개, 블로그 1개 브리프 완성{regen_note}")

    remember("박기획", "topic_selection", {
        "headlines": [item.get("headline", "") for item in brief.get("instagram", [])],
        "blog_title": brief.get("blog", {}).get("title", ""),
    })

    # 자기 반성
    try:
        from utils.agent_memory import (add_diary, get_persona, get_diary,
                                        should_update_persona, update_persona)
        headlines = [it.get("headline", "") for it in brief.get("instagram", [])]
        persona   = get_persona("박기획")
        recent    = " / ".join(e["lesson"][:25] for e in get_diary("박기획", 2)) or "첫 날"

        lesson_raw = ask_gemini(
            f"너는 AI 뉴스 기획자 '박기획'이야.\n"
            f"지금까지 나: {persona[:60]}\n"
            f"최근 메모: {recent}\n"
            f"오늘 선정 헤드라인: {', '.join(headlines[:3])}\n\n"
            "오늘 기획하면서 새롭게 느끼거나 배운 점을 1문장으로. 1인칭 반말, 50자 이내.",
            temperature=0.85, max_tokens=80,
        )
        lesson = lesson_raw.strip().split("\n")[0][:150]
        if lesson:
            add_diary("박기획", lesson, trigger="daily_plan")
            print(f"  📝 박기획 오늘의 학습: {lesson[:45]}")

        if should_update_persona("박기획"):
            diary_str = "\n".join(f"- {e['lesson']}" for e in get_diary("박기획", 7))
            new_p = ask_gemini(
                f"너는 AI 기획자 '박기획'이야.\n지금까지 나: {persona}\n"
                f"최근 학습 일기:\n{diary_str}\n\n"
                "이 경험을 바탕으로 지금의 나를 2문장으로. 1인칭 반말, 70자 이내.",
                temperature=0.8, max_tokens=120,
            ).strip().split("\n")[0][:300]
            if new_p:
                update_persona("박기획", new_p)
                print("  ✨ 박기획 페르소나 진화 완료")
    except Exception as e:
        print(f"  ⚠️  박기획 자기 반성 실패 (무시): {e}")

    return brief
