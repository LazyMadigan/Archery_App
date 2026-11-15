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
| **Blue** brand colour | Requested; matches the club's colours without using its branding. |
| Accent colours = the **four peg colours** (red, blue, white, yellow) | A detail only 3D archery has; used as the hero stripe, peg dots, the live-round card's stripe. |
| Display face **Bricolage Grotesque**, body **Inter** | Chunky and friendly for headings without looking corporate; Inter for legibility outdoors. |
| Original **hand-drawn SVG icons** (bow, arrow, peg, rings, crown, ruler, gear, calendar) | Consistent style, no third-party icon licence, crisp at any size. The first gear looked like a sun and the first arrow looked like a scribble; both were redrawn on feedback. |
| Animal cut-outs as **white silhouettes** in the home hero | Shows what the app is about at a glance without being realistic or gory. |
| **Appearance: System / Light / Dark** in Settings | Requested. System is the default so the app follows the phone; the explicit choice overrides it both ways. |
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

## Profile and onboarding

| Decision | Why |
|---|---|
| Profile: name, **bows I shoot (multi-select)**, Archery Ireland number, club, club number, booking link, photo | Requested. Many archers shoot more than one bow. |
| Setup starts with the **bow you shot last** | Sensible default when someone has several bows. |
| **Save profile** button; warn before discarding | Requested for clarity; auto-save felt invisible. |
| Profile reachable from the **avatar** and from **Settings** | Requested; both are where people look. |
| **First-run welcome** with a privacy note | Requested: prompt new users to fill in details and tell them plainly it stays on the phone. Shown once; skippable. |
| **Booking** tile opens the club link from the profile | Requested; kept generic so each club sets its own. |

## Things deliberately not done (yet)

- **Club updates page**: waiting on what the club wants in it.
- **Live sync between phones**: one phone per group keeps it offline and private; sync would need a server.
- **Google Play release**: planned as a wrapper around this web app once stable.
- **Hard-coded club data**: never; see principle 1.
