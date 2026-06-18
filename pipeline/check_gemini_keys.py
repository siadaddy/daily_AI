"""Gemini API 키 진단 스크립트 -- 각 키/모델 조합의 실제 HTTP 상태 확인"""
import os, sys, requests
from dotenv import load_dotenv

# Windows 터미널 UTF-8 출력
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()

KEYS = {
    "키1": os.getenv("GEMINI_API_KEY", ""),
    "키2": os.getenv("GEMINI_API_KEY_2", ""),
}
MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]
TEST_PROMPT = "1+1은? 숫자만 답하세요."

results = []

for key_label, key in KEYS.items():
    if not key:
        print(f"\n[{key_label}] 키 없음 (env 미설정)")
        results.append((key_label, "-", "MISSING"))
        continue

    masked = key[:8] + "..." + key[-4:]
    print(f"\n[{key_label}] {masked}")

    for model in MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": TEST_PROMPT}]}],
            "generationConfig": {"temperature": 0, "maxOutputTokens": 500},
        }
        try:
            r = requests.post(url, json=payload, timeout=30)
            if r.status_code == 200:
                data = r.json()
                # parts가 없을 수도 있음 (빈 응답, 안전 필터 등)
                try:
                    answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"  OK  {model} -> 200  (응답: {answer!r})")
                    results.append((key_label, model, "OK"))
                except (KeyError, IndexError):
                    finish = data.get("candidates", [{}])[0].get("finishReason", "?")
                    print(f"  WARN {model} -> 200 but parts 없음 (finishReason={finish})")
                    print(f"       raw: {str(data)[:300]}")
                    results.append((key_label, model, f"200/no-parts({finish})"))
            else:
                body = r.text[:300]
                print(f"  FAIL {model} -> {r.status_code}  {body}")
                results.append((key_label, model, f"HTTP {r.status_code}"))
        except Exception as e:
            print(f"  ERR  {model} -> 연결 오류: {e}")
            results.append((key_label, model, f"ERROR"))

print("\n" + "=" * 55)
print(f"{'키':>5}  {'모델':<22}  결과")
print("-" * 55)
for key_label, model, status in results:
    icon = "OK" if status == "OK" else ("--" if status == "MISSING" else "XX")
    print(f"[{icon}] {key_label:>4}  {model:<22}  {status}")
print("=" * 55)
