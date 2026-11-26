"""Add hand-picked places (tools/manual-<city>.json) that OpenStreetMap is missing. Usage: manual_add.py <catalog> <manual.json>"""
import json, math, re, sys, os
cat_p, man_p = sys.argv[1], sys.argv[2]
if not os.path.exists(man_p): sys.exit(0)
cat = json.load(open(cat_p)); man = json.load(open(man_p)).get("places", [])
key = lambda s: re.sub(r"[^\w]", "", (s or "").lower())
def dist(a, b):
    return math.hypot((a["la"] - b["la"]) * 111000, (a["lo"] - b["lo"]) * 94000)
ids = {p["id"] for p in cat["places"]}
added = 0
for m in man:
    names = {key(x) for x in [m["n"], *m.get("al", [])]}
    same = [p for p in cat["places"] if p["id"] != m["id"] and dist(p, m) < 80 and names & {key(x) for x in [p.get("n"), *p.get("al", [])]}]
    if same:
        print("skip (already in OSM):", m["n"], "->", same[0]["id"])
        cat["places"] = [p for p in cat["places"] if p["id"] != m["id"]]
        continue
    row = {k: v for k, v in m.items() if k != "added"}
    if m["id"] in ids:
        cat["places"] = [({**p, **row} if p["id"] == m["id"] else p) for p in cat["places"]]
    else:
        cat["places"].append(row); added += 1
cat["n"] = len(cat["places"])
json.dump(cat, open(cat_p, "w"), ensure_ascii=False, separators=(",", ":"))
print("manual places added:", added)
