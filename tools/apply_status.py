"""Apply verified status to the catalog: closed places (tools/closed-<city>.json) get "x" and are hidden by the app;
places whose own website answers and names them get "ok" (date of the check)."""
import json, sys, os, time
cat, closed, sitecheck = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""
D = json.load(open(cat)); C = json.load(open(closed))["closed"]
S = json.load(open(sitecheck)) if sitecheck and os.path.exists(sitecheck) else {}
VF = closed.replace("closed-", "verified-")
VER = json.load(open(VF))["places"] if os.path.exists(VF) else {}
today = time.strftime("%Y-%m-%d"); nx = nv = 0
for p in D["places"]:
    if p["id"] in C: p["x"] = C[p["id"]]["d"]; nx += 1
    # a mapper confirmed the place on the ground in the last 18 months (OpenStreetMap check_date / survey:date)
    if not p.get("x") and p.get("cd") and p["cd"] >= time.strftime("%Y-%m-%d", time.gmtime(time.time() - 548*86400)): p["ok"] = p["cd"]; p.setdefault("src", {})["ok"] = "osm-survey"; nv += 1
    V = VER.get(p["id"])
    if V and not p.get("x"):
        # values checked against the venue's own site / booking page / guides replace older ones.
        # The address is never changed here (navigation depends on the OpenStreetMap address and coordinates).
        for k in ("oh", "p", "w", "bk", "cu", "pr", "k", "vg"):
            if V.get(k):
                p[k] = V[k]; p.setdefault("src", {})[k] = (V.get("src") or ["web"])[0]
        # official name ("nm") replaces the catalog name; the old name stays searchable in "al"
        if V.get("nm") and V["nm"] != p["n"]:
            al = p.setdefault("al", [])
            if p["n"] not in al: al.append(p["n"])
            p["n"] = V["nm"]; p.setdefault("src", {})["n"] = (V.get("src") or ["web"])[0]
        if V.get("ok"): p["ok"] = V["ok"]; p.setdefault("src", {})["ok"] = (V.get("src") or ["web"])[0]; nv += 1
    s = S.get(p["id"])
    if s and s.get("st") == 200 and s.get("name") and not s.get("closed_txt") and not p.get("x"): p["ok"] = today; nv += 1
json.dump(D, open(cat, "w"), ensure_ascii=False, separators=(",", ":"))
print("closed", nx, "verified by own site", nv)
