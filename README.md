# 3D Fun Round

Free, volunteer-built phone app for scoring 3D field archery rounds with friends. Club-neutral: any club can use it.
Runs as a web app (install to home screen, works offline). No accounts, no server — everything is stored on the phone.

**Live app:** https://lazymadigan.github.io/wicklow-archers-3d-fun-app/

## What it does
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
