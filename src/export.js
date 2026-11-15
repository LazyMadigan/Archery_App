// Export everything on this phone to an Excel workbook, laid out so a person or an AI can analyse it.
// Built entirely on the device; nothing is uploaded. The photo is never included.
import { SYSTEMS, scoreTarget, ZONE_LABEL } from './scoring.js';
import { SCHEMES, FACES, valueOf, bowName, schemeFor, endTotal } from './faces.js';

function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'vendor/xlsx.mini.min.js'; s.onload = () => ok(window.XLSX); s.onerror = () => fail(new Error('Could not load the spreadsheet library')); document.head.append(s); });
}
const d = ts => ts ? new Date(ts).toISOString().slice(0, 10) : '';
const t = ts => ts ? new Date(ts).toTimeString().slice(0, 5) : '';
const kindOf = r => r.kind === 'indoor' ? 'Indoor' : r.kind === 'field' ? 'Field' : '3D';
const cut = (dist, slope) => dist == null ? '' : Math.round(dist * Math.cos(Math.atan((slope || 0) / 100)) * 10) / 10;

export async function buildWorkbook(state, LIB) {
  const XLSX = await loadXLSX();
  const lib = id => LIB.targets.find(x => x.id === id);
  const faceLabel = (T, fid) => (T?.faces.find(f => f.id === fid) || T?.faces[0])?.label || '';
  const P = state.profile || {}; const me = (P.name || '').trim();
  const rounds = [...state.history].sort((a, b) => a.started - b.started);
  const rid = r => `R${String(rounds.indexOf(r) + 1).padStart(3, '0')}`;

  // ---- Profile
  const profile = [['Field', 'Value'], ['Name', P.name || ''], ['Bows I shoot', (P.bows || (P.bow ? [P.bow] : [])).map(bowName).join(', ')], ['Last bow used', P.lastBow ? bowName(P.lastBow) : ''],
    ['Archery Ireland number', P.ai || ''], ['Club', P.club || ''], ['Club number', P.clubNo || ''], ['Exported', new Date().toISOString().slice(0, 16).replace('T', ' ')], ['App', '3D Fun Round']];

  // ---- Rounds: one row per archer per round
  const rRows = [['Round ID', 'Date', 'Time', 'Discipline', 'Mode', 'Round', 'Scoring', 'Distance (m)', 'Face', 'Peg', 'Targets / ends', 'Arrows per target/end', 'Archer', 'Is me', 'Bow', 'Score', 'Max possible', '% of max', 'Avg per arrow', 'X count', 'Top-ring count', 'Arrows shot', 'Game', 'Game result', 'Handicap', 'Net score', 'Place in group', 'Group size', 'Practice goal', 'Practice notes']];
  rounds.forEach(r => {
    if (r.kind) { // indoor / field
      const tal = r.final?.tally || {}; const max = r.ends * r.arrows * SCHEMES[r.scheme].max; const game = r.games?.sets ? 'Set play' : r.games?.king ? 'King of the Castle' : 'Total points';
      const order = [...r.players].sort((a, b) => (tal[b.id]?.total || 0) - (tal[a.id]?.total || 0));
      r.players.forEach(p => { const x = tal[p.id] || {}; const res = r.games?.sets ? `${r.final?.sets?.pts?.[p.id] ?? 0} set points${r.final?.sets?.winner === p.id ? ' (winner)' : ''}` : r.games?.king ? `${r.final?.king?.won?.[p.id] ?? 0} ends won${r.final?.king?.king === p.id ? ' (King)' : ''}` : '';
        rRows.push([rid(r), d(r.started), t(r.started), kindOf(r), r.mode === 'practice' ? 'Practice' : 'Scored round', r.name, SCHEMES[schemeFor(r.scheme, p.bow)].name, r.dist, FACES[r.face], '', r.ends, r.arrows, p.name, p.name === me ? 'Yes' : '', bowName(p.bow), x.total ?? '', max, max ? Math.round((x.total || 0) / max * 1000) / 10 : '', x.avg ? Math.round(x.avg * 100) / 100 : '', x.xs ?? '', x.tens ?? '', x.arrows ?? '', game, res, '', '', order.indexOf(p) + 1, r.players.length, r.goal || '', r.review || '']); });
    } else { // 3D
      const sys = SYSTEMS[r.systemKey]; const tot = r.final?.totals || {}; const n = r.targets?.length || Object.keys(r.scores || {}).length;
      const max = n * Math.max(...sys.table.map(row => row.centre)); const game = r.games?.skins ? 'Skins' : r.games?.king ? 'King of the Castle' : 'Total points';
      const order = [...r.players].sort((a, b) => (tot[b.id]?.gross || 0) - (tot[a.id]?.gross || 0));
      r.players.forEach(p => { const x = tot[p.id] || {}; const arrows = Object.values(r.scores || {}).reduce((a, by) => a + (by[p.id] || []).filter(Boolean).length, 0);
        const res = [r.games?.king ? `${r.final?.king?.holesWon?.[p.id] ?? 0} targets won${r.final?.king?.king === p.id ? ' (King)' : ''}` : '', r.games?.skins ? `${r.final?.skins?.won?.[p.id] ?? 0} skins` : '', r.games?.guess ? `distance guessing ${r.final?.guess?.[p.id]?.pts ?? 0} pts` : ''].filter(Boolean).join('; ');
        rRows.push([rid(r), d(r.started), t(r.started), '3D', r.mode === 'laser' ? 'Laser practice' : 'Fun round', r.courseName || '3D round', sys.name, '', '', r.peg || '', n, r.arrows, p.name, p.name === me ? 'Yes' : '', '', x.gross ?? '', max, max ? Math.round((x.gross || 0) / max * 1000) / 10 : '', arrows ? Math.round((x.gross || 0) / arrows * 100) / 100 : '', '', '', arrows, game + (r.games?.guess ? ' + Guess the distance' : ''), res, p.handicap || '', r.useHandicap ? x.net : '', order.indexOf(p) + 1, r.players.length]); });
    }
  });

  // ---- Arrows (indoor/field): every arrow, with position when tapped
  const aRows = [['Round ID', 'Date', 'Discipline', 'Round', 'Distance (m)', 'Face', 'Archer', 'Is me', 'Bow', 'End', 'Arrow', 'Score', 'Points', 'End total', 'Hit X (−1 left … +1 right)', 'Hit Y (−1 top … +1 bottom)', 'Distance from centre (0 centre … 1 edge)', 'Position recorded']];
  rounds.filter(r => r.kind).forEach(r => r.players.forEach(p => (r.scores[p.id] || []).forEach((end, ei) => (end || []).forEach((s, ai) => { if (!s) return;
    aRows.push([rid(r), d(r.started), kindOf(r), r.name, r.dist, FACES[r.face], p.name, p.name === me ? 'Yes' : '', bowName(p.bow), ei + 1, ai + 1, String(s.v), valueOf(r.scheme, s.v), endTotal(r.scheme, end),
      s.x != null ? Math.round(s.x * 1000) / 1000 : '', s.y != null ? Math.round(s.y * 1000) / 1000 : '', s.x != null ? Math.round(Math.hypot(s.x, s.y) * 1000) / 1000 : '', s.x != null ? 'Tapped on face' : 'Score button']); }))));

  // ---- 3D targets: every target per archer
  const tRows = [['Round ID', 'Date', 'Mode', 'Course', 'Scoring', 'Target #', 'Animal', 'Maker', 'Side faced', 'Peg', 'Distance lased (m)', 'Slope (%)', 'Cut distance (m)', 'Archer', 'Is me', 'Arrow 1 zone', 'Arrow 2 zone', 'Arrow 3 zone', 'Points', 'Sight setting', 'Distance guess (m)', 'Guess error (m)']];
  rounds.filter(r => !r.kind).forEach(r => { const sys = SYSTEMS[r.systemKey];
    Object.keys(r.scores || {}).map(Number).sort((a, b) => a - b).forEach(ti => { const tg = r.targets?.[ti] || {}; const T = lib(tg.targetId);
      r.players.forEach(p => { const z = r.scores[ti][p.id] || []; if (!z.some(Boolean)) return; const g = tg.distanceGuess?.[p.id];
        tRows.push([rid(r), d(r.started), r.mode === 'laser' ? 'Laser practice' : 'Fun round', r.courseName || '', sys.name, ti + 1, T?.name || '', T?.maker || '', faceLabel(T, tg.faceId), r.peg || '', tg.distanceActual ?? '', tg.slope ?? '', cut(tg.distanceActual, tg.slope), p.name, p.name === me ? 'Yes' : '',
          z[0] ? ZONE_LABEL[z[0]] : '', z[1] ? ZONE_LABEL[z[1]] : '', z[2] ? ZONE_LABEL[z[2]] : '', scoreTarget(sys, z), tg.sight?.[p.id] ?? '', g ?? '', g != null && tg.distanceActual != null ? Math.round((g - tg.distanceActual) * 10) / 10 : '']); }); }); });

  // ---- Courses
  const cRows = [['Course', 'Built in', 'Target #', 'Animal', 'Maker', 'Side faced', 'Peg', 'Distance (m)', 'Slope (%)', 'Cut distance (m)']];
  state.courses.forEach(c => c.targets.forEach((tg, i) => { const T = lib(tg.targetId); const pegs = tg.pegs || (tg.distanceActual != null ? { red: { d: tg.distanceActual, s: tg.slope } } : {});
    const keys = Object.keys(pegs).filter(k => pegs[k]?.d != null);
    if (!keys.length) cRows.push([c.name, c.builtin ? 'Yes' : '', i + 1, T?.name || '', T?.maker || '', faceLabel(T, tg.faceId), '', '', '', '']);
    keys.forEach(k => cRows.push([c.name, c.builtin ? 'Yes' : '', i + 1, T?.name || '', T?.maker || '', faceLabel(T, tg.faceId), k[0].toUpperCase() + k.slice(1), pegs[k].d, pegs[k].s ?? '', cut(pegs[k].d, pegs[k].s)])); }));

  // ---- Sight marks (from Laser practice)
  const sRows = [['Date', 'Archer', 'Is me', 'Target', 'Distance lased (m)', 'Slope (%)', 'Cut distance (m)', 'Sight setting', 'Points scored']];
  rounds.filter(r => !r.kind).forEach(r => (r.targets || []).forEach((tg, ti) => r.players.forEach(p => { const sv = tg.sight?.[p.id]; if (sv == null) return; const T = lib(tg.targetId);
    sRows.push([d(r.started), p.name, p.name === me ? 'Yes' : '', T?.name || '', tg.distanceActual ?? '', tg.slope ?? '', cut(tg.distanceActual, tg.slope), sv, r.scores?.[ti]?.[p.id] ? scoreTarget(SYSTEMS[r.systemKey], r.scores[ti][p.id]) : '']); })));

  // ---- Read me (written for an AI as much as a person)
  const sysLines = Object.values(SYSTEMS).map(s => [`3D scoring: ${s.name}`, s.desc]);
  const readme = [
    ['3D Fun Round — archery data export'],
    [''],
    ['Archer', me || '(not set)'], ['Club', P.club || ''], ['Exported', new Date().toLocaleString()], ['Rounds', String(rounds.length)],
    [''],
    ['HOW TO USE THIS FILE WITH AN AI'],
    ['Suggested prompt', `I'm an archer${me ? ` called ${me.split(' ')[0]}` : ''}${(P.bows || []).length ? ` shooting ${(P.bows || []).map(bowName).join(' and ').toLowerCase()}` : ''}. Attached is an export of my scores from the 3D Fun Round app. Please read the "Read me" sheet first, then look at my rounds over time (rows where "Is me" = Yes). Tell me: whether I'm improving, where my arrows tend to go (Arrows sheet: Hit X/Y show left/right and high/low), which distances or targets cost me the most points, how good my distance judging is, and three specific things to practise next.`],
    [''],
    ['SHEETS'],
    ['Profile', 'Archer details (no photo). Archery Ireland and club numbers are included only if entered.'],
    ['Rounds', 'One row per archer per round, all disciplines. "Is me" marks the profile owner. % of max lets rounds of different lengths be compared. Indoor/field practice rounds have Mode "Practice" with the archer\'s goal for the session and their notes afterwards.'],
    ['Arrows', 'Indoor and field only: every arrow. Hit X/Y are the arrow position on the face when it was tapped (centre = 0,0; edge = 1; +X is right, +Y is low). Positive mean X = grouping right; positive mean Y = grouping low. Arrows entered with a score button have no position.'],
    ['3D targets', 'Every 3D target each archer shot: animal, side faced, peg, lased distance, slope (% grade, + uphill), cut (horizontal) distance, zone hit per arrow, points, sight setting (Laser practice) and distance guess.'],
    ['Courses', 'Saved courses with each target and its distance/slope per peg colour.'],
    ['Sight marks', 'Distance vs sight setting from Laser practice. Use cut distance to fit a sight curve.'],
    [''],
    ['SCORING'],
    ['3D zones', 'Centre (smallest ring) > Inner > Vital (outer kill zone) > Body (anywhere else on the animal) > Miss.'],
    ...sysLines,
    ['Indoor (WA 10-zone)', 'Rings 10 to 1; X is the inner 10 (counts 10, used as a tie-break). Compound: only the inner ring scores 10; the rest of the 10 ring counts 9 (World Archery indoor rule).'],
    ['3-spot (Vegas)', 'Rings 10 to 6 only; anything outside is a miss.'],
    ['WA Field', '6 to 1: yellow 6 and 5, black 4 to 1; X inside the 6.'],
    ['IFAA Field', '5-4-3: centre 5 (X spot inside), middle 4, outer 3.'],
    ['Games', 'Total points; King of the Castle (best target/end takes the crown); Skins (3D, ties roll over); Set play (indoor/field: 2 points per end won, 1 each for a tie); Guess the distance (3D add-on: 5 pts within 1 m, 3 within 2 m, 1 within 3 m).'],
    [''],
    ['PRIVACY', 'This file was created on the archer’s phone. The app has no server; nothing is sent anywhere unless the archer shares this file.'],
  ];

  const wb = XLSX.utils.book_new();
  const add = (name, rows, widths) => { const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = (widths || rows[0].map(h => ({ wch: Math.min(40, Math.max(10, String(h).length + 2)) }))); if (rows.length > 1 && name !== 'Read me' && name !== 'Profile') ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: rows[0].length - 1 } }) }; XLSX.utils.book_append_sheet(wb, ws, name); };
  add('Read me', readme, [{ wch: 26 }, { wch: 120 }]);
  add('Profile', profile, [{ wch: 26 }, { wch: 40 }]);
  add('Rounds', rRows); add('Arrows', aRows); add('3D targets', tRows); add('Courses', cRows); add('Sight marks', sRows);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const name = `archery-data-${(me || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name, counts: { rounds: rounds.length, rows: rRows.length - 1, arrows: aRows.length - 1, targets3d: tRows.length - 1 } };
}
