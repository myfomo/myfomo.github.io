# Gemini as a third checker. REPORT ONLY: it never edits the catalog.
# For places not yet verified, asks Gemini (with web search) whether the place still operates and where the evidence is.
# Only the place's public data is sent (name, address, city, type). Hours/phones from Gemini are NOT stored:
# its answers are leads; the daily verification runs open the listed sources and decide by tools/VERIFY.md.
import json, os, sys, time, re, urllib.request
CAT, OUT = sys.argv[1], sys.argv[2]
LIMIT = int(sys.argv[3]) if len(sys.argv) > 3 else 150
KEY = os.environ.get("GEMINI_API_KEY", "")
if not KEY: print("GEMINI_API_KEY is not set; skipping"); sys.exit(0)
API = "https://generativelanguage.googleapis.com/v1beta"
def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=90) as r: return json.loads(r.read())
def pick_model():
    want = os.environ.get("GEMINI_MODEL")
    if want: return want
    ms = [m["name"] for m in call(API + "/models?pageSize=200").get("models", [])
          if "generateContent" in m.get("supportedGenerationMethods", [])]
    fl = [m for m in ms if re.search(r"gemini-[\d.]+-flash$", m)] or [m for m in ms if "flash" in m and "lite" not in m and "preview" not in m]
    fl.sort(key=lambda m: [float(x) for x in re.findall(r"gemini-([\d.]+)", m)[:1] or [0]], reverse=True)
    print("flash models:", fl, flush=True)
    return fl
def body_of(e):
    try: return e.read().decode()[:400].replace("\n", " ")
    except Exception: return ""
# use the newest flash model that the free tier actually serves with web search
CANDS = pick_model(); CANDS = [CANDS] if isinstance(CANDS, str) else CANDS; MODEL = None
for m in CANDS:
    try:
        call(f"{API}/{m}:generateContent", {"contents": [{"parts": [{"text": "Reply with the word ok"}]}], "tools": [{"google_search": {}}]})
        MODEL = m; break
    except urllib.error.HTTPError as e: print("model", m, e.code, body_of(e), flush=True)
if not MODEL: sys.exit("no Gemini model is available for this key right now")
print("model", MODEL, flush=True)
P = json.load(open(CAT))["places"]
try: rep = json.load(open(OUT))
except Exception: rep = {"model": MODEL, "places": {}}
todo = [p for p in P if not p.get("ok") and not p.get("x") and p["id"] not in rep["places"]]
rank = {"restaurant": 0, "bar": 1, "pub": 1, "cafe": 2, "fast_food": 3}
todo.sort(key=lambda p: rank.get(p.get("t"), 4))
print("left", len(todo), flush=True)
ASK = """Place: "{n}"{al}, type: {t}, address: {a}, Tel Aviv, Israel.
Search the web. Is this specific place (this branch, at this address) operating today?
Answer ONLY with JSON: {{"status":"open|closed|moved|unknown","confidence":0-1,
"evidence":[{{"url":"...","says":"one short line in English","date":"YYYY-MM or empty"}}],
"official_site":"url or empty","booking":["tabit/ontopo url", ...]}}
Use only real URLs you found (no google.com / maps links). If unsure, status unknown."""
n = {"open": 0, "closed": 0, "moved": 0, "unknown": 0, "err": 0}
for p in todo[:LIMIT]:
    body = {"contents": [{"parts": [{"text": ASK.format(n=p["n"], al=(" (also: " + ", ".join(p["al"]) + ")") if p.get("al") else "",
                                                     t=p.get("t", ""), a=p.get("a") or "unknown")}]}],
            "tools": [{"google_search": {}}], "generationConfig": {"temperature": 0}}
    try:
        r = call(f"{API}/{MODEL}:generateContent", body)
        txt = "".join(x.get("text", "") for x in r["candidates"][0]["content"]["parts"])
        j = json.loads(re.search(r"\{.*\}", txt, re.S).group(0))
        ev = [e for e in j.get("evidence", []) if isinstance(e, dict) and not re.search(r"google\.|goo\.gl", e.get("url", ""))]
        rec = {"n": p["n"], "st": j.get("status", "unknown"), "c": j.get("confidence"), "ev": ev[:4],
               "w": j.get("official_site") or "", "bk": [b for b in j.get("booking", []) if re.search(r"tabit|ontopo", b or "")],
               "d": time.strftime("%Y-%m-%d")}
        rep["places"][p["id"]] = rec; n[rec["st"] if rec["st"] in n else "unknown"] += 1
    except urllib.error.HTTPError as e:
        print("http", e.code, p["n"], body_of(e), flush=True); n["err"] += 1
        if e.code == 429: break            # daily free quota used up; continue tomorrow
    except Exception as e:
        print("err", p["n"], str(e)[:120], flush=True); n["err"] += 1
    time.sleep(7)                          # stay well under the free-tier rate limit
rep["model"] = MODEL
json.dump(rep, open(OUT, "w"), ensure_ascii=False, indent=0)
print("gemini", n, "total in report", len(rep["places"]), flush=True)
