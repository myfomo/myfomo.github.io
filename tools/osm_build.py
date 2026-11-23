"""Turn osm_places.json (Overpass output) into the compact catalog file the app reads: data/places-<city>.json.
Data © OpenStreetMap contributors, available under the Open Database License (ODbL)."""
import json, sys, re, os
src, out, city_default = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "תל אביב"
E = json.load(open(src))
CU = [  # OSM cuisine keyword -> app cuisine (first match wins)
 (r"sushi|japanese|ramen", "יפני / סושי"), (r"pizza", "פיצה"), (r"italian|pasta", "איטלקי"),
 (r"burger", "המבורגר"), (r"steak|meat|grill|barbecue|bbq|churrasc", "בשרים"), (r"fish|seafood", "דגים ופירות ים"),
 (r"asian|chinese|thai|vietnam|korean|noodle|dim_sum|poke", "אסייתי"), (r"mexican|tex-mex|taco|burrito", "מקסיקני"),
 (r"indian", "הודי"), (r"hummus|falafel|shawarma|middle_eastern|regional|israeli|arab|kebab|yemen|lebanese", "חומוס ומזרחי"),
 (r"mediterranean|greek|balkan", "ים-תיכוני"), (r"vegan", "טבעוני"),
 (r"ice_cream|dessert|cake|pastry|frozen_yogurt|chocolate|bakery", "קינוחים"), (r"coffee|breakfast|brunch|cafe|sandwich|bagel", "קפה ובראנץ'"),
 (r"fine_dining", "מסעדת שף"), (r"wine", "בר יין"), (r"cocktail", "בר קוקטיילים")]
def cuisine(t):
    c = (t.get("cuisine") or "").lower(); a = t.get("amenity"); nm = (t.get("name", "") + " " + t.get("name:en", "")).lower()
    for rx, v in CU:
        if re.search(rx, c): return v
    if a == "bar": return "בר יין" if re.search(r"wine|יין|vino", nm) else ("בר קוקטיילים" if "cocktail" in nm else "בר")
    if a == "pub" or a == "biergarten": return "פאב"
    if a == "cafe": return "קפה ובראנץ'"
    if a == "ice_cream": return "קינוחים"
    return ""
CITY = {"tel aviv-yafo": "תל אביב", "tel aviv": "תל אביב", "תל אביב-יפו": "תל אביב", "תל אביב יפו": "תל אביב", "יפו": "תל אביב", "jaffa": "תל אביב"}
rows = []
for e in E:
    t = e.get("tags", {}); nm = (t.get("name:he") or t.get("name") or "").strip()
    if not nm or t.get("disused:amenity") or t.get("opening_hours") == "closed": continue
    lat = e.get("lat") or (e.get("center") or {}).get("lat"); lon = e.get("lon") or (e.get("center") or {}).get("lon")
    if lat is None: continue
    city = (t.get("addr:city") or "").strip(); city = CITY.get(city.lower(), city) or city_default
    r = {"id": e["type"][0] + str(e["id"]), "n": nm, "la": round(lat, 6), "lo": round(lon, 6), "c": city}
    alt = [x for x in {t.get("name"), t.get("name:en"), t.get("name:he")} if x and x != nm]
    if alt: r["al"] = alt
    st = " ".join(x for x in [t.get("addr:street", ""), t.get("addr:housenumber", "")] if x).strip()
    if st: r["a"] = st
    cu = cuisine(t)
    if cu: r["cu"] = cu
    if t.get("opening_hours"): r["oh"] = t["opening_hours"]
    w = t.get("website") or t.get("contact:website") or t.get("contact:instagram") or t.get("contact:facebook")
    if w: r["w"] = w if w.startswith("http") else "https://" + w
    p = t.get("phone") or t.get("contact:phone")
    if p: r["p"] = p
    if t.get("diet:kosher") in ("yes", "only"): r["k"] = 1
    if t.get("diet:vegan") in ("yes", "only") or "vegan" in (t.get("cuisine") or ""): r["vg"] = 1
    if t.get("diet:vegetarian") in ("yes", "only"): r["v"] = 1
    if t.get("diet:gluten_free") in ("yes", "only"): r["gf"] = 1
    if t.get("wikidata"): r["wd"] = t["wikidata"]
    r["t"] = t.get("amenity")
    rows.append(r)
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({"src": "© OpenStreetMap contributors (ODbL)", "city": city_default, "n": len(rows), "places": rows}, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
print("wrote", out, len(rows), "places,", os.path.getsize(out) // 1024, "KB")
