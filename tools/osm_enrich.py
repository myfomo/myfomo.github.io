"""Fill gaps in data/places-<city>.json from real sources only:
 1) street address from the place's coordinates (OpenStreetMap Nominatim, 1 request/second)
 2) hours / phone / diet flags read from the place's own website (schema.org data, tel: links, keywords)
Nothing is guessed here. Writes data/enrich-<city>.json and data/site-text-<city>.json (page text for a human/AI pass)."""
import json, sys, time, re, html, urllib.request, urllib.parse, concurrent.futures as cf
city = sys.argv[1] if len(sys.argv) > 1 else "tlv"
D = json.load(open(f"data/places-{city}.json")); P = D["places"]
UA = {"User-Agent": "fomo-catalog/1.0 (https://myfomo.github.io; catalog enrichment)", "Accept-Language": "he,en"}
def get(url, t=15):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t).read()
out = {}
# 1) addresses
need = [p for p in P if not p.get("a")]
print("reverse geocoding", len(need))
for i, p in enumerate(need):
    try:
        j = json.loads(get("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=he&" + urllib.parse.urlencode({"lat": p["la"], "lon": p["lo"]})))
        a = j.get("address", {}); st = " ".join(x for x in [a.get("road", ""), a.get("house_number", "")] if x).strip()
        c = a.get("city") or a.get("town") or a.get("village") or ""
        if st: out.setdefault(p["id"], {})["a"] = st
        if c: out.setdefault(p["id"], {})["c"] = c
    except Exception as e:
        print("rev fail", p["id"], e)
    time.sleep(1.1)
    if i % 100 == 0: print(" ", i)
# 2) websites
DAYS = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0}
def ld_hours(objs):
    H = {}
    for o in objs:
        for s in (o.get("openingHoursSpecification") or []) if isinstance(o.get("openingHoursSpecification"), list) else ([o["openingHoursSpecification"]] if isinstance(o.get("openingHoursSpecification"), dict) else []):
            ds = s.get("dayOfWeek"); ds = ds if isinstance(ds, list) else [ds]
            for d in ds:
                d = str(d or "").split("/")[-1]
                if d in DAYS and s.get("opens") and s.get("closes"): H[DAYS[d]] = [s["opens"][:5], s["closes"][:5]]
        oh = o.get("openingHours")
        if oh and not H: return {"raw": oh if isinstance(oh, str) else "; ".join(oh)}
    return H or None
def walk(x, acc):
    if isinstance(x, dict):
        acc.append(x); [walk(v, acc) for v in x.values()]
    elif isinstance(x, list): [walk(v, acc) for v in x]
    return acc
def site(p):
    w = p.get("w", "")
    if not w or re.search(r"instagram|facebook|wolt|tenbis|10bis|tripadvisor|google\.", w): return p["id"], None
    try:
        raw = get(w, 15)[:1_500_000].decode("utf-8", "ignore")
    except Exception as e:
        return p["id"], {"err": str(e)[:80]}
    r = {}
    objs = []
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', raw, re.S | re.I):
        try: objs += walk(json.loads(m.group(1).strip()), [])
        except Exception: pass
    h = ld_hours(objs)
    if h: r["h"] = h
    tel = re.findall(r'href=["\']tel:([+\d\-\s()]{7,20})', raw)
    if tel: r["p"] = tel[0].strip()
    txt = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I))))
    low = txt.lower()
    if re.search(r"כשר|kosher|תעודת כשרות", low) and not re.search(r"לא כשר|not kosher|non.kosher", low): r["k"] = 1
    if re.search(r"טבעוני|vegan", low): r["vg"] = 1
    if re.search(r"ללא גלוטן|gluten.free", low): r["gf"] = 1
    if re.search(r"משלוח|delivery", low): r["dl"] = 1
    # text around opening hours, for a reading pass
    m = re.search(r"(שעות (?:פתיחה|פעילות)|opening hours|hours)(.{0,500})", txt, re.I)
    if m: r["t"] = m.group(0)[:520]
    return p["id"], r
sites = [p for p in P if p.get("w")]
print("websites", len(sites))
with cf.ThreadPoolExecutor(12) as ex:
    for pid, r in ex.map(site, sites):
        if r: out.setdefault(pid, {})["s"] = r
json.dump(out, open(f"data/enrich-{city}.json", "w"), ensure_ascii=False, separators=(",", ":"))
s = [v["s"] for v in out.values() if "s" in v]
print("addresses", sum(1 for v in out.values() if "a" in v), "| sites ok", sum(1 for x in s if "err" not in x), "| ld hours", sum(1 for x in s if "h" in x), "| hours text", sum(1 for x in s if "t" in x), "| tel", sum(1 for x in s if "p" in x))
