# Tests

Browser tests drive the app in headless Chromium (Playwright) at phone sizes.

```
python3 -m http.server 8111        # from the repo root
node tests/scoring.test.mjs        # scoring engine unit tests
node tests/fit.js                  # every screen, Pixel 7 + iPhone SE, fails on horizontal overflow
node tests/smoke.js                # a full 3D round
node tests/indoor.js               # profile, indoor Vegas set play, field, progress, history
DEV='iPhone SE' node tests/indoor.js
node tests/bow.js                  # compound vs recurve on the same tap
node tests/export.js              # shoots rounds, exports, saves the .xlsx to /tmp
node tests/practice.js              # indoor/field practice: goal required, shown while shooting, saved
node tests/bows2.js  tests/book.js  tests/welcome.js  tests/pegs.js  tests/theme.js
```
Set `BASE` to test a different URL, e.g. `BASE=https://lazymadigan.github.io/wicklow-archers-3d-fun-app node tests/smoke.js`.
Screenshots are written to `/tmp`.
