"""Check which catalog places have a freely licensed photo on Wikimedia Commons. Report only: nothing in the catalog changes.

For every active place (not closed):
  1. Wikidata item (catalog "wd"): its image (P18) and Commons category (P373).
  2. Commons files geotagged within 60 m of the place whose file name contains the place's name (Hebrew/English/alt).
For each candidate file the licence and author are read from Commons, so attribution can be shown if the user decides to use it.
Usage: commons_check.py data/places-tlv.json data/commons-check-tlv.json"""
import json, sys, re, time, urllib.request, urllib.parse

cat, out = sys.argv[1], sys.argv[2]
P = [p for p in json.load(open(cat))["places"] if not p.get("x")]
UA = {"User-Agent": "fomo-catalog-commons-check/1.0 (github.com/myfomo/myfomo.github.io)"}

def api(host, **q):
    q.update(format="json", maxlag="5")
    req = urllib.request.Request(f"https://{host}/w/api.php?" + urllib.parse.urlencode(q), headers=UA)
    for attempt in range(2):
        try:
            return json.load(urllib.request.urlopen(req, timeout=15))
        except Exception as e:
            print("api error", host, e, flush=True); time.sleep(2)
    return {}

def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower())
GENERIC = {norm(x) for x in ["cafe", "קפה", "bar", "בר", "pub", "פאב", "restaurant", "מסעדה", "aroma", "ארומה", "arcafe", "ilans", "pizza", "פיצה"]}

def lic(titles):
    if not titles: return {}
    r = api("commons.wikimedia.org", action="query", prop="imageinfo", iiprop="url|extmetadata", iiurlwidth="640",
            titles="|".join(titles[:50]))
    res = {}
    for pg in (r.get("query", {}).get("pages", {}) or {}).values():
        ii = (pg.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
        res[pg.get("title")] = {"license": m.get("LicenseShortName", {}).get("value"),
                                "artist": re.sub(r"<[^>]+>", "", m.get("Artist", {}).get("value", "")).strip()[:120],
                                "thumb": ii.get("thumburl"), "page": ii.get("descriptionurl")}
    return res

# all geotagged Commons files in the city, fetched tile by tile (a full tile is split in four)
FILES = {}
def tile(s_, w_, n_, e_, depth=0):
    r = api("commons.wikimedia.org", action="query", list="geosearch", gsbbox=f"{n_}|{w_}|{s_}|{e_}",
            gsnamespace="6", gslimit="500")
    G = r.get("query", {}).get("geosearch", [])
    if len(G) >= 500 and depth < 6:
        my, mx = (s_ + n_) / 2, (w_ + e_) / 2
        for a in ((s_, w_, my, mx), (s_, mx, my, e_), (my, w_, n_, mx), (my, mx, n_, e_)): tile(*a, depth + 1)
        return
    for g in G: FILES[g["title"]] = (g["lat"], g["lon"])
S0, W0, N0, E0 = 32.02, 34.73, 32.15, 34.86; step = 0.01
y = S0
while y < N0:
    x = W0
    while x < E0:
        tile(round(y, 4), round(x, 4), round(min(y + step, N0), 4), round(min(x + step, E0), 4)); x += step
    y += step
    print("tiles up to lat", round(y, 3), "files", len(FILES), flush=True)
import math
def dist(a, b):
    dy = (a[0] - b[0]) * 111320; dx = (a[1] - b[1]) * 111320 * math.cos(math.radians(a[0])); return math.hypot(dx, dy)
NT = {t: norm(t) for t in FILES}

found = {}; n_wd = n_geo = 0
for i, p in enumerate(P):
    names = [p["n"]] + p.get("al", [])
    keys = [k for k in {norm(x) for x in names} if len(k) >= 4 and k not in GENERIC]
    cand = []
    if p.get("wd"):
        r = api("www.wikidata.org", action="wbgetclaims", entity=p["wd"])
        cl = r.get("claims", {})
        for c in cl.get("P18", []):
            v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if v: cand.append(("File:" + v, "wikidata image")); n_wd += 1
        for c in cl.get("P373", []):
            v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if v: found.setdefault(p["id"], {"n": p["n"], "files": []})["category"] = "Category:" + v
    if keys:
        for t, ll in FILES.items():
            if any(k in NT[t] for k in keys):
                d = dist(ll, (p["la"], p["lo"]))
                if d <= 60: cand.append((t, f"geotagged {d:.0f} m, name in file name")); n_geo += 1
    if cand:
        L = lic([c[0] for c in cand])
        e = found.setdefault(p["id"], {"n": p["n"], "files": []})
        for t, why in cand: e["files"].append({"file": t, "match": why, **L.get(t, {})})

rep = {"checked": len(P), "commons_files_in_city": len(FILES), "places_with_candidates": len(found), "wikidata_images": n_wd, "geo_name_matches": n_geo,
       "date": time.strftime("%Y-%m-%d"), "places": found}
json.dump(rep, open(out, "w"), ensure_ascii=False, indent=1)
print("checked", len(P), "places with candidates", len(found), "wikidata images", n_wd, "geo matches", n_geo)
