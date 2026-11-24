# Applies tools/chefs-tlv.json: chef name ("ch") on catalog places, relocations, and new active chef places.
import json, sys, time, re, urllib.request, urllib.parse
CAT, CH = sys.argv[1], sys.argv[2]
UA = {"User-Agent": "FOMO-catalog/1.0 (+https://myfomo.github.io)"}
def geocode(addr):
    q = urllib.parse.urlencode({"q": addr + ", תל אביב", "format": "jsonv2", "limit": 1, "countrycodes": "il"})
    try:
        with urllib.request.urlopen(urllib.request.Request("https://nominatim.openstreetmap.org/search?" + q, headers=UA), timeout=25) as r:
            j = json.loads(r.read()); time.sleep(1.2)
            if j: return round(float(j[0]["lat"]), 6), round(float(j[0]["lon"]), 6)
    except Exception as e: print("geocode", addr, e)
def norm(s): return re.sub(r"[\W_]+", "", (s or "").lower().replace("'", ""))
D = json.load(open(CAT)); P = D["places"]; byid = {p["id"]: p for p in P}
today = time.strftime("%Y-%m-%d"); n = {"tagged": 0, "moved": 0, "added": 0, "active": 0}
for chef, c in json.load(open(CH))["chefs"].items():
    for i in c.get("ids", []):
        p = byid.get(i)
        if not p: print("missing", chef, i); continue
        p["ch"] = chef; p.setdefault("src", {})["ch"] = c["src"][0]; n["tagged"] += 1
    for i in c.get("active", []):
        if i in byid and not byid[i].get("x"): byid[i]["ok"] = today; byid[i]["src"]["ok"] = c["src"][0]; n["active"] += 1
    for i, m in c.get("move", {}).items():
        p = byid.get(i)
        if not p or p.get("a") == m["a"]: continue
        g = geocode(m["a"])
        if not g: print("move: no geocode", i, m["a"]); continue
        p["a"], p["la"], p["lo"] = m["a"], g[0], g[1]; p["ok"] = today; p.setdefault("src", {})["a"] = m["src"][0]; p["src"]["ok"] = m["src"][0]
        p.pop("oh", None); n["moved"] += 1   # old hours belonged to the old location
    for a in c.get("add", []):
        pid = "f-" + norm(a["n"]) + "-" + norm(a["a"])[:20]
        if pid in byid: byid[pid]["ch"] = chef; continue
        g = geocode(a["a"])
        if not g: print("add: no geocode", a["n"], a["a"]); continue
        q = {"id": pid, "n": a["n"], "la": g[0], "lo": g[1], "c": "תל אביב", "a": a["a"], "t": a.get("t", "restaurant"),
             "cu": a.get("cu"), "ch": chef, "ok": today, "src": {"add": a["src"][0], "ok": a["src"][0], "ch": c["src"][0]}}
        if a.get("al"): q["al"] = a["al"]
        P.append(q); byid[pid] = q; n["added"] += 1
D["n"] = len(P)
json.dump(D, open(CAT, "w"), ensure_ascii=False, separators=(",", ":"))
print("chefs", n)
