// Achievements: 60 badges earned from the profile owner's finished rounds. Pure logic, no DOM.
// evaluate(history, me, sysOf) -> [{ id, g, ic, t, d, done, date, have, need }] in display order.
import { SCHEMES, valueOf, tally, roundKey } from './faces.js';
import { scoreTarget } from './scoring.js';

export const GROUPS = [
  ['arrows', 'Arrows shot'], ['rounds', 'Rounds'], ['firsts', 'Firsts'], ['habits', 'Habits'], ['variety', 'Variety'],
  ['target', 'Indoor & field scores'], ['pb', 'Personal bests'], ['3d', '3D scores'], ['games', 'Games'], ['sight', 'Sight marks'],
];

const DAY = 86400000;
const dayOf = t => { const d = new Date(t); return Math.floor((t - d.getTimezoneOffset() * 60000) / DAY); };
const weekOf = day => Math.floor((day + 3) / 7); // Monday-start weeks (day 0 = Thu 1 Jan 1970)
const isT = r => r.kind === 'indoor' || r.kind === 'field';

const cnt = (key, need) => ({ ok: a => a[key] >= need, prog: a => [Math.min(a[key], need), need] });
const flag = key => ({ ok: a => !!a[key] });
const atLeast = (key, need) => ({ ok: a => a[key] >= need });

// [id, group, icon, title, description, rule]
const DEFS = [
  ['a100', 'arrows', 'arrow', 'Century', 'Shoot 100 arrows', cnt('arrows', 100)],
  ['a250', 'arrows', 'arrow', 'Warming up', 'Shoot 250 arrows', cnt('arrows', 250)],
  ['a500', 'arrows', 'arrow', 'Quiver emptier', 'Shoot 500 arrows', cnt('arrows', 500)],
  ['a1000', 'arrows', 'arrow', 'The thousand', 'Shoot 1,000 arrows', cnt('arrows', 1000)],
  ['a2500', 'arrows', 'arrow', 'Callused fingers', 'Shoot 2,500 arrows', cnt('arrows', 2500)],
  ['a5000', 'arrows', 'arrow', 'Five grand', 'Shoot 5,000 arrows', cnt('arrows', 5000)],
  ['a10000', 'arrows', 'arrow', 'Ten thousand', 'Shoot 10,000 arrows', cnt('arrows', 10000)],

  ['r1', 'rounds', 'history', 'Off the mark', 'Finish your first round', cnt('rounds', 1)],
  ['r10', 'rounds', 'history', 'Regular', 'Finish 10 rounds', cnt('rounds', 10)],
  ['r25', 'rounds', 'history', 'Club stalwart', 'Finish 25 rounds', cnt('rounds', 25)],
  ['r50', 'rounds', 'history', 'Half century', 'Finish 50 rounds', cnt('rounds', 50)],
  ['r100', 'rounds', 'history', 'Centurion', 'Finish 100 rounds', cnt('rounds', 100)],

  ['f3d', 'firsts', 'bow', 'Into the woods', 'Finish your first 3D round', flag('k3d')],
  ['findoor', 'firsts', 'rings', 'Indoor season', 'Finish your first indoor round', flag('kindoor')],
  ['ffield', 'firsts', 'peg', 'Afield', 'Finish your first field round', flag('kfield')],
  ['flaser', 'firsts', 'ruler', 'Dialled in', 'Finish a 3D laser practice', flag('laser')],
  ['fgoal', 'firsts', 'target', 'With purpose', 'Finish an indoor or field practice with a goal', flag('goal')],
  ['fmates', 'firsts', 'people', 'Better with mates', 'Finish a round with at least one other archer', flag('mates')],

  ['w2', 'habits', 'calendar', 'Twice a week', 'Shoot on 2 different days in one week', cnt('maxDaysWeek', 2)],
  ['w3', 'habits', 'calendar', 'Three a week', 'Shoot on 3 different days in one week', cnt('maxDaysWeek', 3)],
  ['s3', 'habits', 'trend', 'Three-week streak', 'Shoot every week for 3 weeks in a row', cnt('bestRun', 3)],
  ['s6', 'habits', 'trend', 'Six-week streak', 'Shoot every week for 6 weeks in a row', cnt('bestRun', 6)],
  ['s12', 'habits', 'trend', 'Twelve-week streak', 'Shoot every week for 12 weeks in a row', cnt('bestRun', 12)],
  ['s26', 'habits', 'trend', 'Half a year', 'Shoot every week for 26 weeks in a row', cnt('bestRun', 26)],
  ['b2b', 'habits', 'calendar', 'Back to back', 'Shoot on two days in a row', flag('b2b')],
  ['double', 'habits', 'calendar', 'Double session', 'Finish two rounds on the same day', flag('double')],
  ['weekend', 'habits', 'calendar', 'Weekend warrior', 'Shoot on a Saturday and the Sunday after it', flag('weekend')],
  ['early', 'habits', 'calendar', 'Early bird', 'Start a round before 8 am', flag('early')],
  ['owl', 'habits', 'calendar', 'Night owl', 'Start a round after 9 pm', flag('owl')],

  ['allthree', 'variety', 'course', 'All-rounder', 'Finish a 3D, an indoor and a field round', cnt('kinds', 3)],
  ['courses5', 'variety', 'course', 'Course collector', 'Shoot 5 different 3D courses', cnt('courses', 5)],

  ['x1', 'target', 'rings', 'First X', 'Shoot an X', flag('xAny')],
  ['x10', 'target', 'rings', 'X marks the spot', 'Shoot 10 Xs in one round', cnt('maxXs', 10)],
  ['perfect', 'target', 'rings', 'Perfect end', 'Every arrow in an end scores top marks', flag('perfect')],
  ['perfect3', 'target', 'rings', 'Hat-trick of perfects', 'Shoot 3 perfect ends in one round', cnt('maxPerfect', 3)],
  ['clean', 'target', 'rings', 'Clean sheet', 'Finish an indoor or field round of 30+ arrows without a miss', flag('clean')],
  ['wa450', 'target', 'rings', 'WA 18: 450', 'Score 450+ in a full WA 18', atLeast('wa18', 450)],
  ['wa500', 'target', 'rings', 'WA 18: 500', 'Score 500+ in a full WA 18', atLeast('wa18', 500)],
  ['wa550', 'target', 'rings', 'WA 18: 550', 'Score 550+ in a full WA 18', atLeast('wa18', 550)],
  ['wa570', 'target', 'rings', 'WA 18: 570', 'Score 570+ in a full WA 18', atLeast('wa18', 570)],
  ['vg250', 'target', 'rings', 'Vegas 250', 'Score 250+ in a full Vegas 300', atLeast('vegas', 250)],
  ['vg280', 'target', 'rings', 'Vegas 280', 'Score 280+ in a full Vegas 300', atLeast('vegas', 280)],
  ['p80', 'target', 'rings', 'Eight out of ten', 'Score 80% of the maximum in an indoor or field round (30+ arrows)', atLeast('pctT', 80)],
  ['p90', 'target', 'rings', 'Nine out of ten', 'Score 90% of the maximum in an indoor or field round (30+ arrows)', atLeast('pctT', 90)],
  ['fld75', 'target', 'peg', 'Field marksman', 'Score 75% of the maximum in a complete field round', atLeast('pctField', 75)],

  ['pb1', 'pb', 'trend', 'New PB', 'Beat your best score on an indoor or field round', cnt('pbBeats', 1)],
  ['pb3', 'pb', 'trend', 'On the up', 'Set a new personal best 3 times', cnt('pbBeats', 3)],
  ['pb20', 'pb', 'trend', 'Big leap', 'Beat a personal best by 20 points or more', flag('pbBig')],

  ['c1', '3d', 'target', 'Bullseye beast', 'Hit the centre spot on a 3D target', flag('centreAny')],
  ['c5', '3d', 'target', 'Spot on', 'Hit 5 centres in one 3D round', cnt('maxCentres', 5)],
  ['c10', '3d', 'target', 'Sniper', 'Hit 10 centres in one 3D round', cnt('maxCentres', 10)],
  ['clean3d', '3d', 'bow', 'No lost arrows', 'Score on every target of a 3D round (10+ targets)', flag('clean3d')],
  ['p3d60', '3d', 'bow', 'Good hunting', 'Score 60% of the maximum in a 3D round (10+ targets)', atLeast('pct3d', 60)],
  ['p3d75', '3d', 'bow', 'Apex predator', 'Score 75% of the maximum in a 3D round (10+ targets)', atLeast('pct3d', 75)],

  ['king', 'games', 'crown', 'King of the Castle', 'Hold the crown at the end of a round', cnt('kingWins', 1)],
  ['skins', 'games', 'skin', 'Skin collector', 'Win the most skins in a round', cnt('skinWins', 1)],
  ['sets', 'games', 'trophy', 'Match winner', 'Win a Set play match', cnt('setWins', 1)],
  ['wins3', 'games', 'trophy', 'Serial winner', 'Win 3 games of any kind', cnt('gameWins', 3)],
  ['eyes', 'games', 'ruler', 'Rangefinder eyes', 'Average within 2 m over 10+ Guess the distance calls', flag('eyes')],

  ['sight10', 'sight', 'ruler', 'Sight chart started', 'Record 10 sight marks in laser practice', cnt('sightMarks', 10)],
];

function max3d(sys, arrows) {
  if (!sys) return 0;
  const best = row => Math.max(...Object.values(row));
  if (sys.walkdown) return best(sys.table[0]);
  return sys.table.slice(0, Math.max(1, Math.min(arrows || sys.arrows, sys.table.length))).reduce((n, row) => n + best(row), 0);
}

export function evaluate(history, me, sysOf, chartMarks = []) {
  const a = { arrows: 0, rounds: 0, kinds: 0, courses: 0, maxDaysWeek: 0, bestRun: 0, maxXs: 0, maxPerfect: 0, wa18: 0, vegas: 0, pctT: 0, pctField: 0, pbBeats: 0, maxCentres: 0, pct3d: 0, kingWins: 0, skinWins: 0, setWins: 0, gameWins: 0, sightMarks: 0 };
  const kinds = new Set(), courses = new Set(), days = new Map(), weeks = new Map(), best = {};
  let gCalls = 0, gErr = 0;
  const earned = {};
  const rounds = (history || []).filter(r => r.final && r.players?.some(p => p.name === me)).slice().sort((x, y) => x.started - y.started);

  rounds.forEach(r => {
    const p = r.players.find(x => x.name === me); const pid = p.id; const multi = r.players.length > 1;
    a.rounds++;
    const k = isT(r) ? r.kind : '3d'; kinds.add(k); a.kinds = kinds.size; a['k' + k] = true;
    if (multi) a.mates = true;
    // time habits
    const day = dayOf(r.started), wk = weekOf(day), hr = new Date(r.started).getHours();
    if (hr < 8) a.early = true; if (hr >= 21) a.owl = true;
    days.set(day, (days.get(day) || 0) + 1); if (days.get(day) >= 2) a.double = true;
    if (days.has(day - 1) || days.has(day + 1)) a.b2b = true;
    const dow = new Date(r.started).getDay();
    if ((dow === 0 && days.has(day - 1)) || (dow === 6 && days.has(day + 1))) a.weekend = true;
    if (!weeks.has(wk)) weeks.set(wk, new Set()); weeks.get(wk).add(day);
    a.maxDaysWeek = Math.max(a.maxDaysWeek, weeks.get(wk).size);
    let run = 0; while (weeks.has(wk - run)) run++; a.bestRun = Math.max(a.bestRun, run);

    if (isT(r)) {
      const t = tally(r)[pid] || { total: 0, xs: 0, arrows: 0 }; a.arrows += t.arrows;
      if (r.mode === 'practice' && r.goal) a.goal = true;
      const ends = r.scores[pid] || []; const max = SCHEMES[r.scheme].max; const full = r.ends * r.arrows;
      const xs = ends.flat().filter(s => s?.v === 'X').length; if (xs) a.xAny = true; a.maxXs = Math.max(a.maxXs, xs);
      const perfect = ends.filter(e => e?.length >= r.arrows && e.every(s => s && valueOf(r.scheme, s.v) === max)).length;
      if (perfect) a.perfect = true; a.maxPerfect = Math.max(a.maxPerfect, perfect);
      const complete = t.arrows >= full;
      if (complete && t.arrows >= 30 && !ends.flat().some(s => s?.v === 'M')) a.clean = true;
      if (complete && r.roundKey === 'wa18' && r.ends === 20 && r.arrows === 3) a.wa18 = Math.max(a.wa18, t.total);
      if (complete && r.roundKey === 'vegas' && r.ends === 10 && r.arrows === 3) a.vegas = Math.max(a.vegas, t.total);
      const pct = full ? t.total / (full * max) * 100 : 0;
      if (complete && t.arrows >= 30) a.pctT = Math.max(a.pctT, pct);
      if (complete && r.kind === 'field') a.pctField = Math.max(a.pctField, pct);
      if (complete) { const key = roundKey(r) + '|' + (p.bow || 'recurve'); if (best[key] != null && t.total > best[key]) { a.pbBeats++; if (t.total - best[key] >= 20) a.pbBig = true; } best[key] = Math.max(best[key] ?? -1, t.total); }
      if (multi && r.final.sets?.winner === pid) { a.setWins++; a.gameWins++; }
      if (multi && r.final.king?.king === pid) { a.kingWins++; a.gameWins++; }
      if (multi && r.final.fun && r.final.fun.key !== 'king' && r.final.fun.winner === pid) a.gameWins++;
    } else {
      const sys = sysOf(r.systemKey); const mine = Object.values(r.scores || {}).map(by => by[pid]).filter(x => x && x.some(Boolean));
      a.arrows += mine.reduce((n, arr) => n + arr.filter(Boolean).length, 0);
      if (r.mode === 'laser') a.laser = true;
      if (r.courseName) { courses.add(r.courseName.trim().toLowerCase()); a.courses = courses.size; }
      const centres = mine.reduce((n, arr) => n + arr.filter(z => z === 'centre').length, 0); if (centres) a.centreAny = true; a.maxCentres = Math.max(a.maxCentres, centres);
      if (sys && mine.length >= 10) {
        if (mine.every(arr => scoreTarget(sys, arr) > 0)) a.clean3d = true;
        const m = max3d(sys, r.arrows) * mine.length; const gross = mine.reduce((n, arr) => n + scoreTarget(sys, arr), 0);
        if (m) a.pct3d = Math.max(a.pct3d, gross / m * 100);
      }
      (r.targets || []).forEach(t => { if (t.distanceActual != null && t.sight?.[pid] != null) a.sightMarks++; });
      if (multi && r.final.king?.king === pid) { a.kingWins++; a.gameWins++; }
      if (multi && r.final.fun && r.final.fun.key !== 'king' && r.final.fun.winner === pid) a.gameWins++;
      const won = r.final.skins?.won; if (multi && won) { const mx = Math.max(...Object.values(won)); if (mx > 0 && won[pid] === mx && Object.values(won).filter(v => v === mx).length === 1) { a.skinWins++; a.gameWins++; } }
      const g = r.final.guess?.[pid]; if (g?.calls) { gCalls += g.calls; gErr += g.absErr; if (gCalls >= 10 && gErr / gCalls <= 2) a.eyes = true; }
    }
    DEFS.forEach(([id, , , , , rule]) => { if (!earned[id] && rule.ok(a)) earned[id] = r.final.ended || r.started; });
  });

  // sight marks recorded in Sight marks charts (timestamps) count alongside laser practice
  if (chartMarks.length) { const ts = [...chartMarks].sort((x, y) => x - y); ts.forEach(t => { a.sightMarks++; DEFS.forEach(([id, , , , , rule]) => { if (!earned[id] && rule.ok(a)) earned[id] = t; }); }); }
  return DEFS.map(([id, g, ic, t, d, rule]) => { const pr = rule.prog ? rule.prog(a) : null; return { id, g, ic, t, d, done: !!earned[id], date: earned[id] || null, have: pr?.[0], need: pr?.[1] }; });
}
export const TOTAL = DEFS.length;
