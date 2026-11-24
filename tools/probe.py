# Diagnostics: how each chain's official site lists its branches (robots, sitemaps, homepage links).
import re, sys, urllib.request, urllib.parse, html as H
UA = {"User-Agent": "FOMO-catalog/1.0 (+https://myfomo.github.io)"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r:
        return r.geturl(), r.read().decode("utf-8", "replace")
import sys
KW = re.compile(r"branch|store|location|סניפ", re.I)
def text(t):
    t=re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>"," ",t); t=re.sub(r"(?i)<br\s*/?>|</(p|div|li|h\d|tr|span)>","\n",t)
    t=H.unescape(re.sub(r"<[^>]+>"," ",t)); return "\n".join(l.strip() for l in t.splitlines() if l.strip())
for u in ["https://japanika.net/branch-sitemap.xml","https://www.pizzahut.co.il/all-branches/מרכז/סניפי-תל-אביב/תל-אביב-יפו/",
          "https://www.anita-gelato.com/our-locations/","https://www.benedict.co.il/sitemap_pages_1.xml?from=75328323775&to=120236835007",
          "https://www.landwercafe.co.il/branch/בילו/"]:
    print("=====", u)
    try:
        r, t = get(urllib.parse.quote(u, safe=":/?=&"))
        L = re.findall(r"<loc>([^<]+)</loc>", t)
        if L: print([urllib.parse.unquote(l) for l in L][:60]); continue
        print("links:", sorted(set(urllib.parse.unquote(h) for h in re.findall(r'href="([^"#]+)"', t) if KW.search(urllib.parse.unquote(h)) or "סניף" in urllib.parse.unquote(h)))[:40])
        tx = text(t); i = max(0, tx.find("תל אביב")-600); print("text:", tx[i:i+1800])
    except Exception as e: print("err", e)
