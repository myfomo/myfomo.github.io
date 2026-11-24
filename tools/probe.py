# Diagnostics: how each chain's official site lists its branches (robots, sitemaps, homepage links).
import re, sys, urllib.request, urllib.parse, html as H
UA = {"User-Agent": "FOMO-catalog/1.0 (+https://myfomo.github.io)"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r:
        return r.geturl(), r.read().decode("utf-8", "replace")
DOM = ["www.aroma.co.il", "www.landwercafe.co.il", "www.roladin.co.il", "www.cafecafe.co.il", "www.japanika.net",
       "www.benedict.co.il", "www.goldaicecream.co.il", "www.cofix.co.il", "www.mcdonalds.co.il", "www.pizzahut.co.il",
       "www.cafejoe.co.il", "www.hamiznon.com", "www.vitrina.co.il", "www.anita-gelato.com"]
KW = re.compile(r"branch|store|location|סניפ|%d7%a1%d7%a0%d7%99%d7%a4", re.I)
for d in DOM:
    print("=====", d)
    try:
        u, t = get(f"https://{d}/robots.txt"); print("robots:", [l for l in t.splitlines() if "itemap" in l][:5])
    except Exception as e: print("robots err", e)
    for sm in ["sitemap_index.xml", "sitemap.xml", "wp-sitemap.xml"]:
        try:
            u, x = get(f"https://{d}/{sm}"); L = re.findall(r"<loc>([^<]+)</loc>", x)
            print(sm, "->", u, len(L), [urllib.parse.unquote(l) for l in L[:25]]); break
        except Exception as e: print(sm, "err", e)
    try:
        u, t = get(f"https://{d}/"); hrefs = sorted(set(urllib.parse.unquote(h) for h in re.findall(r'href="([^"#]+)"', t) if KW.search(h)))
        print("home ->", u, len(t), hrefs[:20])
    except Exception as e: print("home err", e)
