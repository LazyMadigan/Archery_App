# 3D Fun Round

Free, volunteer-built phone app for scoring 3D, indoor and field archery rounds with friends. Club-neutral: any club can use it.
Runs as a web app (install to home screen, works offline). No accounts, no server — everything is stored on the phone.

**Live app:** https://lazymadigan.github.io/wicklow-archers-3d-fun-app/

## Documentation
- [docs/MANUAL.md](docs/MANUAL.md) — how to use the app
- [CHANGELOG.md](CHANGELOG.md) — every revision
- [docs/DECISIONS.md](docs/DECISIONS.md) — UI and design decisions and why
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — code, data and storage
- [docs/TARGETS.md](docs/TARGETS.md) — target identification and ring-tracing status
- [tests/](tests/README.md) — automated phone tests
- [PRIVACY.md](PRIVACY.md) · [FAIR-USE.md](FAIR-USE.md) · [LICENSE](LICENSE)

## Privacy, in one line
Nothing leaves your phone: no accounts, no server, no analytics. See [PRIVACY.md](PRIVACY.md).

## Use it, share it
Free for any club or archer, MIT licensed. See [FAIR-USE.md](FAIR-USE.md). Manual: [docs/MANUAL.md](docs/MANUAL.md).

## Help wanted: trace the rings
Most targets don't have their scoring rings traced yet. Open the app → **Trace scoring rings**, tap around the lines, Save, Copy JSON, and paste it into an issue. A minute each, and it makes the tap-to-score work for everyone.

## What it does
- **Three disciplines:** 3D Course, Indoor (WA 18, Vegas 300, Portsmouth; 18 / 15 / 10 m) and Field (WA 6–1 or IFAA 5-4-3; 10–70 m).
- **Profile** with name, bow, Archery Ireland number, club; personal bests and track record. Compound inner-10 rule applied automatically indoors.
- **Tap-the-face scoring** for indoor and field with arrow group plots; games: Total, King of the Castle, Set play.
- Set up a round: players (up to 6), scoring system, arrows per target (max 3), games to play.
- Scoring systems: IFAA 3D Hunting, IFAA 3D Standard, World Archery 3D, NFAS Big Game (walk-down), ASA, IBO. Points per zone are editable in Settings if your club scores differently.
- Games: Total points · King of the Castle (best arrow takes the target, hold it to stay King) · Skins (ties roll over) · Guess the distance (call it, shoot, lase it) · Handicap (suggested from past rounds, editable).
- Course: build it ahead of time from the target library, save it for reuse, or pick each animal as you reach the peg (category → animal → side, never more than 3 taps).
- Target diagrams: greyscale photo of the actual target with the scoring zones coloured in (yellow centre, red inner, blue vital) and a legend showing the points for the chosen system. Tap where the arrow landed or use the zone buttons.
- Round summary as a shareable image.

## Target library
`targets/targets.json` + `targets/photos/`. Each target has one or more *faces* (sides with rings). Zones are polygons in percent of the photo.
Not all faces are traced yet — use **Trace zones** in the app (`tools/trace.html`), tap around the rings, then copy the JSON into an issue or PR.

Photos are manufacturer product shots (SRT, Eleven, Rinehart, Delta McKenzie) used for identification in a non-commercial club tool; they will be replaced with our own photos of the targets.

## Develop
Static files, no build step. Serve the folder (`python3 -m http.server`) and open `index.html`.

## Roadmap
- Trace remaining faces; add back/other sides for two-sided targets
- Club branding
- Google Play wrapper (TWA) once stable
