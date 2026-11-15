# Design and UI decisions

Why the app looks and behaves the way it does. Each decision records what was asked for, what was chosen, and the reasoning, so anyone picking this up later can change things deliberately rather than by accident. Newest themes are near the top of each section.

## Principles

1. **Club-neutral.** Built for Wicklow Archers but usable by any club. No club name, link or logo is hard-coded. The club name and booking link come from each user's profile.
2. **Nothing leaves the phone.** No accounts, server, analytics or ads. Everything lives in browser storage on the device. This is stated on first run, in About, and in PRIVACY.md, and it's true of the code.
3. **Fit on the smallest common phone.** Every screen is tested at iPhone SE width (320 px) and on a large Android. No horizontal scrolling anywhere; text never wraps mid-word inside a control.
4. **Three taps to the target.** At the peg, picking the animal must never take more than three taps (category → animal → side).
5. **Honest data.** The app never invents values. Arrows scored with buttons are not plotted at made-up positions; untraced targets say so instead of guessing ring locations.
6. **Not hunting-themed.** 3D archery uses animal targets, but the identity is a day out on a course with friends, not hunting.

## Identity and theme

| Decision | Why |
|---|---|
| Name **3D Fun Round** | Neutral, describes the app; the original working name included the club, which conflicted with principle 1. |
| **Blue** brand colour by default; **club colours** chosen per phone | Requested. Blue matches the founding club without using its branding; each archer can switch the whole app to their club's colours (12 presets or custom). Nothing club-specific is hard-coded. |
| Every colour held to **WCAG AA** whatever the club picks | Requested: "make sure whatever colour they choose, there's enough contrast in light and dark mode with all the text." The brand is split into a fill colour (carries white text) and a text colour (sits on cards), each forced to 4.5:1; faded text was made solid. Checked by `tests/contrast.js`. |
| Accent colours = the **four peg colours** (red, blue, white, yellow) | A detail only 3D archery has; used as the hero stripe, peg dots, the live-round card's stripe. |
| Display face **Bricolage Grotesque**, body **Inter** | Chunky and friendly for headings without looking corporate; Inter for legibility outdoors. |
| Original **hand-drawn SVG icons** (bow, arrow, peg, rings, crown, ruler, gear, calendar) | Consistent style, no third-party icon licence, crisp at any size. The first gear looked like a sun and the first arrow looked like a scribble; both were redrawn on feedback. |
| Animal cut-outs as **white silhouettes** in the home hero | Shows what the app is about at a glance without being realistic or gory. |
| **Appearance: System / Light / Dark** in Settings | Requested. System is the default so the app follows the phone; the explicit choice overrides it both ways. |
| Home top card is a **carousel**: welcome always first, then **Your best**, then **Archery Ireland news** | Requested (three dots, swipe). News is read from archery.ie when the site allows it; otherwise the slide links out, so it never shows an error. |
| Home split into **Shoot now** and **Off the line** | Requested headings; "Off the line" is the archery term for everything away from the shooting line. |
| **No cog on the home screen**; Settings live inside the profile | Requested: "Settings should be within the profile picture." One entry point in the top bar. |
| Home title shows **your club** | Requested; makes it feel like the club's app while staying neutral in code. |

## Layout

| Decision | Why |
|---|---|
| **Labels above controls**, never beside | Side-by-side labels squeezed the controls on phones ("80 cm" wrapping to two lines). Feedback: "too squished". Applied app-wide. |
| **Chip grids** instead of joined segmented bars | Each option is a separate, evenly sized tap target; seven distances wrap to a neat 4 + 3 grid. |
| Player rows: name full width; bow / handicap **drops to a second line** on narrow phones | The name is what you read; on the iPhone SE it was being cut to "Cian Mad". |
| Course rows: controls on their **own line** on narrow phones | Four buttons were squeezing animal names into a thin column. |
| Points **legend below** the target picture | It was covering parts of some animals. |
| Bottom bar while scoring: **‹ · Board · Next ›** | "Next target" plus Prev and Skip was too big and clunky. |
| Titles clamp to **2 lines**, subtitles to **1** | Long animal names plus subtitles took four lines of header. |
| Tapping options **keeps the scroll position**; changing screen, end or target **scrolls to top** | Jumping to the top on every tap was a reported bug; but a new end must start with the target face in view. |
| Settings points table: **one zone per row** | Six number columns scrolled sideways. |

## Scoring and games

| Decision | Why |
|---|---|
| Six 3D scoring systems (IFAA hunting/standard, WA 3D, NFAS big game, ASA, IBO), **points editable** in Settings | Clubs score differently; the app is a scoring aid, not an official system. |
| **One game at a time** (Total / King of the Castle / Skins) | Requested; picking all three was confusing. |
| **Guess the distance is an add-on**, and calls **lock before scoring opens** | Requested: it's played on top of any game, and guesses must go in before anyone shoots. |
| **Laser practice** as its own mode with a **sight chart** | Requested; this is where the project started (sight marks per distance). The chart fits a curve to cut (horizontal) distance vs setting and suggests a setting. |
| Slope entered as **% grade** | That's what the archer's rangefinder reports; cut distance = distance × cos(atan(slope/100)). |
| **Shooting order:** drawn on target 1, then Rotate (default) / Honour / Fixed | Rotation within the group is the field-archery convention (NFAA, IFAA); Honour is the golf-style alternative. The draw was confirmed as wanted. |
| Arrows per target **follow the scoring system** | The separate arrows selector was a mistake and was removed on request. |
| Tap the **3D photo** to score once rings are traced; zone **buttons** always available | Rings are being traced over time; buttons keep every target scoreable meanwhile. |
| Indoor/field: **tap the face**, plotted arrows, buttons as fallback | Gives a real group plot for progress; buttons for speed. |
| **Compound inner-10 rule** indoors | World Archery: compound scores 10 only in the X10 ring; recurve gets the full 10 ring. Raised by the archer, verified, applied per archer from their bow. Field and 3D scoring don't vary by bow (only pegs do). |
| **Set play** for indoor/field | The Olympic match format: familiar to target archers and works for two or more. |
| Indoor/field **Competition or Practice**; Practice **requires a goal** | Requested: practice should have a purpose, so the session can't start until the goal is written. It stays on screen while shooting and a "How did it go?" note follows. Named "Competition" (not "Fun round") on request; 3D keeps "Fun round". |
| **Game rules pop-up** when a game is picked, skippable, "don't show again" per game | Requested so newcomers learn the house games (King of the Castle, Skins, Guess the distance, Set play) without slowing regulars down. |
| **60 achievements** from the archer's own saved rounds | Requested examples (100 / 1000 arrows, first indoor, 3 weeks in a row, twice in one week, score-based). Worked out from history rather than stored, so deleting a round can't leave a false badge. Weeks run Monday–Sunday. |

## Courses and targets

| Decision | Why |
|---|---|
| Courses can be **built ahead or picked as you go** | Courses move; the app mustn't assume a fixed layout. |
| **Per-peg distances** (red/blue/white/yellow), all optional | Requested; different classes shoot from different pegs. |
| **Shooting from** peg chosen at setup | One course, any class. |
| **Show distances while shooting** toggle (off by default) | Fun rounds shouldn't be spoiled; forced off with Guess the distance. |
| Built-in courses **editable in place** | The archer couldn't edit Dargle Valley because loading overwrote edits; fixed so edits stick. |
| Target sides ("faces") chosen when an animal has rings on more than one side | Many 3D targets have rings on the shoulder and hip, or front and back (e.g. the bedded fox). |
| Target diagrams = **greyscale product photo** + translucent zones (yellow centre, red inner, blue vital) | Drawn silhouettes lost the limbs needed to aim ("two inches up off the elbow"). Real photos keep every anatomical reference; greyscale keeps it calm and not hyper-realistic. |
| Zone shapes **traced from the moulded lines**, not drawn as circles | The first attempts placed circles by eye and were wrong; the rings must follow the target's own grooves. |
| Tracing is a **desk job**, done in the tracing tool (to become a desktop tool with zoom) | Tracing on a phone with a fingertip was "impossible to use". |

## Sight marks

| Decision | Why |
|---|---|
| **Sight marks** as its own home tile, not inside Field | Requested ("it shouldn't be in field"): any archer sighting any bow, on any range. |
| Name is **sight mark chart** (the strip version is a sight tape) | The standard archery terms; checked before naming the feature. |
| List **distances you have targets at**, shoot N arrows each, call **High / On / Low**, enter the setting | Requested flow. Calls give advice (group high → move the sight up) without needing a target face. **+ Extra arrow** added on request. |
| One chart **per bow**, named freely ("30lb Hoyt"), **grouped by bow type**; tile shows bow name and **date sighted** | Requested: several bows, all compounds together, and the date matters because marks drift. |
| Curve fit with a row **every 5 m**; bold = shot, plain = from the curve | Archers need the in-between distances but must know which ones were actually shot. |
| **Tap any row** to edit/delete; chart **Edit** for name/type/delete | Editing tucked away at the bottom was reported as "won't let me delete or edit". |
| Export as an **image card** and **Excel** (one sheet per bow) | Requested: something to keep on the phone at the range and something to keep long-term. |

## Profile and onboarding

| Decision | Why |
|---|---|
| Profile: name, **bows I shoot (multi-select)**, Archery Ireland number, club, club number, booking link, photo | Requested. Many archers shoot more than one bow. |
| Setup starts with the **bow you shot last** | Sensible default when someone has several bows. |
| **Save profile** button; warn before discarding | Requested for clarity; auto-save felt invisible. |
| Profile reachable from the **avatar** (Settings now live inside it) | Originally avatar + Settings; changed on request so Settings sit inside the profile. |
| Profile details **read-only until Edit details** | Requested: details shown greyed out under the photo, editable only when needed. Booking link only shown while editing. |
| **Club dropdown** of Irish clubs grouped by province, plus **Other** | Requested. archery.ie's own list can't be read automatically, so the list is compiled from public sources and kept in one file (`src/clubs.js`); Other covers anything missing. |
| **First-run welcome** with a privacy note | Requested: prompt new users to fill in details and tell them plainly it stays on the phone. Shown once; skippable. |
| **Booking** tile opens the club link from the profile | Requested; kept generic so each club sets its own. |
| **Privacy & contact** on the profile page, with **Delete all my data** | Requested: privacy, GDPR and contact in one place, with "data stays on this phone" at the bottom. Because nothing is collected, the GDPR rights (access, erasure) are exercised on the phone: Export my data and Delete all my data. The three outside requests (GitHub Pages, Google Fonts, archery.ie) are disclosed. |

## Data export

| Decision | Why |
|---|---|
| **Excel export** from the profile, one row per fact (round, arrow, 3D target) | Requested so the archer can hand their history to an AI for coaching advice. Tidy, filterable tables are what spreadsheets and AIs read best. |
| A **Read me** sheet explaining columns, scoring rules and coordinate conventions, plus a suggested prompt | An AI can't infer "Vital" or what Hit X/Y mean; spelling it out gets far better advice. |
| **Photo excluded**; built on the phone | Keeps the privacy promise; the file only goes where the archer sends it. |
| Library **bundled** (`vendor/xlsx.mini.min.js`, SheetJS, Apache-2.0), loaded only when exporting | Works offline and doesn't slow down app start. |

## Things deliberately not done (yet)

- **Club updates page**: waiting on what the club wants in it.
- **Bundled font**: Google Fonts still serves the lettering; bundling it would remove the last outside request apart from loading the app and the news.
- **Contact email**: Contact us goes to GitHub issues until there's an address to use.
- **Live sync between phones**: one phone per group keeps it offline and private; sync would need a server.
- **Google Play release**: planned as a wrapper around this web app once stable.
- **Hard-coded club data**: never; see principle 1.
