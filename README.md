# 3D Fun Round

Free, volunteer-built phone app for scoring 3D, indoor and field archery rounds with friends. Club-neutral: any club can use it.
Runs as a web app (install to home screen, works offline). No accounts, no server: everything is stored on the phone.

**Live app:** https://lazymadigan.github.io/Archery_App/

## Documentation
- [docs/MANUAL.md](docs/MANUAL.md) — how to use the app
- [CHANGELOG.md](CHANGELOG.md) — every revision
- [docs/DECISIONS.md](docs/DECISIONS.md) — UI and design decisions and why
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — code, data and storage
- [docs/TARGETS.md](docs/TARGETS.md) — target identification and ring-tracing status
- [docs/diagrams/](docs/diagrams/3D-Fun-Round-interface-diagrams.pdf) — interface diagrams (PDF): app map, Indoor & Field round, 3D round, Sight marks, Profile & privacy
- [tests/](tests/README.md) — automated phone tests
- [PRIVACY.md](PRIVACY.md) · [FAIR-USE.md](FAIR-USE.md) · [LICENSE](LICENSE)

## Privacy, in one line
Your archery data never leaves your phone: no accounts, no server, no analytics. The app only makes ordinary web requests to load itself (GitHub Pages), its font (Google Fonts) and archery.ie headlines. See [PRIVACY.md](PRIVACY.md).

## Use it, share it
Free for any club or archer, MIT licensed. See [FAIR-USE.md](FAIR-USE.md). Manual: [docs/MANUAL.md](docs/MANUAL.md).

## Help wanted: trace the rings
Most targets don't have their scoring rings traced yet. In the app: Profile → Settings → About → **Open the tracing tool** (or go straight to `tools/trace.html`), tap around the lines, Save, Copy JSON, and paste it into an issue. A minute each, and it makes the tap-to-score work for everyone.

## What it does
- **Home:** swipeable top card (welcome · your best scores · Archery Ireland news); **Shoot now** (3D Course, Indoor, Field); **Off the line** (Progress, History, Booking, Sight marks, 3D Courses, 3D Targets, Achievements).
- **Three disciplines:** 3D Course, Indoor (WA 18, Half WA 18, Vegas 300, Portsmouth, Custom; 18 / 15 / 10 m) and Field (WA 6–1 or IFAA 5-4-3; 10–70 m).
- **Indoor & field:** tap-the-face scoring with arrow group plots; compound inner-10 rule applied automatically. **Competition** (games: Total, King of the Castle, Set play) or **Practice** with a required goal for the session and a "How did it go?" note.
- **3D:** players (up to 6), scoring systems (IFAA 3D Hunting, IFAA 3D Standard, World Archery 3D, NFAS Big Game walk-down, ASA, IBO; points editable in Settings), one game at a time (Total · King of the Castle · Skins) plus the Guess the distance add-on and handicaps. Courses built ahead (with per-peg distances and slope) or picked as you go (category → animal → side, never more than 3 taps). Target photos with the scoring zones coloured; tap where the arrow landed or use the zone buttons. Laser practice builds a sight chart.
- **Game rules pop-up** the first time you pick a game (skippable, "don't show again").
- **Sight marks:** a chart for every bow. List the distances you have targets at, call each arrow High / On / Low (with an extra-arrow button), enter the setting; the app fits a curve and gives a setting every 5 m. Tap any row to edit or delete; save or share the chart as an image card or Excel file.
- **Achievements:** 60 badges for arrows shot, rounds, habits and streaks, scores, personal bests, games and sight marks.
- **Profile:** name, bows, Archery Ireland number, club (dropdown of Irish clubs, or Other), club number, booking link, photo, **club colours** (recolour the whole app; contrast checked against WCAG AA in light and dark). Details are read-only until you tap Edit. Track record and personal bests. Settings live inside the profile.
- **Export to Excel** from the profile, with a Read me sheet so you can ask an AI for coaching advice.
- **Privacy & contact** in the profile: GDPR summary, Contact us, Delete all my data.
- Round summaries and sight charts as shareable images.

## Target library
`targets/targets.json` + `targets/photos/`. Each target has one or more *faces* (sides with rings). Zones are polygons in percent of the photo.
Not all faces are traced yet: use the tracing tool (`tools/trace.html`, also linked from Settings → About), tap around the rings, then copy the JSON into an issue or PR.

Photos are manufacturer product shots (SRT, Eleven, Rinehart, Delta McKenzie) used for identification in a non-commercial club tool; they will be replaced with our own photos of the targets.

## Develop
Static files, no build step. Serve the folder (`python3 -m http.server 8111`) and open `index.html`. Tests: see [tests/README.md](tests/README.md). Before releasing, bump `CACHE` in `sw.js` so installed phones update.

## Roadmap
- Trace remaining faces; add back/other sides for two-sided targets
- Full Archery Ireland club list (archery.ie's list couldn't be read automatically; `src/clubs.js` is easy to extend)
- A contact email instead of GitHub issues
- Bundle the display font so nothing loads from Google Fonts
- Google Play wrapper (TWA) once stable
