"""Fetch food & drink places for a city from OpenStreetMap (Overpass) and print coverage stats.
Data: © OpenStreetMap contributors, ODbL."""
import json, sys, urllib.request, urllib.parse, collections
BBOX = sys.argv[1] if len(sys.argv) > 1 else "32.029,34.739,32.147,34.853"  # Tel Aviv-Yafo: south,west,north,east
Q = f'[out:json][timeout:120];nwr({BBOX})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|biergarten)$"]["name"];out tags center meta;'
import time
E = None
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
for attempt in range(4):
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": Q}).encode(), headers={"User-Agent": "fomo-catalog-check/1.0 (myfomo.github.io)"})
            E = json.load(urllib.request.urlopen(req, timeout=200))["elements"]
            if len(E) < 200: print("too few", url, len(E)); E = None; continue
            print("ok", url, len(E)); break
        except Exception as e:
            print("fail", url, e)
    if E is not None: break
    time.sleep(30)
if E is None: sys.exit("no Overpass mirror answered")
T = [e.get("tags", {}) for e in E]
n = len(T)
pct = lambda k: f"{k} ({round(100*k/max(n,1))}%)"
cnt = lambda f: pct(sum(1 for t in T if f(t)))
stats = {
  "total": n,
  "by_type": dict(collections.Counter(t["amenity"] for t in T).most_common()),
  "with_address": cnt(lambda t: t.get("addr:street")),
  "with_house_number": cnt(lambda t: t.get("addr:housenumber")),
  "with_hours": cnt(lambda t: t.get("opening_hours")),
  "with_cuisine": cnt(lambda t: t.get("cuisine")),
  "with_website": cnt(lambda t: t.get("website") or t.get("contact:website") or t.get("contact:instagram") or t.get("contact:facebook")),
  "with_phone": cnt(lambda t: t.get("phone") or t.get("contact:phone")),
  "with_hebrew_name": cnt(lambda t: t.get("name:he") or any("֐" <= c <= "׿" for c in t.get("name", ""))),
  "kosher_tagged": cnt(lambda t: t.get("diet:kosher")),
  "vegan_tagged": cnt(lambda t: t.get("diet:vegan") in ("yes", "only")),
  "gluten_free_tagged": cnt(lambda t: t.get("diet:gluten_free") in ("yes", "only")),
  "outdoor_seating": cnt(lambda t: t.get("outdoor_seating")),
  "top_cuisines": collections.Counter(c.strip() for t in T for c in t.get("cuisine", "").split(";") if c.strip()).most_common(25),
}
json.dump(stats, open("osm_stats.json", "w"), ensure_ascii=False, indent=1)
json.dump(E, open("osm_places.json", "w"), ensure_ascii=False)
print(json.dumps(stats, ensure_ascii=False, indent=1))
