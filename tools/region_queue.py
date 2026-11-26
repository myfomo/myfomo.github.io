"""Keep tools/verify-queue-<key>.json in step with the region catalog: new ids are appended to 'order'
(places with a website first, then with an address). Usage: region_queue.py <key>"""
import json, sys, os
k = sys.argv[1]; Q = f"tools/verify-queue-{k}.json"
P = [p for p in json.load(open(f"data/places-{k}.json"))["places"] if not p.get("x")]
q = json.load(open(Q)) if os.path.exists(Q) else {"note": "Verification queue for this region, same rules as verify-queue.json (tools/VERIFY.md).", "order": [], "done": {}}
have = set(q["order"])
new = sorted((p for p in P if p["id"] not in have), key=lambda p: (not p.get("w"), not p.get("a"), p["n"]))
q["order"] += [p["id"] for p in new]
json.dump(q, open(Q, "w"), ensure_ascii=False, indent=0)
print(k, "queue", len(q["order"]), "done", len(q["done"]), "added", len(new))
