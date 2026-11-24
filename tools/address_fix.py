"""Apply approved address fixes and duplicate merges to the catalog, with a collision check.

tools/address-fixes-<city>.json:
  "fix": {id: {"a": new address, "src": [url], "note": "...",
               "keep_coords"?: true   -> change only the address text (coordinates are already right),
               "la"?, "lo"?           -> coordinates given by hand (otherwise geocoded with Nominatim),
               "shared_ok"?: [ids]    -> places the user approved to share this address (mall, market, hotel)}}
  "dup": {dup_id: {"keep": id, "n"?: name for the kept place, "note": "..."}}   -> dup is removed, its names go to "al"

Collision check (a fix is NOT applied when any of these hold; the reason goes to the report):
  - another active place in the catalog (not closed, not a removed duplicate, not in shared_ok) has the same street + house number;
  - another active place with a different name is within 12 m of the new coordinates;
  - the new point is outside the city's bounding box or more than 3 km from the old point;
  - no coordinates could be found for the new address.
Report: data/address-check-<city>.json. Geocoding results are cached in data/geocode-cache-<city>.json.
Usage: address_fix.py catalog.json fixes.json report.json [--no-geocode]"""
import json, sys, os, re, math, time, urllib.request, urllib.parse

cat, fixes_f, report_f = sys.argv[1:4]
NOGEO = "--no-geocode" in sys.argv
D = json.load(open(cat)); P = {p["id"]: p for p in D["places"]}
F = json.load(open(fixes_f)) if os.path.exists(fixes_f) else {}
FIX, DUP = F.get("fix", {}), F.get("dup", {})
CACHE_F = report_f.replace("address-check-", "geocode-cache-")
CACHE = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}
BBOX = (32.02, 34.73, 32.15, 34.86)  # Tel Aviv-Yafo and its edges

def norm_street(a):
    a = re.sub(r"[\"'׳״`.,\-–]", "", a or "")
    a = re.sub(r"^(רחוב|רח|שדרות|שד|דרך|כיכר|סמטת)\s+", "", a.strip())
    return re.sub(r"\s+", "", a)
def key(a):
    m = re.match(r"^(.*?)\s*(\d+)\s*\S*$", (a or "").strip())
    return (norm_street(m.group(1)), m.group(2)) if m and m.group(1).strip() else None
def same(k1, k2):  # same house number, and one street name equals or ends the other ("כ"ג יורדי הסירה" ~ "יורדי הסירה")
    if not k1 or not k2 or k1[1] != k2[1]: return False
    a, b = sorted((k1[0], k2[0]), key=len)
    return a == b or (len(a) >= 4 and b.endswith(a))
def norm_name(n): return re.sub(r"[\W_]+", "", (n or "").lower())
def dist(a, b):
    dy = (a[0] - b[0]) * 111320; dx = (a[1] - b[1]) * 111320 * math.cos(math.radians(a[0]))
    return math.hypot(dx, dy)
def geocode(addr):
    if addr in CACHE: return CACHE[addr]
    if NOGEO: return None
    m = re.match(r"^(.*?)\s*(\d+\S*)$", addr.strip())
    qs = []
    if m: qs.append({"street": m.group(2) + " " + m.group(1), "city": "Tel Aviv-Yafo", "country": "Israel"})
    qs.append({"q": addr + ", תל אביב-יפו"})
    res = None
    for q in qs:
        q.update(format="json", limit="1", countrycodes="il")
        req = urllib.request.Request("https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(q),
                                     headers={"User-Agent": "fomo-catalog/1.0 (github.com/myfomo/myfomo.github.io)"})
        try:
            j = json.load(urllib.request.urlopen(req, timeout=20))
        except Exception as e:
            print("geocode error", addr, e); j = []
        time.sleep(1.1)  # Nominatim usage policy: at most 1 request per second
        if j: res = [round(float(j[0]["lat"]), 6), round(float(j[0]["lon"]), 6)]; break
    if res: CACHE[addr] = res
    return res

report = {"fix": {}, "dup": {}}
# 1) duplicates: drop the duplicate, keep its names searchable on the kept place
gone = set()
for d, info in DUP.items():
    k = info.get("keep")
    if d not in P or k not in P: report["dup"][d] = {"status": "skipped", "why": "id not in catalog"}; continue
    kp, dp = P[k], P[d]; al = kp.setdefault("al", [])
    if info.get("n") and info["n"] != kp["n"]:
        if kp["n"] not in al: al.append(kp["n"])
        kp["n"] = info["n"]
    for nm in [dp["n"]] + dp.get("al", []):
        if nm != kp["n"] and nm not in al: al.append(nm)
    gone.add(d); report["dup"][d] = {"status": "merged", "into": k, "name": dp["n"]}
D["places"] = [p for p in D["places"] if p["id"] not in gone]
active = [p for p in D["places"] if not p.get("x")]

# 2) address fixes with the collision check
for i, f in FIX.items():
    p = P.get(i); r = {"name": p["n"] if p else "?", "old": p.get("a") if p else None, "new": f.get("a")}
    report["fix"][i] = r
    if not p or i in gone: r.update(status="skipped", why="id not in catalog"); continue
    k = key(f["a"]); shared = set(f.get("shared_ok", []))
    clash = [q for q in active if q["id"] != i and q["id"] not in shared and k and same(key(q.get("a")), k)]
    if clash:
        r.update(status="blocked", why="address already used by: " + ", ".join(f'{q["n"]} ({q["id"]}, {q.get("a")})' for q in clash)); continue
    if f.get("keep_coords"):
        new = [p["la"], p["lo"]]
    else:
        new = [f["la"], f["lo"]] if "la" in f else geocode(f["a"])
        if not new: r.update(status="blocked", why="no coordinates found for the new address"); continue
        if not (BBOX[0] <= new[0] <= BBOX[2] and BBOX[1] <= new[1] <= BBOX[3]):
            r.update(status="blocked", why=f"geocoded point {new} is outside Tel Aviv"); continue
        if dist(new, (p["la"], p["lo"])) > 3000:
            r.update(status="blocked", why=f"geocoded point {new} is {dist(new, (p['la'], p['lo'])):.0f} m from the old point"); continue
        near = [q for q in active if q["id"] != i and q["id"] not in shared and norm_name(q["n"]) != norm_name(p["n"])
                and dist(new, (q["la"], q["lo"])) < 12]
        if near:
            r.update(status="blocked", why="another place is within 12 m: " + ", ".join(f'{q["n"]} ({q["id"]})' for q in near)); continue
    r.update(status="applied", moved_m=round(dist(new, (p["la"], p["lo"]))))
    p["a"] = f["a"]; p["la"], p["lo"] = new
    s = p.setdefault("src", {}); s["a"] = (f.get("src") or ["fix"])[0]

json.dump(D, open(cat, "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(report, open(report_f, "w"), ensure_ascii=False, indent=1)
if not NOGEO: json.dump(CACHE, open(CACHE_F, "w"), ensure_ascii=False, indent=1)
st = [v["status"] for v in report["fix"].values()]
print("address fixes:", {s: st.count(s) for s in set(st)}, "duplicates merged:", len(gone))
for i, v in report["fix"].items():
    if v["status"] == "blocked": print("BLOCKED", i, v["name"], "->", v["new"], ":", v["why"])
