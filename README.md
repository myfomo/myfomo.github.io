# Fomo · המקומות שאסור לפספס

אפליקציה משותפת למעקב אחרי מסעדות וברים: איפה היינו, לאן רוצים ללכת, תמונות, דירוגים, מפה, ציר זמן וסטטיסטיקות.

- אתר סטטי (GitHub Pages) שאפשר להתקין במסך הבית (PWA).
- הנתונים והתמונות נשמרים ב-Supabase, ורק משתתפים שנוספו ברשימה יכולים לראות אותם.
- מפה: OpenStreetMap עם Leaflet. חיפוש מקומות: Nominatim.

## Development
- Edit `src/app.js`, then run `./build.sh` (needs `npm i -g terser`) to produce the minified `app.js` the site serves.
- On each release bump `?v=` in `index.html`, `CACHE` in `sw.js`, `APPV` in `src/app.js` and `version.json` (the app shows a "new version" banner when they differ).
- `tests/smoke.py` runs the main flows against a fake backend; GitHub Actions runs it before every deploy.
