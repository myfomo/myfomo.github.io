"""Fill gaps in data/places-<city>.json from verified sources only. Nothing is guessed.
Sources, in order:
 1. OpenStreetMap / Nominatim lookup of the SAME object (by its OSM id): street + house number.
 2. The place's official website (the one linked from OpenStreetMap): schema.org JSON-LD only
    (telephone, openingHours(Specification), address, servesCuisine, name/alternateName).
    Accepted only if the page clearly describes this branch: name similar AND (geo within 400 m OR same street),
    or a single-location site whose name matches strongly.
 3. Wikidata, for objects that OpenStreetMap links to it: Hebrew/English names, official website.
When two sources disagree the existing OpenStreetMap value is kept and the conflict is written to the report.
Data © OpenStreetMap contributors (ODbL); Wikidata (CC0); websites: facts published by the venue itself."""
import json, sys, re, time, math, urllib.request, urllib.parse, concurrent.futures as cf, html
SRC = sys.argv[1]; REPORT = sys.argv[2] if len(sys.argv) > 2 else "data/enrich-report.json"
UA = {"User-Agent": "fomo-catalog/1.0 (https://myfomo.github.io; catalog enrichment)", "Accept-Language": "he,en;q=0.8"}
D = json.load(open(SRC)); P = D["places"]; byid = {p["id"]: p for p in P}
rep = {"addr_osm": 0, "addr_partial": 0, "site_checked": 0, "site_jsonld": 0, "site_match": 0, "site_reject": 0,
       "phone_site": 0, "hours_site": 0, "addr_site": 0, "cuisine_site": 0, "names_site": 0, "web_wd": 0, "names_wd": 0,
       "conflicts": [], "rejected_sites": []}
def get(url, t=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=t) as r:
        if "html" not in (r.headers.get("content-type") or "html") and "json" not in (r.headers.get("content-type") or ""): return ""
        return r.read(1_500_000).decode(r.headers.get_content_charset() or "utf-8", "replace")
def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower().replace("׳", "").replace("'", ""))
def dice(a, b):
    a, b = norm(a), norm(b)
    if not a or not b: return 0
    if a in b or b in a: return 1
    A = [a[i:i+2] for i in range(len(a)-1)]; B = [b[i:i+2] for i in range(len(b)-1)]; n = 0; B2 = B[:]
    for x in A:
        if x in B2: n += 1; B2.remove(x)
    return 2*n/max(1, len(A)+len(B))
def km(a, b, c, d):
    r = math.radians; x = math.sin(r(c-a)/2)**2 + math.cos(r(a))*math.cos(r(c))*math.sin(r(d-b)/2)**2; return 12742*math.asin(math.sqrt(x))
def phone(s):
    d = re.sub(r"\D", "", s or "")
    if d.startswith("972"): d = "0" + d[3:]
    return d if re.fullmatch(r"0\d{8,9}", d) else ""
# ---------- 1. Nominatim lookup of the object itself ----------
need = [p for p in P if not p.get("a")]
for i in range(0, len(need), 50):
    chunk = need[i:i+50]; ids = ",".join(p["id"][0].upper() + p["id"][1:] for p in chunk)
    try:
        R = json.loads(get("https://nominatim.openstreetmap.org/lookup?" + urllib.parse.urlencode({"osm_ids": ids, "format": "jsonv2", "addressdetails": 1, "accept-language": "he"})))
    except Exception as e:
        print("nominatim fail", e); time.sleep(2); continue
    for r in R:
        pid = r.get("osm_type", "x")[0] + str(r.get("osm_id")); p = byid.get(pid); a = r.get("address") or {}
        if not p: continue
        road = a.get("road") or a.get("pedestrian") or a.get("footway") or a.get("square")
        if road and a.get("house_number"): p["a"] = f'{road} {a["house_number"]}'; p.setdefault("src", {})["a"] = "osm"; rep["addr_osm"] += 1
        elif road: p["a"] = road; p.setdefault("src", {})["a"] = "osm-street"; rep["addr_partial"] += 1
        city = a.get("city") or a.get("town")
        if city and not p.get("c_osm"): p["c_osm"] = city
    time.sleep(1.2)  # Nominatim usage policy: max 1 request/second
print("addresses:", rep["addr_osm"], "full,", rep["addr_partial"], "street only")
# ---------- 2. official websites: schema.org JSON-LD ----------
BIZ = re.compile(r"Restaurant|FoodEstablishment|CafeOrCoffeeShop|BarOrPub|Bakery|IceCreamShop|FastFoodRestaurant|Winery|Brewery|LocalBusiness", re.I)
def blocks(htm):
    out = []
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', htm, re.S | re.I):
        try: j = json.loads(html.unescape(m.group(1).strip()))
        except Exception:
            try: j = json.loads(re.sub(r",\s*([}\]])", r"\1", m.group(1).strip()))
            except Exception: continue
        st = j if isinstance(j, list) else [j]
        while st:
            x = st.pop()
            if isinstance(x, list): st += x; continue
            if not isinstance(x, dict): continue
            if "@graph" in x: st += x["@graph"] if isinstance(x["@graph"], list) else [x["@graph"]]
            t = x.get("@type"); t = " ".join(t) if isinstance(t, list) else str(t or "")
            if BIZ.search(t): out.append(x)
    return out
DAY = {"monday": "Mo", "tuesday": "Tu", "wednesday": "We", "thursday": "Th", "friday": "Fr", "saturday": "Sa", "sunday": "Su",
       "mo": "Mo", "tu": "Tu", "we": "We", "th": "Th", "fr": "Fr", "sa": "Sa", "su": "Su"}
def hours_of(x):
    oh = x.get("openingHours")
    if isinstance(oh, str) and re.search(r"\d{1,2}:\d{2}", oh): return oh.strip()
    if isinstance(oh, list) and oh and all(isinstance(s, str) for s in oh): return "; ".join(s.strip() for s in oh if re.search(r"\d", s))
    S = x.get("openingHoursSpecification")
    if isinstance(S, dict): S = [S]
    if not isinstance(S, list): return ""
    rules = []
    for s in S:
        if not isinstance(s, dict) or s.get("validFrom") or s.get("validThrough"): continue  # skip holiday overrides
        days = s.get("dayOfWeek"); days = days if isinstance(days, list) else [days]
        dd = [DAY.get(str(d).split("/")[-1].lower()) for d in days if d]; o, c = str(s.get("opens", ""))[:5], str(s.get("closes", ""))[:5]
        if dd and all(dd) and re.fullmatch(r"\d\d:\d\d", o) and re.fullmatch(r"\d\d:\d\d", c): rules.append(",".join(dd) + " " + o + "-" + c)
    return "; ".join(rules)
def street(a):
    if isinstance(a, dict): return str(a.get("streetAddress") or "")
    return str(a or "")
def site_job(p):
    url = p["w"]
    if re.search(r"instagram\.com|facebook\.com|wolt\.com|tiktok\.com", url): return p, None, "social"
    try: htm = get(url)
    except Exception as e: return p, None, "fetch: " + str(e)[:60]
    return p, blocks(htm), ""
with_site = [p for p in P if p.get("w")]
with cf.ThreadPoolExecutor(8) as ex:
    for p, B, err in ex.map(site_job, with_site):
        if err == "social": continue
        rep["site_checked"] += 1
        if not B: continue
        rep["site_jsonld"] += 1
        best = None
        for x in B:
            nm = str(x.get("name") or ""); geo = x.get("geo") or {}; sa = street(x.get("address"))
            ns = max([dice(nm, n) for n in [p["n"], *p.get("al", [])]] or [0])
            near = None
            try: near = km(p["la"], p["lo"], float(geo.get("latitude")), float(geo.get("longitude"))) < 0.4
            except Exception: pass
            same_st = bool(p.get("a") and sa and norm(re.sub(r"\d+", "", p["a"])) and norm(re.sub(r"\d+", "", p["a"])) in norm(sa))
            single = len(B) == 1
            ok = ns >= 0.5 and (near or same_st or (single and ns >= 0.8 and near is None and not sa))
            if ok: best = x; break
        if not best:
            rep["site_reject"] += 1; rep["rejected_sites"].append({"id": p["id"], "n": p["n"], "w": p["w"], "why": "branch/name not confirmed"}); continue
        rep["site_match"] += 1; src = p.setdefault("src", {})
        ph = phone(best.get("telephone") if isinstance(best.get("telephone"), str) else "")
        if ph:
            if not p.get("p"): p["p"] = ph; src["p"] = "site"; rep["phone_site"] += 1
            elif phone(p["p"]) != ph: rep["conflicts"].append({"id": p["id"], "n": p["n"], "field": "phone", "osm": p["p"], "site": ph})
            else: src["p"] = "osm+site"
        h = hours_of(best)
        if h:
            if not p.get("oh"): p["oh"] = h; src["oh"] = "site"; rep["hours_site"] += 1
            elif re.sub(r"\s", "", p["oh"]) != re.sub(r"\s", "", h): rep["conflicts"].append({"id": p["id"], "n": p["n"], "field": "hours", "osm": p["oh"], "site": h})
            else: src["oh"] = "osm+site"
        sa = street(best.get("address"))
        if sa and re.search(r"\d", sa) and (not p.get("a") or src.get("a") == "osm-street"):
            if not p.get("a") or norm(re.sub(r"\d+", "", p["a"])) in norm(sa): p["a"] = sa.split(",")[0].strip(); src["a"] = "site"; rep["addr_site"] += 1
        sc = best.get("servesCuisine"); sc = ", ".join(sc) if isinstance(sc, list) else (sc or "")
        if sc and not p.get("cu"): p["cu_site"] = str(sc)[:60]; rep["cuisine_site"] += 1  # raw, mapped in the app only when it matches a known type
        names = [best.get("name")] + (best.get("alternateName") if isinstance(best.get("alternateName"), list) else [best.get("alternateName")])
        for n in names:
            if isinstance(n, str) and n.strip() and dice(n, p["n"]) >= 0.5 and n.strip() != p["n"] and n.strip() not in p.get("al", []):
                p.setdefault("al", []).append(n.strip()); rep["names_site"] += 1
print("sites:", {k: rep[k] for k in ["site_checked", "site_jsonld", "site_match", "site_reject", "phone_site", "hours_site", "addr_site", "cuisine_site", "names_site"]})
# ---------- 3. Wikidata ----------
wd = [p for p in P if p.get("wd")]
for i in range(0, len(wd), 40):
    chunk = wd[i:i+40]
    try:
        J = json.loads(get("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({"action": "wbgetentities", "ids": "|".join(p["wd"] for p in chunk), "props": "labels|claims", "languages": "he|en", "format": "json"})))
    except Exception as e:
        print("wikidata fail", e); continue
    for p in chunk:
        e = (J.get("entities") or {}).get(p["wd"]) or {}
        for lang in ("he", "en"):
            v = ((e.get("labels") or {}).get(lang) or {}).get("value")
            if v and v != p["n"] and v not in p.get("al", []): p.setdefault("al", []).append(v); rep["names_wd"] += 1
        if not p.get("w"):
            try:
                u = e["claims"]["P856"][0]["mainsnak"]["datavalue"]["value"]; p["w"] = u; p.setdefault("src", {})["w"] = "wikidata"; rep["web_wd"] += 1
            except Exception: pass
    time.sleep(1)
print("wikidata:", rep["names_wd"], "names,", rep["web_wd"], "websites")
for p in P: p.pop("c_osm", None)
D["enriched"] = time.strftime("%Y-%m-%d")
json.dump(D, open(SRC, "w"), ensure_ascii=False, separators=(",", ":"))
n = len(P); cov = lambda k: f"{sum(1 for p in P if p.get(k))} ({round(100*sum(1 for p in P if p.get(k))/n)}%)"
rep["coverage_after"] = {"address": cov("a"), "hours": cov("oh"), "phone": cov("p"), "website": cov("w"), "cuisine": cov("cu"), "extra_names": cov("al")}
rep["conflicts_n"] = len(rep["conflicts"])
json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in rep.items() if k not in ("conflicts", "rejected_sites")}, ensure_ascii=False, indent=1))
