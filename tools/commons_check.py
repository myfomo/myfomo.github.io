"""Check which catalog places have a freely licensed photo on Wikimedia Commons. Report only: nothing in the catalog changes.

For every active place (not closed):
  1. Wikidata item (catalog "wd"): its image (P18) and Commons category (P373).
  2. Commons files geotagged within 40 m of the place whose file name contains the place's name (Hebrew/English/alt).
For each candidate file the licence and author are read from Commons, so attribution can be shown if the user decides to use it.
Usage: commons_check.py data/places-tlv.json data/commons-check-tlv.json"""
import json, sys, re, time, urllib.request, urllib.parse

cat, out = sys.argv[1], sys.argv[2]
P = [p for p in json.load(open(cat))["places"] if not p.get("x")]
UA = {"User-Agent": "fomo-catalog-commons-check/1.0 (github.com/myfomo/myfomo.github.io)"}

def api(host, **q):
    q.update(format="json", maxlag="5")
    req = urllib.request.Request(f"https://{host}/w/api.php?" + urllib.parse.urlencode(q), headers=UA)
    for attempt in range(3):
        try:
            return json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:
            print("api error", host, e); time.sleep(3)
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
        r = api("commons.wikimedia.org", action="query", list="geosearch", gscoord=f'{p["la"]}|{p["lo"]}',
                gsradius="40", gsnamespace="6", gslimit="50")
        for g in r.get("query", {}).get("geosearch", []):
            t = norm(g["title"])
            if any(k in t for k in keys): cand.append((g["title"], f'geotagged {g.get("dist", "?")} m, name in file name')); n_geo += 1
    if cand:
        L = lic([c[0] for c in cand])
        e = found.setdefault(p["id"], {"n": p["n"], "files": []})
        for t, why in cand:
            e["files"].append({"file": t, "match": why, **L.get(t, {})})
    if i % 100 == 0: print(i, "of", len(P), "places checked;", len(found), "with candidates")
    time.sleep(0.2)

rep = {"checked": len(P), "places_with_candidates": len(found), "wikidata_images": n_wd, "geo_name_matches": n_geo,
       "date": time.strftime("%Y-%m-%d"), "places": found}
json.dump(rep, open(out, "w"), ensure_ascii=False, indent=1)
print("checked", len(P), "places with candidates", len(found), "wikidata images", n_wd, "geo matches", n_geo)
