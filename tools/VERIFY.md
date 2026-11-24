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
- Make sure it is the **same branch** (address matches). If sources disagree → `conflict`, change nothing.
- Nothing reliable found → `none`, change nothing.

## Writing results
- Active / details → `tools/verified-tlv.json` under `places[id]`: `{"n": name, "ok": "YYYY-MM", "oh"?, "p"?, "w"?, "bk"?, "src": [url, ...]}`.
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

## Phase 2 — when `order` is used up
Re-check, 50 per run, the ids in `done` with `r` = `conflict` or `single` (then `none`), and catalog places that are
active but missing hours (`oh`), phone (`p`) or website (`w`). Look only for what is missing and resolve conflicts by
the same rules; update `done[id]` (add `"r2"` with the new result and date). Report what was resolved and what still needs the user.
