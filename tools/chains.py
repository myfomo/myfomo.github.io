"""Chains: read each chain's OFFICIAL branch pages and use them to confirm / complete our branches.
Rules: a branch is matched by street + house number (or within 150 m when the page gives coordinates).
Matched -> "ok" (listed on the official site), phone and hours from the official page.
Official branches we don't have -> added, geocoded by their address with OpenStreetMap Nominatim.
Our branches missing from the official list -> reported only (not hidden)."""
import json, sys, re, time, math, urllib.request, urllib.parse, html as H
CAT, REPORT = sys.argv[1], sys.argv[2]
UA = {"User-Agent": "Mozilla/5.0 (compatible; fomo-catalog/1.0; +https://myfomo.github.io)", "Accept-Language": "he"}
def get(u, t=25, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r:
                return r.read(2_000_000).decode(r.headers.get_content_charset() or "utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 520, 522) and i < tries - 1: time.sleep(4 * (i + 1)); continue
            raise
def text(h):
    h = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", h, flags=re.S | re.I)
    t = H.unescape(re.sub(r"<(?:br|/p|/div|/li|/h\d|/tr|p|div|li|h\d|tr)\b[^>]*>", "\n", h, flags=re.I))
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\n\s*", "\n", re.sub(r"[ \t\xa0]+", " ", t))
def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower().replace("׳", "").replace("'", "").replace('"', ""))
def street_key(a):
    a = (a or "").split(",")[0]; m = re.search(r"(\D+?)\s*(\d+)", a)
    return (norm(m.group(1)), m.group(2)) if m else (norm(a), "")
DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
TOK = [(r"ראשון|א'?", 0), (r"שני|ב'?", 1), (r"שלישי|ג'?", 2), (r"רביעי|ד'?", 3), (r"חמישי|ה'?", 4), (r"שישי|ו'?", 5), (r"שבת|ש'?", 6)]
def day_of(t):
    t = t.strip().replace("יום", "").strip()
    for rx, i in TOK:
        if re.fullmatch(rx, t): return i
    return None
def hours_he(lines):
    """Hebrew opening-hours lines from official sites -> OSM opening_hours. Lines that are unclear are skipped."""
    rules = []
    for ln in lines:
        ln = ln.replace("׳", "'").replace("’", "'").replace("–", "-").replace("—", "-").strip(" -·*")
        ln = re.sub(r"^ימים\s+", "", ln)
        m = re.match(r"^((?:יום\s+)?[א-ת']{1,6})\s*(.*)$", ln)
        if not m: continue
        a = day_of(m.group(1)); rest = m.group(2); b = None
        if a is None: continue
        m2 = re.match(r"^-\s*((?:יום\s+)?[א-ת']{1,6})\s*(.*)$", rest)
        if m2 and day_of(m2.group(1)) is not None: b = day_of(m2.group(1)); rest = m2.group(2)
        v = rest.lstrip(":- ")
        ds = DAYS[a] + ("-" + DAYS[b] if b is not None and b != a else "")
        if re.search(r"סגור", v): rules.append(ds + " off"); continue
        t = re.findall(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", v)
        if len(t) != 1 or re.search(r"שבת|כניסת|צאת", v): continue  # skip "until Shabbat" style hours
        o, c = [x.zfill(5) for x in t[0]]
        if c < o and c > "06:00": o, c = c, o  # written as "23:00 - 08:00"
        rules.append(f"{ds} {o}-{c if c != '00:00' else '24:00'}")
    return "; ".join(rules)
def phone(s):
    d = re.sub(r"\D", "", s or "")
    if d.startswith("972"): d = "0" + d[3:]
    return d if re.fullmatch(r"0\d{8,9}", d) else ""
TLV = r"(?:תל[\s\-]?אביב(?:[\s\-]?יפו)?|ת\"א|ת״א|רמת[\s\-]?אביב|יפו)"
def branch_page(u, h):
    md = re.search(r'<meta[^>]+(?:name="description"|property="og:description")[^>]*content="([^"]+)"', h)
    T = text(h); lines = [x.strip() for x in T.split("\n") if x.strip()]
    if not re.search(TLV, T): return None
    addr = ""
    for i, x in enumerate(lines):
        if re.fullmatch(r"כתובת:?", x) and i + 1 < len(lines): x = lines[i + 1]
        x = re.sub(r"^כתובת:?\s*", "", x)
        m = re.match(r"^((?:[^\d\n,]{2,30},\s*)?[^\d\n,]{2,30}?\s\d{1,3}[א-ת]?)(?:\s+(?:פינת|פ'|\()[^,\n]{0,30})?\s*,?\s*" + TLV, x)
        if m: addr = m.group(1).strip(); break
    if not addr: return None
    ph = ""
    for x in lines:
        m = re.search(r"\b0\d{1,2}-?\d{3}-?\d{4}\b", x)
        if m: ph = phone(m.group(0)); break
    H_ = [x for x in lines if re.search(r"\d{1,2}:\d{2}|סגור", x) and re.match(r"^(?:ימים\s+)?(?:יום\s+)?(?:ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|[אבגדהוש]'?)", x.replace("׳", "'").replace("’", "'"))]
    # some sites put all days on one line: split it
    flat = []
    for x in H_: x = re.sub(r"^ימים\s+", "", x.replace("׳", "'").replace("’", "'").replace("–", "-")); flat += re.findall(r"(?:יום\s+)?(?:ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|[אבגדהוש]'?(?=[\s\-:]))(?:\s*-\s*(?:יום\s+)?(?:ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|[אבגדהוש]'?(?=[\s\-:])))?\s*[:\-]?\s*(?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|סגור)", x)
    return {"url": u, "a": addr.split(",")[-1].strip() if re.search(r"\d", addr.split(",")[-1]) else addr, "p": ph, "oh": hours_he(flat)}
def sitemap_urls(domain, pat):
    urls, seen, todo = set(), set(), [f"https://{domain}/sitemap_index.xml", f"https://{domain}/sitemap.xml", f"https://{domain}/wp-sitemap.xml"]
    while todo and len(seen) < 40:
        sm = todo.pop(0)
        if sm in seen: continue
        seen.add(sm)
        try: x = get(sm)
        except Exception: continue
        for loc in re.findall(r"<loc>([^<]+)</loc>", x):
            loc = H.unescape(loc.strip())
            if re.search(r"\.xml(\?|$)", loc) and re.search(r"branch|store|סניפ|%d7%a1%d7%a0%d7%99%d7%a4|page|post|sitemap", loc, re.I): todo.append(loc)
            elif re.search(pat, urllib.parse.unquote(loc), re.I): urls.add(loc)
    return sorted(urls)
def seed_urls(domain, pat, seeds):
    urls = set()
    for sd in seeds:
        try: t = get(urllib.parse.quote(f"https://{domain}{sd}", safe=":/?=&"))
        except Exception as e: print("seed", sd, e); continue
        for h in re.findall(r'href="([^"#]+)"', t):
            h = urllib.parse.unquote(H.unescape(h))
            if h.startswith("/"): h = f"https://{domain}{h}"
            if domain in h and re.search(pat, h, re.I): urls.add(urllib.parse.quote(h, safe=":/?=&"))
    return urls
def chain_reader(domain, pat, seeds=()):
    def run():
        out, U, miss = [], sorted(set(sitemap_urls(domain, pat)) | seed_urls(domain, pat, seeds)), 0
        print(domain, "branch pages:", len(U))
        for u in U:
            try: h = get(u); b = branch_page(u, h)
            except Exception as e: print("page", urllib.parse.unquote(u), e); continue
            if b: out.append(b)
            elif miss < 2 and re.search(r"תל.?אביב|ת\"א|רמת.?אביב|אוניברסיטה|שרונה|מרקט", urllib.parse.unquote(u) + text(h)[:3000]):
                miss += 1; tx = text(h); i = max(0, tx.find("שעות") - 700)
                print("  no TLV branch parsed:", urllib.parse.unquote(u), "|", tx[i:i + 1400].replace("\n", " ⏎ "))
            time.sleep(1.5)
        return out
    return run
CHAINS = {
  "ארומה": (chain_reader("www.aroma.co.il", r"/store/"), re.compile(r"ארומה|aroma", re.I), "cafe", "קפה ובראנץ'"),
  "ארקפה": (chain_reader("arcaffe.co.il", r"/branches/."), re.compile(r"ארקפה|arcaffe", re.I), "cafe", "קפה ובראנץ'"),
  "רולדין": (chain_reader("www.roladin.co.il", r"/branch/.|/סניפים/."), re.compile(r"רולדין|roladin", re.I), "cafe", "קינוחים"),
}
CHAINS.update({
  "בנדיקט": (chain_reader("www.benedict.co.il", r"/pages/בנדיקט-"), re.compile(r"בנדיקט|benedict", re.I), "restaurant", "קפה ובראנץ'"),
  "פיצה האט": (chain_reader("www.pizzahut.co.il", r"/branch/[a-z]", ["/all-branches/מרכז/סניפי-תל-אביב/תל-אביב-יפו/"]), re.compile(r"פיצה האט|pizza ?hut", re.I), "fast_food", "פיצה"),
})
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
for name, (reader, rx, typ, cu) in CHAINS.items():
    try: B = reader()
    except Exception as e: print(name, "failed", e); continue
    seenk, B2 = set(), []
    for b in B:
        k = street_key(b["a"])
        if k in seenk: continue
        seenk.add(k); B2.append(b)
    B = B2
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
                      "cu": cu, "oh": b["oh"], "p": b["p"], "w": b["url"], "t": typ, "ok": today,
                      "src": {"ok": b["url"], "oh": b["url"], "p": b["url"], "a": b["url"], "la": "nominatim"}})
            r["added"] += 1
    r["ours_not_listed"] = [{"id": p["id"], "a": p.get("a")} for p in ours if p["id"] not in used]
    rep[name] = r; print(name, {k: v for k, v in r.items() if k != "ours_not_listed"}, "not listed:", len(r["ours_not_listed"]))
json.dump(D, open(CAT, "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
