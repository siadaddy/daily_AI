import os, re, itertools
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_KEYS = [
    k for k in [
        os.getenv("GROQ_API_KEY"),
        os.getenv("GROQ_API_KEY_2"),
        os.getenv("GROQ_API_KEY_3"),
        os.getenv("GROQ_API_KEY_4"),
    ] if k
]
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

_key_cycle = itertools.cycle(range(len(GROQ_KEYS))) if GROQ_KEYS else iter([])

_LANG_RULE = (
    "\n\n[언어 규칙] 반드시 한국어와 영어, 이모지만 사용하세요. "
    "한자·일본어·아랍어·힌디어·러시아어·베트남어·태국어 등 "
    "한국어·영어가 아닌 모든 문자는 절대 사용하지 마세요. "
    "특히 한글 단어를 한자로 표기하거나 혼용하는 것 절대 금지. "
    "독일어·프랑스어 등 외국어 단어도 금지입니다. "
    "모르는 사실은 절대 지어내지 마세요."
)


def _sanitize(text: str) -> str:
    text = re.sub(r'[一-鿿]', '', text)
    text = re.sub(r'[㐀-䶿]', '', text)
    text = re.sub(r'[\U00020000-\U0002A6DF]', '', text)
    text = re.sub(r'[぀-ゟ]', '', text)
    text = re.sub(r'[゠-ヿ]', '', text)
    text = re.sub(r'[؀-ۿ]', '', text)
    text = re.sub(r'[฀-๿]', '', text)
    text = re.sub(r'[Ѐ-ӿ]', '', text)
    text = re.sub(r'[ऀ-ॿ]', '', text)
    text = re.sub(r'[Ḁ-ỿ]', '', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


_429_models: set = set()


def reset_rate_limit_cache() -> None:
    """세션 내 429로 스킵된 Gemini 모델 캐시를 초기화한다."""
    _429_models.clear()


def _call_gemini(prompt: str, system: str, temperature: float, max_tokens: int, json_mode: bool) -> str:
    import time
    gemini_keys = [k for k in [os.getenv("GEMINI_API_KEY", ""), os.getenv("GEMINI_API_KEY_2", "")] if k]
    if not gemini_keys:
        raise RuntimeError("GEMINI_API_KEY 없음")

    gemini_models = ["gemini-2.5-flash"]

    for key_idx, gemini_key in enumerate(gemini_keys):
        key_label = f"키{key_idx + 1}"
        for model_idx, gmodel in enumerate(gemini_models):
            if gmodel in _429_models:
                continue
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gmodel}:generateContent?key={gemini_key}"
            if system:
                payload = {
                    "system_instruction": {"parts": [{"text": system + _LANG_RULE}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max(max_tokens, 8192)},
                }
            else:
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max(max_tokens, 8192)},
                }
            if json_mode:
                payload["generationConfig"]["responseMimeType"] = "application/json"

            for attempt in range(1, 4):
                try:
                    r = requests.post(url, json=payload, timeout=60)
                    r.raise_for_status()
                    result = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if key_idx > 0 or model_idx > 0 or attempt > 1:
                        print(f"  ✅ Gemini {key_label}/{gmodel} 성공" + (f" (시도 {attempt})" if attempt > 1 else ""))
                    return _sanitize(result)
                except Exception as e:
                    resp_obj = getattr(e, 'response', None)
                    status = getattr(resp_obj, 'status_code', 0)
                    body = getattr(resp_obj, 'text', '')[:200]
                    print(f"  ⚠️  Gemini {key_label}/{gmodel} 시도 {attempt}/3 실패: HTTP {status} | {body or e}")
                    if status == 429:
                        _429_models.add(gmodel)
                        print(f"      429 → {gmodel} 이번 세션 스킵, 다음 모델로 전환...")
                        break
                    if attempt < 3:
                        print(f"      15초 대기 후 재시도...")
                        time.sleep(15)

            if model_idx < len(gemini_models) - 1:
                active = [m for m in gemini_models[model_idx+1:] if m not in _429_models]
                if active:
                    print(f"  ⏳ Gemini {key_label}/{gmodel} 실패 → {active[0]}...")

        if key_idx < len(gemini_keys) - 1:
            print(f"  ⏳ Gemini {key_label} 소진 → 키{key_idx + 2}로 전환...")

    raise RuntimeError("Gemini 모든 키/모델 실패")


def _call_groq(prompt: str, system: str, temperature: float, max_tokens: int, json_mode: bool) -> str:
    import time

    messages = []
    if system:
        messages.append({"role": "system", "content": system + _LANG_RULE})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    if not GROQ_KEYS:
        raise RuntimeError("GROQ API 키 없음")

    start_idx = next(_key_cycle)
    key_order = [GROQ_KEYS[(start_idx + i) % len(GROQ_KEYS)] for i in range(len(GROQ_KEYS))]
    last_r = None

    for key_idx, api_key in enumerate(key_order):
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        key_label = f"키{(start_idx + key_idx) % len(GROQ_KEYS) + 1}"

        for attempt in range(1, 3):
            try:
                r = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
                last_r = r
            except Exception as conn_err:
                print(f"  ⚠️  Groq {key_label} 연결 오류: {conn_err}")
                break

            if r.status_code == 413:
                print(f"  ⚡ Groq {key_label} 413 프롬프트 초과 — Groq 폴백 불가")
                raise RuntimeError("Groq 413: 프롬프트가 너무 큼")
            if r.status_code == 429:
                print(f"  ⚡ Groq {key_label} 429 → 다음 키 전환...")
                break

            r.raise_for_status()
            result = r.json()["choices"][0]["message"]["content"].strip()
            print(f"  ✅ Groq {key_label} 폴백 성공")
            return _sanitize(result)

        if key_idx < len(key_order) - 1:
            print(f"  ⚠️  Groq {key_label} 소진 → 다음 키...")

    if last_r is not None:
        last_r.raise_for_status()
    raise RuntimeError("Groq 모든 키 소진")


def ask_gemini(prompt: str, system: str = "", temperature: float = 0.7, max_tokens: int = 4096, json_mode: bool = False) -> str:
    """Gemini 우선 → 실패 시 Groq 폴백"""
    try:
        return _call_gemini(prompt, system, temperature, max_tokens, json_mode)
    except Exception as e:
        print(f"  ⚠️  Gemini 전체 실패 ({e}) → Groq 폴백 시도...")
    try:
        return _call_groq(prompt, system, temperature, max_tokens, json_mode)
    except Exception as e:
        raise RuntimeError(f"Gemini + Groq 모두 실패: {e}")


def ask_ai(prompt: str, system: str = "", temperature: float = 0.7, max_tokens: int = 2048, json_mode: bool = False) -> str:
    return ask_gemini25_first(prompt, system=system, temperature=temperature, max_tokens=max_tokens, json_mode=json_mode)


def ask_gemini25_first(prompt: str, system: str = "", temperature: float = 0.7, max_tokens: int = 2048, json_mode: bool = False) -> str:
    """Gemini 2.5-flash 우선 → 실패 시 Groq 폴백"""
    import time

    gemini_keys = [k for k in [os.getenv("GEMINI_API_KEY", ""), os.getenv("GEMINI_API_KEY_2", "")] if k]

    for key_idx, gemini_key in enumerate(gemini_keys):
        key_label = f"키{key_idx + 1}"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max(max_tokens, 2048)},
        }
        if system:
            payload["system_instruction"] = {"parts": [{"text": system}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        for attempt in range(1, 3):
            try:
                r = requests.post(url, json=payload, timeout=60)
                r.raise_for_status()
                result = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"  ✅ Gemini 2.5-flash {key_label} 성공")
                return _sanitize(result)
            except Exception as e:
                resp_obj = getattr(e, 'response', None)
                status = getattr(resp_obj, 'status_code', 0)
                body = getattr(resp_obj, 'text', '')[:200]
                print(f"  ⚠️  Gemini 2.5-flash {key_label} 시도 {attempt}/2 실패: HTTP {status} | {body or e}")
                if attempt < 2:
                    wait = 30 if status == 429 else 10
                    print(f"      {wait}초 대기 후 재시도...")
                    time.sleep(wait)

        if key_idx < len(gemini_keys) - 1:
            print(f"  ⏳ Gemini 2.5-flash {key_label} 실패 → 키{key_idx + 2}로 전환...")

    print(f"  ⚠️  Gemini 2.5-flash 전체 실패 → Groq 폴백...")
    try:
        result = _call_groq(prompt, system, temperature, max_tokens, json_mode)
        print(f"  ✅ Groq 폴백 성공")
        return result
    except Exception as e:
        raise RuntimeError(f"Gemini 2.5-flash + Groq 모두 실패: {e}")
