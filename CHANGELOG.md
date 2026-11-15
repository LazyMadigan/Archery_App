# Changelog

Every change to 3D Fun Round, newest first. Each entry lists what changed and, where useful, why. The full reasoning behind design choices is in [docs/DECISIONS.md](docs/DECISIONS.md). Commit hashes refer to this repository's history.

Live app: https://lazymadigan.github.io/wicklow-archers-3d-fun-app/

---

## v0.4.x — 15 Nov 2026 (night): practice, sight marks, achievements, club colours, privacy

### Credit line
- "by madigandesigns" in small text at the very bottom of the home screen.

### Docs and interface diagrams
- All documents brought up to date; changelog rebuilt in order. Interface diagrams as PDFs in `docs/diagrams/` (app map, Indoor & Field round, 3D round, Sight marks, Profile & privacy), drawn from screenshots of the live app.
- Fixed a stray "null" under the custom colour pickers in the club colours pop-up.

### Profile: privacy & contact, colours in a pop-up — `2bb92d4`
- **Privacy & contact** card at the bottom of the profile: your data stays on this phone; GDPR (nothing is collected, so you export or delete it yourself); what does go online (GitHub Pages to load the app, Google Fonts for the lettering, archery.ie for news headlines); **Contact us** (GitHub issues) and **About**.
- **Delete all my data** erases everything the app stores on this phone (profile, photo, rounds, courses, sight marks, settings) after two confirmations. Settings → Clear all still removes only rounds and courses.
- "Stays on this phone" moved from the top bar to a line under your details.
- Club colours is a single tile showing your colours; tapping it opens the picker in a pop-up (**Done** keeps, **Cancel** reverts the preview).

### Settings live in your profile — `1441e18`
- The cog is gone from the home screen. Tap your profile picture, then **Settings** (button under your details, or the cog in the top bar). Back from Settings returns to your profile. The profile card at the top of Settings was removed.

### Profile: booking link hidden in the read-only view — `458559e`
- The booking link only shows under **Edit details**; the Booking tile still uses it.

### Indoor & Field: "Competition" — `2c16de8`
- In Indoor and Field setup, *Fun round* is now called **Competition**. (3D still says Fun round.)

### Sight marks: easy editing, grouped by bow type, extra arrow — `568d5ac`
- Charts are grouped by bow type (all compounds together). Each tile shows the bow name and the date you sighted it in.
- Tap any row of a chart to change that setting, delete the mark, or save a curve value as a real mark. Marks also have clear **Edit** / **Delete** buttons.
- **Edit** in the chart's top bar renames the bow, changes its type or note, or deletes the chart.
- **+ Extra arrow** while sighting adds another arrow at that distance. Once every arrow is called, more taps ask you to add an arrow or reset instead of silently starting over.

### Club picker — `568d5ac`
- Profile → Club is a dropdown of Irish archery clubs grouped by province, with **Other** to type any club not listed. The list (`src/clubs.js`, about 40 clubs) was compiled from public sources and is easy to extend; archery.ie's own list couldn't be read automatically.

### Readable text whatever the club colours — `568d5ac`
- The brand colour is split into a fill colour (carries white text) and a text colour (sits on cards), each held to WCAG AA 4.5:1 in light and dark mode. Faded captions, hero text, red Delete links, the blue 5/6 score buttons and the target-face ring numbers were fixed too, including on the default blue.
- New audit `tests/contrast.js` measures every visible piece of text on the main screens for 37 colour choices.

### Club colours recolour the whole app — `d94ca57`
- Profile → Edit details → **Club colours**: 12 ready-made pairs, your own main and second colour, or the app default. The app previews it live; **Save profile** keeps it.
- Buttons, top bar, cards, home slides, the phone's status bar colour and share images all follow it. A white or yellow main colour swaps with the second; a black or navy main lets the second colour lead in dark mode.

### Home: swipeable top card; profile details read-only — `bc52160`
- The top card is a carousel with three dots: **Shoot well** first, then **Your best** (top personal bests, best 3D round, latest achievement; tap for Progress), then **Archery Ireland news** (headlines from archery.ie when the site allows it, otherwise a button that opens it).
- Profile details show greyed out under your photo; **Edit details** unlocks them, **Save profile** or **Cancel** locks them again. A new profile still opens straight into the form.

### Sight marks, Achievements, game rules, home sections — `d320986`
- **Sight marks** (home tile): name the bow (e.g. "30lb Hoyt"), tick the distances you have targets at, call each arrow High / On / Low, enter the setting. Builds a sight mark chart with a fitted curve and a setting every 5 m; save or share it as an image card or Excel file; **Export all charts** makes one workbook with a sheet per bow.
- **Achievements**: 60 badges (arrows, rounds, firsts, habits and streaks, variety, indoor & field scores, personal bests, 3D scores, games, sight marks) with progress bars; a pop-up announces new ones when a round is saved.
- **Game rules pop-up** when picking King of the Castle, Skins, Guess the distance or Set play: **Skip**, **Got it**, **Don't show this again**.
- Home: the disciplines sit under **Shoot now**, everything else under **Off the line**. Pop-up messages no longer block taps underneath them.

### Home: Indoor tile on one line — `9970768`
- Indoor subtitle shortened to "WA 18, Vegas · 10–18 m" so the three discipline tiles are the same height. Portsmouth is still in the round list.

### Indoor & Field: Practice with a goal — `a78dfbb`
- **What are we doing**: Competition or **Practice**. Practice won't start until you write a goal for the session; the goal stays on screen while you shoot and on the scoreboard, and is saved with the round. The summary adds a **How did it go?** note. History shows practice rounds and their goal.

## v0.3.x — 15 Nov 2026 (evening): disciplines, profile, polish

### Export to Excel — `90685b6`
- Profile → **Export my data**: one .xlsx with sheets *Read me* (explains every column and the scoring rules, with a suggested AI prompt), *Profile*, *Rounds*, *Arrows*, *3D targets*, *Courses*, *Sight marks*. **Share…** on phones that support it. Built on the device with SheetJS (bundled in `vendor/`, works offline). Photo excluded.

### Next end / next target returns to the target face — `0773579`
- On small phones, moving to the next end, target or 3D target now scrolls back to the top so the face is in view. (Setup screens still keep your place when you tap an option.)

### Settings: profile card, Appearance, Save button — `f7cedef`
- Settings opens with a **profile card** (photo, name, club) that leads to the profile.
- **Appearance:** System / Light / Dark. System follows the phone; the choice is remembered.
- Profile edits are now a draft: **Save profile** commits them and confirms "Profile saved". Backing out with unsaved changes asks "Discard your unsaved changes?".
- Settings' points table relabelled "3D points per zone".

### Roomier layout app-wide — `6d2ae63`
- Labels sit **above** their controls instead of beside them.
- Option rows (distance, face, arrows, shooting order, peg) became **chip grids**; chip text never wraps mid-word ("80 cm" stays on one line).
- Player rows give the name the room; on narrow phones the bow / handicap drops to a second line.
- Course-builder rows: name gets the full width; ↑ ↓ ✕ controls on their own line on narrow phones.
- Headings with icons no longer stretch the icon to half the row.
- Long titles clamp to two lines, subtitles to one.
- 3D zone buttons, bottom bars and the Settings buttons tightened for the iPhone SE width.

### First-run welcome — `b4a7580`
- First open shows a **Welcome** card asking the archer to set up their profile, with a plain statement that details are stored only on the phone and the developer can't see them. *Skip for now* is always available; it shows once.

### Club title and Booking — `be69051`
- The home-screen title shows the **club from your profile** (falls back to "3D Fun Round").
- New **Booking** tile opens the club booking link saved in your profile (e.g. a Google Form). If no link is set, the tile takes you to that field. Not hard-coded, so any club can use it.

### Multiple bows — `f5fb92e`
- Profile lets you **tick every bow you shoot** (2×2 grid). Setup starts with the bow you shot last.

### Profile, Indoor and Field — `a1c46a0`
- **Profile:** name, bow, Archery Ireland number, club, club number, optional photo. Name fills Player 1 on every round. Track record and **personal bests** per round, distance, face and bow.
- Home restructured into **3D Course / Indoor / Field**.
- **Indoor:** WA 18, Half WA 18, Vegas 300 (3-spot), Portsmouth, Custom. Distance 18 / 15 / 10 m; face 40 / 60 / 80 cm or 3-spot; ends and arrows adjustable.
- **Field:** WA Field (6–1) or IFAA Field (5-4-3); 10–70 m in tens; 20 / 40 / 60 / 80 cm faces; counted in targets.
- **Tap-the-face scoring** with arrow plots; score buttons as an alternative. Only tapped arrows are plotted (no invented positions).
- **Compound inner-10 rule** indoors (WA): compound scores 10 only in the X10 ring; the rest of the 10 ring counts 9. Applied per archer from their bow.
- Games for indoor/field: **Total**, **King of the Castle** (per end), **Set play** (2 points per end won, 1 each for a tie, first to 6 head to head).
- Progress shows indoor/field trends per round type with your group over the last five rounds.

---

## v0.2.x — 15 Nov 2026 (afternoon): courses, pegs, real targets

### Peg distances editable everywhere — `fef4a02`
- Tap any animal in the course builder to open its peg distances (previously only a small button did).
- Built-in courses can be edited in place; edits survive reloads (before, the built-in data overwrote edits on every load).

### Per-peg distances — `a11c5cd`
- Course builder: each target can hold distance and slope for **Red, Blue, White and Yellow** pegs (all optional).
- Round setup: **Shooting from** chooses the peg; every target gets that peg's distance and slope.
- Dargle Valley stored as red-peg data and renamed "Dargle Valley · 15 Nov 2026".

### Courses screen and legend — `4173f63`
- Courses tab: **Build new course** at the top, then saved courses with **Shoot / Edit / ✕**.
- The points legend moved **below** the target picture so it never covers the animal.

### Play bar — `2c6e145`
- Bottom bar while scoring: ‹ (previous), **Board**, **Next ›** ("Skip" until everyone has scored). Replaced the bulky "‹ Prev / Next target ›".

### One game at a time — `f489a7b`
- Setup: Total points, King of the Castle and Skins are mutually exclusive. Guess the distance stays an add-on.
- Arrows-per-target selector removed; the arrow count follows the chosen scoring system.

### Scroll position, distance toggle — `56d89f1`
- Tapping options no longer jumps the page to the top.
- **Show distances while shooting** toggle for courses with saved distances (forced off with Guess the distance, always on in Laser practice).

### Target identification — `89b4ad2`, `b5ae422`, `1c7e363`
- Identified target 14 (SRT Raven, feeding pair), 20 (Leitold small climbing brown bear) and 22 (SRT Blackcock) from the archer's research; photos added.
- Polar bear cut-out fixed (a white bear on a white background had lost part of its rump).

### Built-in course — `a60e56c`
- **Dargle Valley, 15 Nov 2026**: 24 targets in walking order with animal, side, distance and slope from the red pegs.

---

## v0.1.x — 15 Nov 2026 (early afternoon): the app takes shape

### In-progress card and Start button — `2ab8eaa`
- Home's round-in-progress card redesigned (rings badge, live dot, players, progress bar, peg-colour stripe).
- Arrow icon redrawn. Start button now enables as soon as a name is typed.

### Summary actions and fit check — `bc2fda2`
- Round summary: See my progress, Home, Delete.
- Every screen checked for horizontal overflow on two phone sizes.

### Shooting order, round management, points buttons — `ce9bd79`
- **Who shoots first?** drawn on target 1; then **Rotate** (field-archery convention), **Honour** (best last score first) or **Fixed**.
- Round in progress: **Continue / Scoreboard / Stop & save / Delete**.
- Zone buttons became solid zone-coloured tiles with the points large.

### Settings polish — `aa5da0a`, `5f4427d`
- Points table laid out one zone per row (it scrolled sideways before).
- Proper gear icon (the earlier one looked like a sun).

### Guess the distance and Laser practice — `783ded1`
- Guess the distance became an **add-on** to any game: calls are locked in before scoring opens; the lased distance goes in after.
- **Laser practice** mode: lase, enter slope and each archer's sight setting, shoot. Builds a **sight chart** (fitted curve + 5 m lookup) in Progress and suggests a setting once there are enough points.

### Redesign — `29ea2da`
- Proper visual identity: blue hero with the four peg colours, display typeface, hand-drawn SVG icons, game cards, animal silhouettes.
- **Progress** screen (trend per archer). About / privacy / fair-use pages and the user manual.

### Club-neutral, blue — `97d12e3`
- Renamed **3D Fun Round** (no club name in the app) and blue theme, so any club can use it.

### First working version — `0f7a217`
- Round setup, course builder, 3-tap target picker, six scoring systems, King of the Castle, Skins, Guess the distance, handicap, round summary image, offline PWA, zone tracing tool, 23-target library with the fox's rings traced.

---

## Before the app (same day): the sight-mark log and course guide
The project started as a sight-mark log (20 m → 10, 40 m → 25, 50 m → 36, …) and a 24-target course record for Dargle Valley from the red pegs, which became a one-page course guide. That guide was replaced by this app because courses change and the club wanted scoring and games rather than a static page.
