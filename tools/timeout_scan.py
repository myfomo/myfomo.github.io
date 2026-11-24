# Report only (never edits the catalog): for places not yet verified, search Time Out Tel Aviv
# (WordPress search API) for articles that mention the place by name, flagging closure/move headlines.
# A human then reads the flagged articles and records confirmed closures in tools/closed-tlv.json with sources.
import json, sys, time, re, urllib.request, urllib.parse, html as H
CAT, OUT = sys.argv[1], sys.argv[2]
LIMIT = int(sys.argv[3]) if len(sys.argv) > 3 else 400
UA = {"User-Agent": "FOMO-catalog/1.0 (+https://myfomo.github.io)"}
CLOSE = re.compile(r"נסגר|נסגרת|סוגר|סוגרת|סגירה|סגירת|נפרד|עוזב|עוברת דירה|עובר דירה|רילוקיישן|closing|closed", re.I)
def get(u):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=12) as r: return json.loads(r.read())
        except Exception as e:
            if i == 1: raise
            time.sleep(3)
P = json.load(open(CAT))["places"]
todo = [p for p in P if not p.get("ok") and not p.get("x") and not p["id"].startswith(("c-", "f-")) and re.search(r"[א-ת]", p["n"])]
todo.sort(key=lambda p: {"restaurant": 0, "bar": 1, "pub": 1, "cafe": 2}.get(p.get("t"), 3))
try: rep = json.load(open(OUT))   # resume: each run scans the next LIMIT places
except Exception: rep = {}
todo = [p for p in todo if p["id"] not in rep]
print("left to scan", len(todo), flush=True)
t0 = time.time()
for p in todo[:LIMIT]:
    if time.time() - t0 > 900: break
    q = urllib.parse.urlencode({"search": p["n"], "per_page": 20, "subtype": "post"})
    try: R = get("https://timeout.co.il/wp-json/wp/v2/search?" + q)
    except Exception as e: print("err", p["n"], e); continue
    hits = []
    for r in R:
        t = H.unescape(r.get("title", ""))
        if p["n"].replace("'", "") not in t.replace("'", "").replace("׳", ""): continue
        hits.append({"t": t, "u": r.get("url"), "close": bool(CLOSE.search(t))})
    rep[p["id"]] = {"n": p["n"], "a": p.get("a"), "t": p.get("t"), "hits": hits}
    time.sleep(0.6)
json.dump(rep, open(OUT, "w"), ensure_ascii=False, indent=1)
fl = {k: v for k, v in rep.items() if k in {p["id"] for p in todo[:LIMIT]}}
fl = {k: v for k, v in fl.items() if any(h["close"] for h in v["hits"])}
print("scanned", len(rep), "with title hits", sum(1 for v in rep.values() if v["hits"]), "closure-like", len(fl))
for k, v in fl.items():
    for h in v["hits"]:
        if h["close"]: print("CLOSE?", k, v["n"], "|", v["a"], "|", h["t"], "|", urllib.parse.unquote(h["u"] or ""))
