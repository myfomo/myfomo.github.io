# Daily place verification (FOMO catalog, Tel Aviv)

Each run checks the next **50** places from `tools/verify-queue.json` (ids in `order` that are not yet in `done`),
on the `osm-check` branch of `myfomo/myfomo.github.io`. The catalog is `data/places-tlv.json`
(`places[]`: `id, n` name, `al` other names, `a` address, `t` type, `w` website, `p` phone, `oh` hours, `ok`, `x`).

## Sources, per place
1. The place's own website (`w`, or found by search) — strongest source.
2. Booking pages: **Tabit** (tabitisrael.co.il) and **Ontopo** (ontopo.com / ontopo.co.il) — read the public page of that one place only.
   No bulk downloading, no internal APIs.
3. News and guides: Time Out Tel Aviv, ynet, Maariv, Walla, Haaretz, Calcalist, Mako, ice, Israel Hayom.
4. Never use Google Maps / Google search snippets as a data source, never copy reviews, never use Wolt's internal API.

5. **Gemini leads** (`data/gemini-flags-tlv.json`, `places[id]`): status open/closed/moved + evidence URLs.
   A lead only — open its evidence URLs and decide by the rules below; never copy a Gemini answer as fact,
   never store hours/phones from it. Start each run with queue places that Gemini flagged `closed` or `moved`.

## Minimum effort per place (do not skip)
At least: (a) one web search for the name + "תל אביב", (b) the own website if one exists or is found,
(c) a search for the place on Tabit and on Ontopo, (d) one search for closure news ("נסגרה"/"closed").
In `note`, list in a few words what was found (e.g. "Ontopo active; site down; Time Out 2026-03").
If exactly one recent source supports it, use result `single` (not `none`) and give that source's URL in `note`.

## Decision rules (no guessing)
- **ok (active)**: own site is live and names this place/branch, OR an active Tabit/Ontopo booking page for this branch,
  OR two independent recent sources (2025–2026) agree it operates.
- **closed**: only from a reliable source saying it closed (news article, own site/social post). Record the URL.
- **hours `oh`**: only from the own site, or two sources that agree. OpenStreetMap syntax (`Su-Th 12:00-23:00; Fr 12:00-16:00; Sa off`).
- **phone `p` / website `w` / booking link `bk`**: from the own site or the booking page.
- **Fill every detail you can** for each place found active (user request, 2026-11): hours, website, phone, booking link,
  official name, style, price level, kosher/vegan — each only from a reliable source as below. Never guess.
- **official name `nm`**: only when the own site or booking page shows the venue's name clearly differently from the catalog `n`
  (spelling, full name). The catalog name is kept as an alternative name automatically.
- **style `cu`**: exactly one value from the app list: איטלקי, אסייתי, יפני / סושי, בשרים, דגים ופירות ים, ים-תיכוני, המבורגר,
  פיצה, מקסיקני, הודי, מסעדת שף, בר קוקטיילים, בר יין, בר, פאב, קפה ובראנץ', טבעוני, חומוס ומזרחי, קינוחים, אחר —
  from the own site, the booking page, or a news/guide article that describes the place. Set it even if the catalog has one, when the source is clearer.
- **price level `pr`** (1–4): from menu prices on the own site / booking page, or a guide article giving prices.
  Typical main dish (bars: typical cocktail/beer + bite): 1 = up to ₪50, 2 = ₪50–90, 3 = ₪90–150, 4 = over ₪150.
- **kosher `k` / vegan `vg`** (value 1): only when the own site, booking page or a kosher listing says so (kosher: certificate named).
- **address `a`: never change it in the verification files** — navigation in the app depends on the catalog address and coordinates.
  If the address looks wrong or the place moved, use `conflict` and say so in `note`.
- **Address fixes (user-approved, 2026-11)**: when a reliable source states the exact new address (moved place, wrong/partial catalog address)
  or two catalog entries are the same place, add it to `tools/address-fixes-tlv.json` (`fix` / `dup`, see `tools/address_fix.py`),
  then list it in the report for the user. The workflow applies it only if the **collision check** passes: no other active place
  has the same street + number, nothing else within 12 m, the new point is in Tel Aviv and within 3 km of the old one.
  Blocked fixes are listed in `data/address-check-tlv.json` — report them to the user; a shared address (mall, market, hotel)
  is applied only after the user approves it (`shared_ok`). Places outside Tel Aviv are real places: leave them as they are.
- Make sure it is the **same branch** (address matches). If sources disagree → `conflict`, change nothing.
- Nothing reliable found → `none`, change nothing.

## Writing results
- Active / details → `tools/verified-tlv.json` under `places[id]`:
  `{"n": catalog name, "ok": "YYYY-MM", "nm"?, "cu"?, "pr"?, "oh"?, "p"?, "w"?, "bk"?, "k"?, "vg"?, "src": [url, ...]}`.
  `ok` is the month of the most recent source that showed the place operating (not just the month of the check).
- Closed → `tools/closed-tlv.json` under `closed[id]`: `{"n": name, "d": "YYYY or YYYY-MM", "src": [url, ...]}`.
- Every checked id → `tools/verify-queue.json` `done[id] = {"r": "ok|closed|single|none|conflict", "note": short English note}`.
- Validate JSON (`python3 -m json.tool`) before committing.

## Publish
Commit the three JSON files on `osm-check` as `AdiRzInG <AdiRzInG@users.noreply.github.com>` with message
`Verification batch: N ok, N closed, N none, N conflict`, then `git pull --rebase` and push to `osm-check`.
The push runs the `osm-check` workflow, which applies the results and publishes the data to the live site
(data only — never bump the app version, never edit app code).

## Report (Hebrew)
Short summary to the user: how many checked / ok / closed / no source / conflict, places left in the queue,
and the names of the places found closed.

Then a section **"מחכה לאישור שלך"** (user request 2026-11-26). Pull first, so `data/address-check-tlv.json` reflects the latest workflow run.
List every fix there that is not `applied`, grouped:
- (a) **shared address**: same street + number as another place (mall, complex). Needs the user's `shared_ok`.
- (b) **another place within 12 m**: these are separate places with their own addresses. Never merge them. The user's choice (2026-11-26,
  for Albert 1943, Porter & Sons, McDonald's Rothschild 33) is to change only the address text and keep the point (`keep_coords`).
  Propose the same for new cases and ask; do not apply it without approval.
- (c) **technical blocks** (no coordinates found, geocoded point too far): need manual coordinates (`la`/`lo`).
- (d) **suspected duplicates**: a fix blocked because an entry with the same name already stands at that address. Propose a `dup` merge.

Also list places from this run whose branch match rests on judgement rather than a source, and places that could not be checked
because a site was blocked. For each item give the name, old → new address and the reason.
Never add `shared_ok` or a `dup` merge without the user's explicit approval in a live reply.

## Phase 2 — when `order` is used up
Re-check, 50 per run, the ids in `done` with `r` = `conflict` or `single` (then `none`), and catalog places that are
active but missing hours (`oh`), phone (`p`) or website (`w`). Look only for what is missing and resolve conflicts by
the same rules; update `done[id]` (add `"r2"` with the new result and date). Report what was resolved and what still needs the user.
