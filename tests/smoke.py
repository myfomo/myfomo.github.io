"""FOMO smoke tests: run before every deploy (see .github/workflows/deploy.yml).
Serves the site with a fake Supabase backend (tests/mock-supabase.js) and checks the main flows.
Run locally:  python -m http.server 8765 &  python tests/smoke.py
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:8765/"
FAKE_CONFIG = 'window.APP_CONFIG={supabaseUrl:"https://x.supabase.co",supabaseKey:"test",googleKey:"",vapidPublic:""};'
OSM = [{"name": "מוזמביק בר", "display_name": "מוזמביק בר, תל אביב", "lat": "32.0664", "lon": "34.7705", "category": "amenity", "type": "bar", "osm_type": "node", "osm_id": 1,
        "address": {"road": "נחלת בנימין", "house_number": "29", "city": "תל אביב"}, "extratags": {}},
       {"name": "רחוב מוזמביק", "display_name": "רחוב מוזמביק, חולון", "lat": "32.0", "lon": "34.7", "category": "highway", "type": "residential", "address": {"city": "חולון"}}]
fails = []

def check(name, ok, info=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  ({info})" if info and not ok else ""))
    if not ok: fails.append(name)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, service_workers="block",
                                  geolocation={"latitude": 32.07, "longitude": 34.78}, permissions=["geolocation"])
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.route("**/config.js*", lambda r: r.fulfill(body=FAKE_CONFIG, content_type="text/javascript"))
        await pg.route("**/vendor/supabase.js*", lambda r: r.fulfill(path="tests/mock-supabase.js", content_type="text/javascript"))
        await pg.route("**/nominatim.openstreetmap.org/**", lambda r: r.fulfill(body=json.dumps(OSM), content_type="application/json"))
        for pat in ["**/tile.openstreetmap.org/**", "**/photon.komoot.io/**", "**/api.open-meteo.com/**", "**/maps.googleapis.com/**", "**/google.com/**"]:
            await pg.route(pat, lambda r: r.abort())
        await pg.goto(BASE)
        await pg.evaluate("localStorage.setItem('rs-pk','1');localStorage.setItem('rs-list','L1');localStorage.setItem('rs-onb','1');localStorage.setItem('rs-onb2','1');localStorage.setItem('rs-tips-off','1');localStorage.setItem('rs-push-asked','1');localStorage.setItem('rs-inst-dis',String(Date.now()+9e9))")
        await pg.reload(); await pg.wait_for_timeout(4000)
        await pg.evaluate("document.querySelectorAll('.calp,.onb').forEach(x=>x.remove())")

        n = await pg.evaluate("document.querySelectorAll('#grid .card').length")
        check("list shows places", n >= 3, n)
        check("bottom tabs", await pg.evaluate("document.querySelectorAll('.tabbar a').length") >= 4)

        await pg.click(".card[data-id=a]"); await pg.wait_for_timeout(700)
        check("place page opens", await pg.evaluate("!!document.querySelector('#sb h2')"))
        check("action bar", await pg.evaluate("document.querySelectorAll('.dbar>*').length") >= 3)
        await pg.click("#closeBtn"); await pg.wait_for_timeout(600)

        await pg.evaluate("newForm()"); await pg.wait_for_timeout(500)
        await pg.fill("#placeQ", "בלבוי"); await pg.click("[data-act=placeSearch]"); await pg.wait_for_timeout(900)
        res = await pg.inner_text("#placeRes")
        check("search finds catalog place", "בל בוי" in res, res[:80])
        await pg.fill("#placeQ", "מוזמבק"); await pg.click("[data-act=placeSearch]"); await pg.wait_for_timeout(1500)
        res = await pg.inner_text("#placeRes")
        check("search falls back to open map, food only", "מוזמביק בר" in res and "רחוב" not in res, res[:120])
        await pg.evaluate("closeSheet()"); await pg.wait_for_timeout(300)

        await pg.click(".tabbar a[data-v=map]"); await pg.wait_for_timeout(2000)
        check("map loads on demand", await pg.evaluate("!!window.L && document.querySelectorAll('#lmap .leaflet-marker-icon').length>0"))
        await pg.click(".tabbar a[data-v=timeline]"); await pg.wait_for_timeout(700)
        check("outings tab", "בקרוב" in await pg.inner_text("#soon"))
        await pg.click(".tabbar a[data-v=me]"); await pg.wait_for_timeout(700)
        check("me tab", await pg.evaluate("document.querySelectorAll('.me-grid>*').length") >= 6)

        await pg.click(".tabbar a[data-v=list]"); await pg.wait_for_timeout(700)
        n0 = await pg.evaluate("document.querySelectorAll('.card').length")
        await pg.click(".card[data-id=b]"); await pg.wait_for_timeout(600)
        await pg.click("#sb [data-act=del]"); await pg.wait_for_timeout(500)
        n1 = await pg.evaluate("document.querySelectorAll('.card').length")
        await pg.click("#utBtn"); await pg.wait_for_timeout(400)
        n2 = await pg.evaluate("document.querySelectorAll('.card').length")
        check("delete + undo", n1 == n0 - 1 and n2 == n0, f"{n0},{n1},{n2}")

        check("no page errors", not errs, "; ".join(errs[:3]))
        await b.close()
    if fails:
        print(f"\n{len(fails)} test(s) failed"); sys.exit(1)
    print("\nall good")

asyncio.run(main())
