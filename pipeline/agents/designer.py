import os, json, re as _re, time, textwrap
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from utils.gemini_client import ask_gemini
from utils.agent_memory import remember, get_hints

load_dotenv()

SYSTEM = """
You are a creative art director specializing in bright, modern news infographic visuals for Korean SNS and digital media.
Your style is clean, optimistic, and visually engaging — think Bloomberg, Wired, and The Economist cover art.
Key rules:
- Always use bright, vivid colors (blues, greens, warm oranges, clean whites)
- Prefer symbolic or conceptual illustrations over realistic war/disaster imagery
- For economic news: upward graphs, glowing cityscapes, tech devices
- For car news: sleek studio shots, open roads, dynamic angles in daylight
- For AI/tech news: clean futuristic interfaces, glowing circuits, bright labs
- No dark skies, explosions, suffering, or dramatic shadows
- Always write in English. Keep prompts under 70 words.
"""

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
    SUPABASE_URL = "https://" + SUPABASE_URL
BUCKET = "card-images"


def _upload_to_supabase(image_bytes: bytes, filename: str) -> str | None:
    """Supabase Storage에 이미지 업로드 → public URL 반환"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        import requests as _req
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
        r = _req.post(
            url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "image/png",
                "x-upsert": "true",
            },
            data=image_bytes,
            timeout=30,
        )
        if r.status_code in (200, 201):
            return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
        print(f"    ⚠️  Supabase Storage 업로드 실패 ({r.status_code}): {r.text[:100]}")
        return None
    except Exception as e:
        print(f"    ⚠️  Supabase Storage 업로드 오류: {e}")
        return None


def run(brief: dict, writer_output: dict) -> list:
    print("🎨 디자이너 에이전트 실행 중... (HF Flux → Supabase Storage)")

    _KST = timezone(timedelta(hours=9))
    today = datetime.now(_KST).strftime("%Y-%m-%d")
    items = brief["instagram"]

    # 배치 이미지 프롬프트 생성
    batch_input = "\n".join(
        f"{i+1}. headline: {it['headline']} | angle: {it['angle']} | tone: {it['tone']}"
        for i, it in enumerate(items)
    )
    designer_hints = get_hints("최디자")
    batch_prompt = f"""Create {len(items)} image prompts for Korean SNS news card visuals.

{batch_input}

Style rules (MUST follow):
- Bright, vivid, optimistic colors — NO dark skies, NO explosions, NO suffering
- Clean modern aesthetic (Bloomberg / Wired magazine style)
- Use symbolic/conceptual visuals instead of literal war or disaster scenes
- Cars → sleek studio or open road in daylight. Economy → glowing charts or cityscapes. AI/Tech → clean futuristic interfaces
- No text, no logos, 70 words max per prompt{designer_hints}

Return ONLY a JSON array, no markdown:
[{{"idx":1,"prompt":"..."}},{{"idx":2,"prompt":"..."}},...,{{"idx":{len(items)},"prompt":"..."}}]"""

    raw = ask_gemini(batch_prompt, system=SYSTEM, temperature=0.7, max_tokens=1500)
    raw = raw.strip().replace("```json", "").replace("```", "").strip()

    try:
        prompt_list = json.loads(raw)
        prompt_map = {p["idx"]: p["prompt"][:350] for p in prompt_list}
    except Exception as e:
        print(f"  ⚠️  프롬프트 JSON 파싱 실패: {e} — 기본값 사용")
        prompt_map = {i+1: items[i]["headline"] for i in range(len(items))}

    images = []
    for i, item in enumerate(items):
        img_prompt = prompt_map.get(i + 1, item["headline"])
        filename = f"{today}/{today}_image_{i+1}.png"

        print(f"  🖼  이미지 {i+1}/{len(items)} 생성: {item['headline'][:30]}...")

        image_bytes = _generate_image_hf(img_prompt)
        if not image_bytes:
            print(f"    → HF 실패, PIL 카드로 대체")
            image_bytes = _generate_image_pil_bytes(item["headline"], i)

        url = None
        success = False
        if image_bytes:
            url = _upload_to_supabase(image_bytes, filename)
            success = url is not None
            if success:
                print(f"  ✅ 이미지 {i+1} Supabase 업로드 완료")
            else:
                print(f"  ⚠️  이미지 {i+1} 업로드 실패")
        else:
            print(f"  ⚠️  이미지 {i+1} 생성 실패")

        images.append({
            "headline": item["headline"],
            "prompt":   img_prompt,
            "url":      url,
            "success":  success,
        })
        remember("최디자", "image_result", {
            "headline": item["headline"],
            "success":  success,
        })

    # 자기 반성
    try:
        from utils.agent_memory import (add_diary, get_persona, get_diary,
                                        should_update_persona, update_persona)
        success_cnt = sum(1 for img in images if img["success"])
        persona = get_persona("최디자")
        recent = " / ".join(e["lesson"][:25] for e in get_diary("최디자", 2)) or "첫 날"
        ctx = (f"이미지 {success_cnt}/{len(images)}장 성공. "
               + ("전체 성공!" if success_cnt == len(images) else "일부 실패"))

        lesson_raw = ask_gemini(
            f"너는 AI 이미지 디자이너 '최디자'야.\n"
            f"지금까지 나: {persona[:60]}\n최근 메모: {recent}\n오늘 결과: {ctx}\n\n"
            "오늘 이미지 만들면서 느끼거나 배운 점 1문장. 1인칭 반말, 50자 이내.",
            temperature=0.85, max_tokens=80,
        )
        lesson = lesson_raw.strip().split("\n")[0][:150]
        if lesson:
            add_diary("최디자", lesson, trigger="daily_design")
            print(f"  📝 최디자 오늘의 학습: {lesson[:45]}")

        if should_update_persona("최디자"):
            diary_str = "\n".join(f"- {e['lesson']}" for e in get_diary("최디자", 7))
            new_p = ask_gemini(
                f"너는 AI 이미지 디자이너 '최디자'야.\n지금까지 나: {persona}\n"
                f"최근 학습 일기:\n{diary_str}\n\n"
                "이 경험을 바탕으로 지금의 나를 2문장으로. 1인칭 반말, 70자 이내.",
                temperature=0.8, max_tokens=120,
            ).strip().split("\n")[0][:300]
            if new_p:
                update_persona("최디자", new_p)
                print("  ✨ 최디자 페르소나 진화 완료")
    except Exception as e:
        print(f"  ⚠️  최디자 자기 반성 실패 (무시): {e}")

    return images


_HF_TOKENS = [k for k in [os.getenv("HF_TOKEN"), os.getenv("HF_TOKEN_2")] if k]


def _generate_image_hf(prompt: str) -> bytes | None:
    """Hugging Face Inference API — FLUX.1-schnell → bytes 반환 (멀티키 failover)"""
    import requests as _req
    if not _HF_TOKENS:
        return None

    full_prompt = prompt + ", bright vivid colors, clean modern design, optimistic mood, high quality"

    for token_idx, token in enumerate(_HF_TOKENS):
        token_label = f"키{token_idx + 1}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
            "x-wait-for-model": "true",
        }
        wait_times = [0, 30, 60]
        token_ok = False
        for attempt, wait in enumerate(wait_times, 1):
            if wait:
                print(f"    ⏳ {wait}초 후 재시도 ({token_label} {attempt}/3)...")
                time.sleep(wait)
            try:
                r = _req.post(
                    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
                    headers=headers,
                    json={"inputs": full_prompt, "parameters": {"width": 768, "height": 768}},
                    timeout=120,
                )
                if r.status_code in (402, 403):
                    reason = "크레딧 소진" if r.status_code == 402 else "권한 없음 (토큰에 Inference Provider 권한 필요)"
                    print(f"    ⚠️  HF {token_label} {reason} ({r.status_code}) — 다음 키 시도...")
                    break  # 재시도 무의미, 즉시 다음 토큰으로
                if r.status_code == 503:
                    print(f"    ⚠️  503 모델 로딩 중...")
                    continue
                if r.status_code != 200:
                    print(f"    ⚠️  HF API {r.status_code}: {r.text[:100]}")
                    continue
                if len(r.content) < 1000:
                    print("    ⚠️  응답 크기 너무 작음")
                    continue
                print(f"    ✅ HF {token_label} 이미지 생성 성공 (시도 {attempt})")
                return r.content
            except Exception as e:
                print(f"    ❌ HF 이미지 오류 ({token_label}): {e}")
    return None


def _generate_image_pil_bytes(headline: str, card_index: int) -> bytes | None:
    """PIL로 그라디언트+텍스트 카드 이미지 생성 → bytes 반환"""
    try:
        import io
        from PIL import Image, ImageDraw, ImageFont

        W, H = 768, 768
        themes = [
            ((8,  32,  88),  (30,  80, 180),  (100, 180, 255)),
            ((80, 30,   8),  (200,  90,  30),  (255, 170,  90)),
            ((8,  55,  28),  (28, 150,  80),  (100, 230, 150)),
            ((45,  8,  75),  (130,  45, 195),  (210, 140, 255)),
            ((8,  62,  75),  (28, 170, 195),  ( 90, 230, 245)),
        ]
        dark, mid, accent = themes[card_index % len(themes)]

        bg = Image.new("RGB", (W, H))
        bg_draw = ImageDraw.Draw(bg)
        for y in range(H):
            t = y / H
            color = tuple(int(dark[i] + t * (mid[i] - dark[i])) for i in range(3))
            bg_draw.line([(0, y), (W, y)], fill=color)

        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ov_draw = ImageDraw.Draw(overlay)

        for sz, alpha in [(300, 35), (210, 22), (130, 13)]:
            ov_draw.ellipse([W - sz, H - sz, W + sz // 2, H + sz // 2], fill=accent + (alpha,))
        for sz, alpha in [(160, 30), (100, 18)]:
            ov_draw.ellipse([-sz // 2, -sz // 2, sz, sz], fill=accent + (alpha,))

        ov_draw.rectangle([55, H // 2 - 150, W - 55, H // 2 + 150], fill=(0, 0, 0, 110))
        ov_draw.rectangle([0, H - 10, W, H], fill=accent + (255,))

        bx, by, br = 58, 62, 28
        ov_draw.ellipse([bx - br, by - br, bx + br, by + br], fill=accent + (230,))

        result = Image.alpha_composite(bg.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(result)

        font_paths = [
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/noto-cjk/NotoSansCJKkr-Regular.otf",
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
            "C:/Windows/Fonts/malgun.ttf",
            "C:/Windows/Fonts/gulim.ttc",
        ]
        font_large = font_small = None
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    font_large = ImageFont.truetype(fp, 50)
                    font_small = ImageFont.truetype(fp, 26)
                    break
                except Exception:
                    continue

        badge_num = str(card_index + 1)
        if font_small:
            draw.text((bx, by), badge_num, fill=(10, 20, 50), font=font_small, anchor="mm")
        else:
            draw.text((bx - 6, by - 9), badge_num, fill=(10, 20, 50))

        lines = textwrap.wrap(headline, width=13)[:4]
        y_cursor = H // 2 - len(lines) * 33
        for line in lines:
            if font_large:
                bbox = draw.textbbox((0, 0), line, font=font_large)
                tw = bbox[2] - bbox[0]
                tx = (W - tw) // 2
                draw.text((tx + 2, y_cursor + 2), line, font=font_large, fill=(0, 0, 0))
                draw.text((tx, y_cursor), line, font=font_large, fill=(255, 255, 255))
            else:
                draw.text((W // 4, y_cursor), line[:20], fill=(255, 255, 255))
            y_cursor += 66

        footer = "daily-ai.vercel.app"
        if font_small:
            bbox = draw.textbbox((0, 0), footer, font=font_small)
            fw = bbox[2] - bbox[0]
            draw.text(((W - fw) // 2, H - 38), footer, font=font_small, fill=(200, 220, 255))

        buf = io.BytesIO()
        result.save(buf, "PNG")
        return buf.getvalue()

    except Exception as e:
        print(f"  ❌ PIL 카드 생성 실패: {e}")
        return None
