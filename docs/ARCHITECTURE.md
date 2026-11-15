# Architecture

A static, offline-first web app (PWA). No build step, no framework, no server. Open `index.html` from any static host.

## Files

| Path | What it is |
|---|---|
| `index.html` | Shell: loads `src/app.css` and `src/app.js`, registers the service worker. |
| `src/app.js` | App core: state, rendering, home (top-card carousel with Your best and Archery Ireland news), 3D setup/play/board/summary, course builder, target picker, progress, settings, about, welcome, game rules pop-up, achievements page. |
| `src/target.js` | Indoor and Field rounds (setup incl. Competition / Practice, play, board, summary), profile (read-only view, Edit details, club picker, club colours pop-up, Privacy & contact, Delete all my data), personal bests, progress cards. Receives UI helpers from `app.js` via `init(ctx)`. |
| `src/faces.js` | Target-face engine (pure logic): scoring schemes, `scoreAt(scheme, r)`, compound variants, face drawing (SVG), round presets, totals, Set play, King of the Castle per end. |
| `src/achievements.js` | Achievements engine (pure): 60 badge definitions evaluated over history and sight marks. Unit-tested in `tests/achievements.test.mjs`. |
| `src/colours.js` | Club colours: presets, contrast maths, and per-mode theme tokens (`--brand` fill for white text, `--brand-text` for text on cards, `--brand-deep`, `--accent`), each held to WCAG AA 4.5:1. Written into a `<style id="clubColours">` after `app.css`; the default blue goes through the same rules. Unit-tested in `tests/colours.test.mjs`. |
| `src/sight.js` | Sight marks: per-bow charts grouped by bow type, session flow (arrow calls, extra arrow), curve fit (`sightFit`), tap-to-edit mark and chart-details sheets, image card and Excel export. |
| `src/clubs.js` | Irish archery clubs `[name, county, province]` for the Profile club picker (compiled from public sources; extend by adding lines). |
| `src/scoring.js` | 3D scoring systems (IFAA, WA 3D, NFAS, ASA, IBO) and per-target scoring. |
| `src/games.js` | 3D games: totals, King of the Castle, Skins, Guess the distance, handicap suggestion. |
| `src/icons.js` | Hand-drawn SVG icon set. |
| `src/export.js` | Builds the Excel export (Read me, Profile, Rounds, Arrows, 3D targets, Courses, Sight marks). Loads `vendor/xlsx.mini.min.js` on demand. |
| `vendor/` | SheetJS (xlsx) 0.18.5 mini build, Apache-2.0 (`xlsx-LICENSE.txt`). |
| `src/app.css` | All styles; colour tokens with System / Light / Dark themes (`--danger` for red text, `--danger-fill` for red fills). |
| `sw.js` | Service worker: caches the shell and target library for offline use. **Bump `CACHE` on every release** so phones update. |
| `manifest.webmanifest`, `icon.png` | Install-to-home-screen metadata. |
| `targets/targets.json` | 3D target library: categories, targets, faces (sides), zone polygons in % of the photo. |
| `targets/photos/` | Greyscale cut-out PNGs, one per face. |
| `targets/courses.json` | Built-in courses (Dargle Valley). |
| `tools/trace.html` | Zone tracing tool (phone/desktop). |
| `tests/` | Automated browser tests (Playwright). |
| `docs/` | Manual, decisions, architecture, target notes. |

## Rendering
A tiny `h(tag, attrs, ...children)` helper builds DOM nodes. `render()` rebuilds the current view from `state`. Views are functions keyed by `state.view`. Scroll position is kept on re-render within a view and reset when the view changes (or `state._top` is set, e.g. on next end).

## Storage (all on the device, `localStorage`)

| Key | Contents |
|---|---|
| `wa.profile` | `{ name, bows[], lastBow, ai, club, clubNo, booking, colours?{ c1, c2 }, photo (dataURL 256 px) }`. **Delete all my data** removes every `wa.*` key. |
| `wa.round` | Active 3D round. |
| `wa.tround` | Active indoor/field round. |
| `wa.history` | Finished rounds (all disciplines). 3D rounds have no `kind`; indoor/field have `kind: 'indoor' | 'field'`. |
| `wa.courses` | Saved courses (built-in ones carry `builtin`, `origin`, and `edited` once changed). |
| `wa.names` | Recent player names for autocomplete. |
| `wa.points` | Per-system 3D points overrides from Settings. |
| `wa.sight` | Sight mark charts `[{ id, bow, type, note, created, updated, marks[{ d, s, calls['high'|'on'|'low'], at }] }]`. |
| `wa.sdraft` | Sight marks session in progress. |
| `wa.ach` | Achievement ids already announced. |
| `wa.rulesOff` | Game keys whose rules pop-up is turned off. |
| `wa.news` | Cached archery.ie headlines `{ at, items[{ title, link, date }] }` (refreshed every 3 h when reachable). |
| `wa.theme` | `'system' | 'light' | 'dark'`. |
| `wa.onboarded` | First-run welcome seen. |
| `wa.zones.local` | Rings traced on this phone with the tracing tool (override the shipped ones). |

## Data shapes

**3D course target:** `{ targetId, faceId, pegs: { red: { d, s }, blue: {…}, … } }` (d metres, s slope %).
At round start the chosen peg's values are copied to `distanceActual` / `slope` on each round target.

**3D round:** `{ id, started, mode: 'fun'|'laser', order, baseOrder, peg, showDist, players[{id,name,handicap}], systemKey, arrows, games, targets[], scores{ [targetIndex]: { [playerId]: [zone…] } }, final }`.

**Indoor/field round:** `{ id, kind, started, roundKey, name, face, scheme, dist, ends, arrows, games, mode?: 'practice', goal?, review?, players[{id,name,bow}], scores{ [playerId]: [ [ {v,x,y}… ] per end ] }, end, final{ tally, sets, king } }`.
`v` is `'X'`, a number, or `'M'`; `x,y` are face units (−1…1) only when the arrow was tapped.

## Scoring engine (faces.js)
`scoreAt(scheme, r)` maps normalised radius to a score: `wa10` (10 rings, X inside 10), `spot` (3-spot 10–6), `wafield` (6–1), `ifaa` (5-4-3), and compound variants `wa10c` / `spotc` where only the inner ring scores 10. `schemeFor(base, bow)` picks the compound variant for compound archers. Unit-tested in `tests/scoring.test.mjs`.

## Testing
`tests/` holds unit tests (`*.test.mjs`) and Playwright scripts that drive the app in headless Chromium at Pixel 7 and iPhone SE sizes: full 3D round, indoor/field rounds, practice, compound vs recurve, profile (read-only view, edit, privacy, delete-all), bows, booking, welcome, pegs, theme, club colours, home carousel, achievements, game rules, sight marks (two suites), Excel export, a screen-by-screen **fit walk** that fails on any horizontal overflow, and a **contrast audit** that checks every visible piece of text on the main screens against WCAG AA for 37 club colour choices in light and dark mode. Run with a static server on port 8111 (`python3 -m http.server 8111`) and `node tests/<name>.js` (`DEV='iPhone SE'` for the small phone). Full list in [tests/README.md](../tests/README.md).

## Releasing
1. Change code. 2. Bump `CACHE` in `sw.js`. 3. Run the tests. 4. Commit and push to `main`. GitHub Pages serves `main` at the live URL; installed apps update on next open.
