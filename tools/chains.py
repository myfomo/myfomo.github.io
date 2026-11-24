"""Chains: read each chain's OFFICIAL branch pages and use them to confirm / complete our branches.
Rules: a branch is matched by street + house number (or within 150 m when the page gives coordinates).
Matched -> "ok" (listed on the official site), phone and hours from the official page.
Official branches we don't have -> added, geocoded by their address with OpenStreetMap Nominatim.
Our branches missing from the official list -> reported only (not hidden)."""
import json, sys, re, time, math, urllib.request, urllib.parse, html as H
CAT, REPORT = sys.argv[1], sys.argv[2]
UA = {"User-Agent": "Mozilla/5.0 (compatible; fomo-catalog/1.0; +https://myfomo.github.io)", "Accept-Language": "he"}
def get(u, t=25):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r:
        return r.read(2_000_000).decode(r.headers.get_content_charset() or "utf-8", "replace")
def text(h):
    h = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", h, flags=re.S | re.I)
    return H.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "\n", h)))
def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower().replace("׳", "").replace("'", "").replace('"', ""))
def street_key(a):
    a = (a or "").split(",")[0]; m = re.search(r"(\D+?)\s*(\d+)", a)
    return (norm(m.group(1)), m.group(2)) if m else (norm(a), "")
DAYS = [("א", "Su"), ("ב", "Mo"), ("ג", "Tu"), ("ד", "We"), ("ה", "Th"), ("ו", "Fr"), ("ש", "Sa")]
HE = {"א": 0, "ב": 1, "ג": 2, "ד": 3, "ה": 4, "ו": 5, "ש": 6}
def hours_he(lines):
    """Lines like "א'-ה': 06:00-19:00", "שישי: 06:00-14:00", "שבת: סגור" -> OSM opening_hours."""
    rules = []
    for ln in lines:
        ln = ln.replace("׳", "'").replace("–", "-").strip()
        m = re.match(r"^(א'?\s*-\s*ה'?|א'?\s*-\s*ו'?|א'?\s*-\s*ש'?|[אבגדהו]'|שישי|שבת|מוצ\"ש)\s*:?\s*(.*)$", ln)
        if not m: continue
        d, v = m.group(1).replace(" ", ""), m.group(2)
        if d.startswith("שישי"): ds = "Fr"
        elif d.startswith("שבת"): ds = "Sa"
        elif "-" in d:
            a, b = d.replace("'", "").split("-"); ds = DAYS[HE[a]][1] + "-" + DAYS[HE[b]][1]
        else: ds = DAYS[HE[d[0]]][1]
        if re.search(r"סגור", v): rules.append(ds + " off"); continue
        t = re.search(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", v)
        if t:
            o, c = t.group(1).zfill(5), t.group(2).zfill(5)
            if c == "00:00": c = "24:00"
            rules.append(f"{ds} {o}-{c}")
    return "; ".join(rules)
def phone(s):
    d = re.sub(r"\D", "", s or "")
    if d.startswith("972"): d = "0" + d[3:]
    return d if re.fullmatch(r"0\d{8,9}", d) else ""
# ---------- chain readers ----------
def aroma():
    urls = set()
    for sm in ["https://www.aroma.co.il/store-sitemap.xml", "https://www.aroma.co.il/store-sitemap2.xml"]:
        try: urls |= set(re.findall(r"<loc>(https://www\.aroma\.co\.il/store/[^<]+)</loc>", get(sm)))
        except Exception as e: print("aroma sitemap", sm, e)
    out = []
    for u in sorted(urls):
        try: h = get(u)
        except Exception as e: print("aroma page", u, e); continue
        md = re.search(r'<meta[^>]+(?:name="description"|property="og:description")[^>]*content="([^"]+)"', h) or re.search(r'content="([^"]+)"[^>]*(?:name="description"|property="og:description")', h)
        t = H.unescape(md.group(1)) if md else text(h)
        m = re.search(r"([^\n]{2,80}?),\s*(תל אביב|תל-אביב|תל אביב יפו|תל אביב-יפו)\s*טלפון:\s*([\d\-]*)\s*שעות פעילות:\s*(.*?)(?:אתר ארומה|$)", t)
        if not m: continue
        addr, ph, hrs = m.group(1).strip(), m.group(3), m.group(4)
        lines = re.findall(r"((?:א'?\s*-\s*[הוש]'?|[אבגדהו]'|שישי|שבת)\s*:\s*[^א-ת]*?(?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|סגור))", hrs.replace("׳", "'"))
        out.append({"chain": "ארומה", "url": u, "a": addr.split(",")[-1].strip() if re.search(r"\d", addr.split(",")[-1]) else addr, "p": phone(ph), "oh": hours_he(lines)})
    return out
CHAINS = {"ארומה": (aroma, re.compile(r"ארומה|aroma", re.I))}
# ---------- apply ----------
D = json.load(open(CAT)); P = D["places"]; rep = {}
def geocode(addr):
    q = urllib.parse.urlencode({"q": addr + ", תל אביב", "format": "jsonv2", "limit": 1, "countrycodes": "il"})
    try:
        r = json.loads(get("https://nominatim.openstreetmap.org/search?" + q)); time.sleep(1.2)
        if r: return float(r[0]["lat"]), float(r[0]["lon"])
    except Exception as e: print("geocode", e)
    return None
today = time.strftime("%Y-%m-%d")
for name, (reader, rx) in CHAINS.items():
    try: B = reader()
    except Exception as e: print(name, "failed", e); continue
    ours = [p for p in P if rx.search(p["n"] + " " + " ".join(p.get("al", []))) and not p.get("x")]
    used = set(); r = {"official": len(B), "matched": 0, "added": 0, "hours": 0, "phones": 0, "ours_not_listed": []}
    for b in B:
        k = street_key(b["a"]); hit = None
        for p in ours:
            if p["id"] in used: continue
            if k[1] and street_key(p.get("a"))[1] == k[1] and (k[0] in street_key(p.get("a"))[0] or street_key(p.get("a"))[0] in k[0]): hit = p; break
        src = {"ok": b["url"]}
        if hit:
            used.add(hit["id"]); r["matched"] += 1; hit["ok"] = today; s = hit.setdefault("src", {}); s["ok"] = b["url"]
            if b["oh"] and hit.get("oh") != b["oh"]: hit["oh"] = b["oh"]; s["oh"] = b["url"]; r["hours"] += 1
            if b["p"] and not hit.get("p"): hit["p"] = b["p"]; s["p"] = b["url"]; r["phones"] += 1
            if not re.search(r"\d", hit.get("a", "")): hit["a"] = b["a"]; s["a"] = b["url"]
        else:
            g = geocode(b["a"])
            if not g: continue
            P.append({"id": "c-" + norm(name) + "-" + norm(b["a"])[:24], "n": name, "la": round(g[0], 6), "lo": round(g[1], 6), "c": "תל אביב", "a": b["a"],
                      "cu": "קפה ובראנץ'" if name == "ארומה" else "", "oh": b["oh"], "p": b["p"], "w": b["url"], "t": "cafe", "ok": today,
                      "src": {"ok": b["url"], "oh": b["url"], "p": b["url"], "a": b["url"], "la": "nominatim"}})
            r["added"] += 1
    r["ours_not_listed"] = [{"id": p["id"], "a": p.get("a")} for p in ours if p["id"] not in used]
    rep[name] = r; print(name, {k: v for k, v in r.items() if k != "ours_not_listed"}, "not listed:", len(r["ours_not_listed"]))
json.dump(D, open(CAT, "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
