"""Check that each place's website still answers and still talks about this place.
Writes data/site-check-<city>.json: {id: {"st": http status or error, "name": bool, "parked": bool}}."""
import json, sys, re, urllib.request, concurrent.futures as cf
SRC, OUT = sys.argv[1], sys.argv[2]
P = json.load(open(SRC))["places"]
UA = {"User-Agent": "Mozilla/5.0 (compatible; fomo-catalog/1.0; +https://myfomo.github.io)", "Accept-Language": "he,en;q=0.8"}
PARK = re.compile(r"domain (is )?for sale|buy this domain|parked (free|domain)|sedo|godaddy\.com/forsale|hugedomains|this domain may be for sale|הדומיין למכירה", re.I)
def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower())
def job(p):
    u = p.get("w") or ""
    if not u or re.search(r"instagram\.com|facebook\.com|tiktok\.com", u): return p["id"], None
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20) as r:
            body = r.read(800_000).decode(r.headers.get_content_charset() or "utf-8", "replace"); st = r.status; final = r.geturl()
    except urllib.error.HTTPError as e: return p["id"], {"st": e.code}
    except Exception as e: return p["id"], {"st": "err:" + type(e).__name__}
    names = [p["n"], *p.get("al", [])]; b = norm(re.sub(r"<[^>]+>", " ", body)) + norm(final)
    hit = any(len(norm(n)) >= 3 and norm(n) in b for n in names)
    closed = bool(re.search(r"(המסעדה|המקום|הבר)\s+(נסגר|נסגרה|סגור לצמיתות)|permanently closed|we are closed for good|closed its doors", body, re.I))
    return p["id"], {"st": st, "name": hit, "parked": bool(PARK.search(body)), "closed_txt": closed}
res = {}
with cf.ThreadPoolExecutor(10) as ex:
    for i, r in ex.map(job, P):
        if r: res[i] = r
json.dump(res, open(OUT, "w"), ensure_ascii=False)
ok = sum(1 for r in res.values() if r["st"] == 200 and r.get("name") and not r.get("parked"))
print("checked", len(res), "ok+name", ok, "dead", sum(1 for r in res.values() if r["st"] != 200), "parked", sum(1 for r in res.values() if r.get("parked")), "closed text", sum(1 for r in res.values() if r.get("closed_txt")))
