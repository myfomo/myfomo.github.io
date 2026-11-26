"""'New in town': remembers when each place first appeared in our catalog (tools/first-seen-tlv.json).
The first run records every existing place as already known (no date), so only places that show up later
count as new. Chef places with a known opening month ('since' in tools/chefs-tlv.json) use that month."""
import json, sys, time, os
CAT, FS, CH = sys.argv[1], sys.argv[2], sys.argv[3]
D = json.load(open(CAT)); month = time.strftime("%Y-%m")
first = not os.path.exists(FS)
S = {} if first else json.load(open(FS))
since = {}
for c in json.load(open(CH))["chefs"].values():
    for a in c.get("add", []):
        if a.get("since"): since[a["n"]] = a["since"]
n = 0
for p in D["places"]:
    if p["id"] not in S: S[p["id"]] = "" if first else month
    fs = since.get(p["n"]) or S[p["id"]]
    if fs: p["fs"] = fs; n += 1
    else: p.pop("fs", None)
json.dump(S, open(FS, "w"), ensure_ascii=False, indent=0, sort_keys=True)
json.dump(D, open(CAT, "w"), ensure_ascii=False, separators=(",", ":"))
print("first seen: new places", n, "known", len(S))
