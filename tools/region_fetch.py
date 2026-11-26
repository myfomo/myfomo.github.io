"""Fetch a whole region (several municipalities / regional councils) from OpenStreetMap into data/places-<key>.json.
Each locality is an OSM administrative area; every place gets its locality as city ("c").
Usage: region_fetch.py <key>   (regions in tools/regions.json). Data © OpenStreetMap contributors, ODbL."""
import json, sys, os, time, subprocess, urllib.request, urllib.parse
KEY = sys.argv[1]
R = json.load(open("tools/regions.json"))[KEY]
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
           "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
AM = "^(restaurant|cafe|bar|pub|fast_food|ice_cream|biergarten)$"
def overpass(q):
    for attempt in range(3):
        for url in MIRRORS:
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "fomo-catalog/1.0 (myfomo.github.io)"})
                return json.load(urllib.request.urlopen(req, timeout=200))["elements"]
            except Exception as e: print("  fail", url, str(e)[:120], flush=True)
        time.sleep(30)
    return None
E, loc, report = [], {}, {}
for L in R["localities"]:
    rx = L["re"].replace('"', '\\"')
    q = (f'[out:json][timeout:180];(area["boundary"="administrative"]["name"~"{rx}"];area["boundary"="administrative"]["name:he"~"{rx}"];)->.a;'
         f'nwr(area.a)["amenity"~"{AM}"]["name"];out tags center meta;')
    got = overpass(q)
    if got is None: sys.exit(f"Overpass did not answer for {L['c']}; keeping the current catalog")
    n = 0
    for e in got:
        k = e["type"][0] + str(e["id"])
        if k in loc: continue
        loc[k] = L; E.append(e); n += 1
    report[L["c"]] = n; print(L["c"], n, flush=True); time.sleep(5)
json.dump(E, open("/tmp/region_raw.json", "w"), ensure_ascii=False)
subprocess.run([sys.executable, "tools/osm_build.py", "/tmp/region_raw.json", f"/tmp/new-{KEY}.json", R["localities"][0]["c"]], check=True)
D = json.load(open(f"/tmp/new-{KEY}.json"))
heb = lambda s: any("֐" <= ch <= "׿" for ch in s or "")
byid = {e["type"][0] + str(e["id"]): e for e in E}
for p in D["places"]:
    L = loc.get(p["id"]); t = byid[p["id"]].get("tags", {})
    own = (t.get("addr:city:he") or t.get("addr:city") or "").strip()
    p["c"] = own if (L.get("council") and heb(own)) else L["c"]
    if L.get("council"): p["rg"] = L["c"]
D["region"] = R["name"]; D["city"] = R["localities"][0]["c"]; D["n"] = len(D["places"])
out = f"data/places-{KEY}.json"
old = len(json.load(open(out))["places"]) if os.path.exists(out) else 0
json.dump(report, open(f"data/region-report-{KEY}.json", "w"), ensure_ascii=False, indent=1)
print("region", KEY, "old", old, "new", D["n"], "empty localities:", [c for c, n in report.items() if not n])
if D["n"] < R.get("min", 50) or (old and D["n"] < 0.85 * old): sys.exit("region fetch looks incomplete; keeping the current catalog")
json.dump(D, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
