# Tests

Browser tests drive the app in headless Chromium (Playwright) at phone sizes.

```
python3 -m http.server 8111        # from the repo root
# unit tests
node tests/scoring.test.mjs        # scoring engine
node tests/achievements.test.mjs   # achievements engine
node tests/colours.test.mjs        # club colours stay readable (presets + awkward picks)
# browser tests (Pixel 7; add DEV='iPhone SE' for the small phone)
node tests/fit.js                  # every screen, Pixel 7 + iPhone SE, fails on horizontal overflow
node tests/smoke.js                # a full 3D round
node tests/indoor.js               # profile, indoor Vegas set play, field, progress, history
node tests/practice.js             # indoor/field practice: goal required, shown while shooting, saved
node tests/bow.js                  # compound vs recurve on the same tap
node tests/bows2.js                # several bows, last-used default
node tests/book.js                 # club picker + booking tile
node tests/welcome.js              # first-run welcome
node tests/pegs.js                 # per-peg distances
node tests/theme.js                # appearance, settings inside the profile
node tests/profile.js              # read-only view, Edit details, Cancel, Save, privacy card, delete all
node tests/colours.js              # club colours: pop-up picker, preview, cancel, save, reload, dark mode
node tests/home.js                 # home carousel: 3 slides, dots, best scores, news link
node tests/achievements.js         # unlock pop-up, page, home tile
node tests/rules.js                # game rules pop-up
node tests/sight.js                # sight marks: two bows, session, chart, image + Excel
node tests/sight2.js               # sight marks: grouping, tap-to-edit, delete, chart edit, extra arrow
node tests/export.js               # shoots rounds, exports, saves the .xlsx to /tmp
node tests/contrast.js             # WCAG AA text contrast on main screens, 37 colour choices (QUICK=1 for 5)
```
Set `BASE` to test a different URL, e.g. `BASE=https://lazymadigan.github.io/wicklow-archers-3d-fun-app node tests/smoke.js`.
Screenshots are written to `/tmp`.
