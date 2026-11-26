"""Search attributes for the catalog, from OpenStreetMap (ODbL):
- nb: neighbourhood name (nearest OSM place=suburb/quarter/neighbourhood point, within 1.5 km)
- os: outdoor seating, wc: wheelchair accessible, rs: takes reservations, kd: kid-friendly, dg: dogs welcome
The Overpass answer is cached in data/osm-attrs-tlv.json and refreshed weekly; every run re-applies it."""
import json, sys, os, time, math, urllib.request, urllib.parse
CAT, CACHE = sys.argv[1], sys.argv[2]
BBOX = os.environ.get("OSM_BBOX", "32.029,34.739,32.147,34.853")
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
           "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
def overpass(q):
    for attempt in range(4):
        for url in MIRRORS:
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "fomo-catalog/1.0 (myfomo.github.io)"})
                return json.load(urllib.request.urlopen(req, timeout=200))["elements"]
            except Exception as e: print("fail", url, e, flush=True)
        time.sleep(40)
    return None
C = None
if os.path.exists(CACHE):
    C = json.load(open(CACHE))
    if time.time() - C.get("at", 0) > 7 * 86400 or C.get("v") != 2: C = None
if C is None:
    hoods = overpass(f'[out:json][timeout:120];nwr({BBOX})["place"~"^(suburb|quarter|neighbourhood)$"]["name"];out geom;')
    venues = overpass(f'[out:json][timeout:120];nwr({BBOX})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|biergarten)$"]["name"];out;')
    if hoods is None or venues is None or len(venues) < 200:
        print("Overpass unavailable; keeping old attributes"); C = json.load(open(CACHE)) if os.path.exists(CACHE) else None
    else:
        H = []
        for h in hoods:
            n = h["tags"].get("name:he") or h["tags"]["name"]; k = h["tags"]["place"]
            if h["type"] == "node": H.append({"n": n, "la": h["lat"], "lo": h["lon"], "k": k}); continue
            ring = [(g["lat"], g["lon"]) for g in h.get("geometry", [])] if h["type"] == "way" else \
                   [(g["lat"], g["lon"]) for m in h.get("members", []) if m.get("role") in ("outer", "") for g in m.get("geometry", [])]
            if len(ring) >= 4:
                la = sum(p[0] for p in ring) / len(ring); lo = sum(p[1] for p in ring) / len(ring)
                H.append({"n": n, "la": la, "lo": lo, "k": k, "poly": [[round(a, 6), round(b, 6)] for a, b in ring]})
        A = {}
        for v in venues:
            t = v.get("tags", {}); a = {}
            if t.get("outdoor_seating") == "yes": a["os"] = 1
            if t.get("wheelchair") in ("yes", "designated"): a["wc"] = 1
            if t.get("reservation") in ("yes", "required", "recommended"): a["rs"] = 1
            if t.get("kids_area") == "yes" or t.get("highchair") == "yes" or t.get("changing_table") == "yes": a["kd"] = 1
            if t.get("dog") in ("yes", "leashed"): a["dg"] = 1
            if a: A[v["type"][0] + str(v["id"])] = a
        C = {"v": 2, "at": time.time(), "hoods": H, "attrs": A}
        json.dump(C, open(CACHE, "w"), ensure_ascii=False, indent=0)
if not C: sys.exit(0)
def km(a, b, c, d):
    t = math.radians; x = t(d - b) * math.cos(t((a + c) / 2)); y = t(c - a); return 6371 * math.hypot(x, y)
D = json.load(open(CAT)); n = {"nb": 0, "attrs": 0}
def inside(la, lo, poly):
    c = False; j = len(poly) - 1
    for i in range(len(poly)):
        yi, xi = poly[i]; yj, xj = poly[j]
        if (yi > la) != (yj > la) and lo < (xj - xi) * (la - yi) / ((yj - yi) or 1e-12) + xi: c = not c
        j = i
    return c
def area(poly): return abs(sum(poly[i][1] * poly[i - 1][0] - poly[i - 1][1] * poly[i][0] for i in range(len(poly))))
POLYS = sorted([h for h in C["hoods"] if h.get("poly")], key=lambda h: area(h["poly"]))   # smallest area first
NODES = [h for h in C["hoods"] if not h.get("poly")]
print("hood polygons", len(POLYS), "points", len(NODES))
for p in D["places"]:
    best = None
    for h in POLYS:                               # inside a neighbourhood outline: the smallest one wins
        if inside(p["la"], p["lo"], h["poly"]): best = (0, h["n"]); break
    if best is None:                              # otherwise only a very close neighbourhood point counts
        for h in NODES:
            d = km(p["la"], p["lo"], h["la"], h["lo"])
            if d < 0.5 and (best is None or d < best[0]): best = (d, h["n"])
    if best: p["nb"] = best[1]; n["nb"] += 1
    else: p.pop("nb", None)
    for k in ("os", "wc", "rs", "kd", "dg"): p.pop(k, None)
    a = C["attrs"].get(p["id"])
    if a: p.update(a); n["attrs"] += 1
json.dump(D, open(CAT, "w"), ensure_ascii=False, separators=(",", ":"))
print("osm attrs", n, "hoods", len(C["hoods"]))
