#!/usr/bin/env python3
"""
🤖 시아아빠님의 AI 크리에이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
흐름:
  pipeline/output/{TODAY}.md + _data.json 읽기
    → 🎯 기획자 : 콘텐츠 브리프
    → ✍️  작가   : 카드뉴스 5개 + 블로그 아티클
    → 🎨 디자이너: 이미지 5장 → Supabase Storage
    → 🗄  Supabase: card_news / articles 저장
    → 🔔 완료 알림 (ntfy.sh)

GitHub Actions 06:00 KST (= 21:00 UTC 전날) 자동 실행
"""

import sys, os, json, time, requests
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from agents import planner, writer, designer, music_curator, weekly_trend
from agents.supabase_logger import update_agent_status, log_action

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR   = os.path.join(PIPELINE_DIR, "output")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
NTFY_TOPIC   = os.getenv("NTFY_TOPIC", "siadad-aicrew")
MAX_RETRIES  = 3
RETRY_DELAY  = 10


def notify(title: str, message: str, priority: str = "default"):
    priority_map = {"default": 3, "high": 4, "urgent": 5, "low": 2, "min": 1}
    try:
        requests.post(
            "https://ntfy.sh/",
            json={
                "topic":    NTFY_TOPIC,
                "title":    title,
                "message":  message,
                "priority": priority_map.get(priority, 3),
                "tags":     ["robot"],
            },
            timeout=5,
        )
    except Exception:
        pass


def retry(label: str, fn, *args, **kwargs):
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


def _load_today_output(today: str) -> tuple[str, dict | None]:
    """pipeline/output/{today}.md + {today}_data.json 로드"""
    md_path   = os.path.join(OUTPUT_DIR, f"{today}.md")
    data_path = os.path.join(OUTPUT_DIR, f"{today}_data.json")

    if not os.path.exists(md_path):
        raise FileNotFoundError(
            f"뉴스레터 파일 없음: {md_path}\n"
            "collect.py를 먼저 실행하거나 GitHub Actions collect 단계를 확인하세요."
        )

    with open(md_path, "r", encoding="utf-8") as f:
        newsletter = f.read()

    newsletter_data = None
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            newsletter_data = json.load(f)
        cats = len(newsletter_data.get("categorized", {}))
        print(f"  ✅ 뉴스 데이터 로드 완료 ({cats}개 카테고리)")
    else:
        print(f"  ⚠️  뉴스 데이터 파일 없음: {data_path}")

    return newsletter, newsletter_data


def _insert_to_supabase(today: str, written: dict, images: list):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️  SUPABASE_URL/KEY 미설정 — Supabase 저장 스킵")
        return
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        cards = [
            {
                "headline":    c["headline"],
                "caption":     c["caption"],
                "image_url":   images[i]["url"] if i < len(images) else None,
                "source_url":  c.get("source_url", ""),
                "source_name": c.get("source_name", ""),
            }
            for i, c in enumerate(written.get("captions", []))
        ]
        if cards:
            client.table("card_news").upsert(
                {"date": today, "cards": cards}, on_conflict="date"
            ).execute()
            print(f"  ✅ Supabase card_news 저장 완료 ({len(cards)}개)")
            log_action("이작가", "card_news 저장", f"{today} / {len(cards)}개 카드")

        article_content = written.get("article", "")
        article_title   = written.get("blog_title", "")
        if article_content:
            client.table("articles").upsert(
                {"date": today, "title": article_title, "content": article_content},
                on_conflict="date",
            ).execute()
            print("  ✅ Supabase articles 저장 완료")
            log_action("이작가", "articles 저장", f"{today} / {article_title[:30]}")
    except Exception as e:
        print(f"  ⚠️  Supabase 저장 실패 (무시): {e}")


def _should_run_weekly_trend() -> bool:
    return date.today().weekday() == 0  # 월요일


def _should_run_music() -> bool:
    """마지막 음악 수집이 90일 이상 지났으면 True (agent_memories 기준)"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return True
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/agent_memories"
            "?agent_name=eq.한뮤직&select=updated_at",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
            timeout=5,
        )
        if r.status_code != 200 or not r.json():
            return True
        updated_at = r.json()[0].get("updated_at")
        if not updated_at:
            return True
        last = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        days = (datetime.now(last.tzinfo) - last).days
        return days >= 90
    except Exception:
        return True


def main():
    today = date.today().strftime("%Y-%m-%d")
    print(f"\n🤖 시아아빠님의 AI 크리에이터 시작 — {today}")
    print("━" * 50)

    # ── Step 1: 뉴스레터 읽기 ────────────────────────────────
    print("\n[1/5] 오늘 뉴스레터 읽는 중...")
    update_agent_status("박기획", "online", "뉴스레터 로드 대기")
    try:
        newsletter, newsletter_data = retry("뉴스레터 로드", _load_today_output, today)
        print(f"  ✅ 뉴스레터 로드 완료 ({len(newsletter)}자)")
        log_action("박기획", "뉴스레터 로드", f"{today} / {len(newsletter)}자")
    except Exception as e:
        notify("❌ AI 크리에이터 실패", f"뉴스레터 로드 실패: {e}", priority="high")
        update_agent_status("박기획", "offline", "")
        sys.exit(1)

    # ── Step 2: 기획자 ───────────────────────────────────────
    print("\n[2/5] 기획자 에이전트...")
    update_agent_status("박기획", "online", "콘텐츠 브리프 작성 중")
    log_action("박기획", "기획 시작", f"{today}")
    try:
        brief = retry("기획자", planner.run, newsletter, newsletter_data)
        log_action("박기획", "기획 완료",
                   f"카드 {len(brief.get('instagram',[]))}개 / 블로그: {brief.get('blog',{}).get('title','')[:30]}")
        update_agent_status("박기획", "idle", "기획 완료")
    except Exception as e:
        notify("❌ AI 크리에이터 실패", f"기획자 실패: {e}", priority="high")
        update_agent_status("박기획", "offline", "")
        sys.exit(1)

    # ── Step 3: 작가 ─────────────────────────────────────────
    print("\n[3/5] 작가 에이전트...")
    update_agent_status("이작가", "online", "카드뉴스 작성 중")
    log_action("이작가", "작성 시작", f"{today}")
    try:
        written = retry("작가", writer.run, brief)
        log_action("이작가", "작성 완료",
                   f"카드뉴스 {len(written.get('captions',[]))}개 / 블로그 {len(written.get('article',''))}자")
        update_agent_status("이작가", "idle", "작성 완료")
    except Exception as e:
        notify("❌ AI 크리에이터 실패", f"작가 실패: {e}", priority="high")
        update_agent_status("이작가", "offline", "")
        sys.exit(1)

    # ── Step 4: 디자이너 ─────────────────────────────────────
    print("\n[4/5] 디자이너 에이전트...")
    update_agent_status("최디자", "online", "이미지 생성 중")
    log_action("최디자", "이미지 생성 시작", f"{today} / {len(brief['instagram'])}장")
    try:
        images = retry("디자이너", designer.run, brief, written)
        img_ok = sum(1 for img in images if img["success"])
        log_action("최디자", "이미지 생성 완료", f"{img_ok}/{len(images)}장 성공")
        update_agent_status("최디자", "idle", f"이미지 {img_ok}장 완료")
    except Exception as e:
        print(f"  ⚠️  이미지 생성 실패, 빈 이미지로 계속 진행: {e}")
        images = [
            {"headline": item["headline"], "prompt": "", "url": None, "success": False}
            for item in brief["instagram"]
        ]
        img_ok = 0
        log_action("최디자", "이미지 생성 실패", str(e)[:100])
        update_agent_status("최디자", "idle", "이미지 실패")

    # ── Supabase 저장 ─────────────────────────────────────────
    _insert_to_supabase(today, written, images)

    # ── 완료 알림 ────────────────────────────────────────────
    summary = (
        f"✅ AI 크리에이터 완료!\n"
        f"   📰 카드뉴스    : {len(written['captions'])}개\n"
        f"   📝 블로그 아티클: 1개\n"
        f"   🖼  이미지       : {img_ok}/{len(images)}장\n"
    )
    print("\n" + "━" * 50)
    print(summary)
    notify(
        "✅ AI 크리에이터 완료",
        f"오늘 콘텐츠 준비됐어요!\n카드뉴스 {len(written['captions'])}개 · 이미지 {img_ok}장",
    )

    # ── Step 5: 음악 큐레이션 (90일 주기) ────────────────────
    print("\n[5/5] 음악 큐레이터 에이전트...")
    if _should_run_music():
        update_agent_status("한뮤직", "online", "음악 큐레이션 중")
        log_action("한뮤직", "음악 수집 시작", f"{today}")
        try:
            songs = retry("음악 큐레이터", music_curator.run)
            music_curator.save(songs)
            log_action("한뮤직", "음악 수집 완료", f"신규 {len(songs)}곡")
            update_agent_status("한뮤직", "idle", f"신규 {len(songs)}곡 추가")
            notify("🎵 음악 큐레이션 완료", f"신규 {len(songs)}곡 추가됨", priority="low")
        except Exception as e:
            print(f"  ⚠️  음악 큐레이션 실패: {e}")
            log_action("한뮤직", "음악 수집 실패", str(e)[:100])
            update_agent_status("한뮤직", "idle", "수집 실패")
            notify("⚠️ 음악 큐레이션 실패", f"오류: {e}", priority="high")
    else:
        print("  ⏭  음악 수집 스킵 (마지막 수집 90일 미경과)")
        music_curator.reflect()

    # ── 주간 트렌드 브리핑 (월요일만) ───────────────────────
    if _should_run_weekly_trend():
        print("\n[6/6] 주간 트렌드 브리핑...")
        update_agent_status("AI주간트렌드", "online", "주간 분석 중")
        log_action("AI주간트렌드", "주간 분석 시작", f"{today}")
        try:
            result = weekly_trend.run()
            if result:
                log_action("AI주간트렌드", "주간 분석 완료",
                           result.get("week_summary", "")[:60])
            update_agent_status("AI주간트렌드", "idle", "주간 분석 완료")
        except Exception as e:
            print(f"  ⚠️  주간 트렌드 실패 (무시): {e}")
            log_action("AI주간트렌드", "주간 분석 실패", str(e)[:100])
            update_agent_status("AI주간트렌드", "idle", "분석 실패")
            notify("⚠️ 주간 트렌드 생성 실패", f"오류: {e}", priority="low")
    else:
        print("\n[6/6] 주간 트렌드 스킵 (월요일 아님)")


if __name__ == "__main__":
    main()
