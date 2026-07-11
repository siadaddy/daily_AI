"""
네이버 블로그 발행용 콘텐츠 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
articles(AI 편집장 글) + card_news(카드뉴스 이미지 5장)를 조합해
네이버 블로그에 그대로 붙여넣기 좋은 HTML 미리보기 파일을 생성한다.

⚠️ 완전 자동 발행이 아닌 이유:
네이버는 블로그 글쓰기용 공개/XML-RPC API를 사실상 제공하지 않으며(계정별로
"글쓰기 API 설정" 메뉴 자체가 노출되지 않음), 2025년 7월부터 브라우저 자동화
(Selenium/Playwright 등)로 이뤄지는 블로그 관련 행위를 비정상 행위로 탐지해
계정 제한까지 가능하다. 따라서 이 모듈은 발행을 자동화하지 않고,
"제목 + 본문(HTML) + 카드뉴스 이미지"를 사람이 스마트에디터에 복사/붙여넣기만
하면 되는 형태로 준비해 pipeline/output/naver_post_{date}.html 에 저장한다.
"""

import argparse
import os
import re
import sys

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
    SUPABASE_URL = "https://" + SUPABASE_URL

SITE_URL = os.getenv("SITE_URL", "")  # 예: https://siadad-ai.vercel.app

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


def _fetch_content(today: str) -> tuple[dict | None, list[dict]]:
    """Supabase에서 오늘자 articles / card_news row를 조회"""
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

    article_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/articles?date=eq.{today}&select=title,content",
        headers=headers,
        timeout=10,
    )
    article_res.raise_for_status()
    article_rows = article_res.json()
    article = article_rows[0] if article_rows else None

    cards_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/card_news?date=eq.{today}&select=cards",
        headers=headers,
        timeout=10,
    )
    cards_res.raise_for_status()
    card_rows = cards_res.json()
    cards = card_rows[0]["cards"] if card_rows and card_rows[0].get("cards") else []

    return article, cards


def _md_to_html(md: str) -> str:
    """articles.content(마크다운) → HTML. src/lib/utils/caption.ts mdToHtml()과 동일한 규칙."""
    lines = md.replace("\\n", "\n").split("\n")
    html_parts: list[str] = []
    in_list = False

    def close_list():
        nonlocal in_list
        if in_list:
            html_parts.append("</ul>")
            in_list = False

    for raw_line in lines:
        line = raw_line.strip()
        if line.startswith("### "):
            close_list()
            html_parts.append(f"<h3>{line[4:]}</h3>")
        elif line.startswith("## "):
            close_list()
            html_parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("# "):
            close_list()
            html_parts.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("> "):
            close_list()
            html_parts.append(f"<blockquote>{line[2:]}</blockquote>")
        elif line.startswith("- "):
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{line[2:]}</li>")
        elif line and all(w.startswith("#") for w in line.split()):
            close_list()
            tags = "".join(f"<span>{t}</span> " for t in line.split())
            html_parts.append(f"<div>{tags}</div>")
        elif line:
            close_list()
            html_parts.append(f"<p>{line}</p>")
    close_list()

    html = "".join(html_parts)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)


def build_body_html(article: dict, cards: list[dict]) -> str:
    """articles 본문 + card_news 이미지를 합친 본문 HTML.
    이미지는 Supabase 공개 URL을 그대로 사용 — 미리보기 페이지에서
    이미지를 직접 복사하면 스마트에디터가 붙여넣을 때 자체 서버로 재업로드한다."""
    body = _md_to_html(article.get("content", ""))

    cards_html = []
    for card in cards:
        headline = card.get("headline", "")
        caption = card.get("caption", "")
        image_url = card.get("image_url")
        block = f"<h3>{headline}</h3>"
        if image_url:
            block += f'<img src="{image_url}" alt="{headline}" style="max-width:100%" />'
        block += f"<p>{caption}</p>"
        cards_html.append(block)

    footer = ""
    if SITE_URL:
        footer = (
            f'<hr/><p>👉 매일 자동으로 업데이트되는 전체 뉴스레터·리포트는 '
            f'<a href="{SITE_URL}" target="_blank" rel="noopener">시아아빠의 AI 데일리</a>'
            f"에서 확인하실 수 있어요.</p>"
        )

    return body + "<hr/>" + "".join(cards_html) + footer


def build_preview_page(title: str, body_html: str) -> str:
    """복사/붙여넣기 전용 미리보기 HTML 페이지.
    브라우저로 열어 본문 영역을 전체 선택(Ctrl+A) → 복사 → 네이버 스마트에디터에
    붙여넣으면 제목/문단/이미지가 서식과 함께 옮겨진다."""
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<style>
  body {{ font-family: -apple-system, sans-serif; max-width: 720px; margin: 40px auto; line-height: 1.7; }}
  .notice {{ background: #fff3cd; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; }}
  #copy-target h1, #copy-target h2, #copy-target h3 {{ margin-top: 1.5em; }}
  #copy-target img {{ max-width: 100%; border-radius: 8px; }}
  #copy-target blockquote {{ border-left: 3px solid #999; padding-left: 12px; color: #555; }}
</style>
</head>
<body>
  <div class="notice">
    📋 아래 본문 영역을 클릭한 뒤 전체 선택(Ctrl+A / Cmd+A) → 복사(Ctrl+C / Cmd+C)하여
    네이버 블로그 스마트에디터 본문에 붙여넣으세요. 제목은 별도로 옮겨야 합니다.
  </div>
  <h1>{title}</h1>
  <div id="copy-target">
{body_html}
  </div>
</body>
</html>
"""


def generate_post(today: str) -> str | None:
    """오늘자 네이버 블로그 발행용 미리보기 HTML을 생성해 파일 경로를 반환"""
    article, cards = _fetch_content(today)
    if not article:
        print(f"  ⚠️  [naver_blog] {today} articles 없음 — 콘텐츠 생성 스킵")
        return None

    title = article.get("title") or f"{today} AI 뉴스 브리핑"
    body_html = build_body_html(article, cards)
    page = build_preview_page(title, body_html)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"naver_post_{today}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)

    return out_path


def run(today: str) -> str | None:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️  SUPABASE_URL/KEY 미설정 — 네이버 블로그 콘텐츠 생성 스킵")
        return None

    try:
        out_path = generate_post(today)
        if out_path:
            print(f"  ✅ 네이버 블로그용 콘텐츠 생성 완료: {out_path}")

            try:
                from agents.supabase_logger import log_action

                log_action("이작가", "네이버 블로그용 콘텐츠 생성", out_path)
            except Exception:
                pass
        return out_path
    except Exception as e:
        print(f"  ⚠️  [naver_blog] 콘텐츠 생성 실패 (무시): {e}")
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="네이버 블로그용 발행 콘텐츠 생성 (수동 발행용, 테스트 가능)")
    parser.add_argument("--date", required=True, help="콘텐츠 생성할 날짜 (YYYY-MM-DD)")
    args = parser.parse_args()
    run(args.date)
    sys.exit(0)
