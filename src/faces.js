// Target faces for indoor and field rounds: geometry, scoring by radius, drawing, round presets.
// Radius r is normalised so 1.0 = edge of the scoring area as drawn.

export const SCHEMES = {
  wa10:   { name: 'WA 10-zone',        max: 10, buttons: ['X', 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'M'] },
  spot:   { name: '3-spot (10–6)',     max: 10, buttons: ['X', 10, 9, 8, 7, 6, 'M'] },
  wafield:{ name: 'WA Field (6–1)',    max: 6,  buttons: ['X', 6, 5, 4, 3, 2, 1, 'M'] },
  ifaa:   { name: 'IFAA Field (5-4-3)',max: 5,  buttons: ['X', 5, 4, 3, 'M'] },
  // compound indoor: only the inner ring (X10) scores 10; rest of the old 10 ring is 9
  wa10c:  { name: 'WA 10-zone, compound (inner 10)', max: 10, buttons: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'M'] },
  spotc:  { name: '3-spot, compound (inner 10)',     max: 10, buttons: [10, 9, 8, 7, 6, 'M'] },
};
export const BOWS = [['recurve', 'Recurve'], ['compound', 'Compound'], ['barebow', 'Barebow'], ['trad', 'Traditional']];
export const bowName = b => (BOWS.find(x => x[0] === b) || [, 'Recurve'])[1];
// the scheme a given archer is scored on
export function schemeFor(base, bow) { if (bow === 'compound') { if (base === 'wa10') return 'wa10c'; if (base === 'spot') return 'spotc'; } return base; }

// value of a tap at normalised radius r
export function scoreAt(scheme, r) {
  if (r > 1) return 'M';
  if (scheme === 'wa10') { if (r <= 0.05) return 'X'; return 10 - Math.min(9, Math.floor(r * 10)); }
  if (scheme === 'spot') { if (r <= 0.1) return 'X'; return 10 - Math.min(4, Math.floor(r * 5)); }
  if (scheme === 'wa10c') { if (r <= 0.05) return 10; if (r <= 0.2) return 9; return 10 - Math.min(9, Math.floor(r * 10)); }
  if (scheme === 'spotc') { if (r <= 0.1) return 10; if (r <= 0.4) return 9; return 10 - Math.min(4, Math.floor(r * 5)); }
  if (scheme === 'wafield') { if (r <= 1 / 12) return 'X'; return 6 - Math.min(5, Math.floor(r * 6)); }
  if (scheme === 'ifaa') { if (r <= 1 / 9) return 'X'; return r <= 1 / 3 ? 5 : r <= 2 / 3 ? 4 : 3; }
  return 'M';
}
export const valueOf = (scheme, v) => v === 'X' ? SCHEMES[scheme].max : v === 'M' || v == null ? 0 : v;

// ring bands for drawing: [outerRadius, fill, lineColour]
const GOLD = '#f6d23c', RED = '#e2483d', BLUE = '#3aa3e8', BLACK = '#22252b', WHITE = '#ffffff';
function bands(scheme) {
  if (scheme === 'wa10') return [[1, WHITE, '#555'], [.9, WHITE, '#555'], [.8, BLACK, '#fff'], [.7, BLACK, '#fff'], [.6, BLUE, '#222'], [.5, BLUE, '#222'], [.4, RED, '#222'], [.3, RED, '#222'], [.2, GOLD, '#222'], [.1, GOLD, '#222'], [.05, GOLD, '#222']];
  if (scheme === 'spot') return [[1, BLUE, '#222'], [.8, RED, '#222'], [.6, RED, '#222'], [.4, GOLD, '#222'], [.2, GOLD, '#222'], [.1, GOLD, '#222']];
  if (scheme === 'wafield') return [[1, BLACK, '#fff'], [5 / 6, BLACK, '#fff'], [4 / 6, BLACK, '#fff'], [3 / 6, BLACK, '#fff'], [2 / 6, GOLD, '#222'], [1 / 6, GOLD, '#222'], [1 / 12, GOLD, '#222']];
  if (scheme === 'ifaa') return [[1, BLACK, '#fff'], [2 / 3, WHITE, '#222'], [1 / 3, BLACK, '#fff'], [1 / 9, WHITE, '#222']];
  return [];
}
const RING_LABEL = { wa10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], spot: [6, 7, 8, 9, 10], wafield: [1, 2, 3, 4, 5, 6], ifaa: [3, 4, 5] };

// Draw a face as SVG. arrows: [{x,y,v}] in face units (-1..1). onTap(x,y,r)
export function drawFace(scheme, { arrows = [], onTap, size = '100%', faded = [], label } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '-110 -110 220 220'); svg.setAttribute('class', 'face'); svg.style.width = size;
  const mk = (t, a) => { const e = document.createElementNS(ns, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  svg.append(mk('rect', { x: -110, y: -110, width: 220, height: 220, fill: 'transparent' }));
  bands(scheme).forEach(([r, fill, line]) => svg.append(mk('circle', { cx: 0, cy: 0, r: r * 100, fill, stroke: line, 'stroke-width': r < .12 ? .6 : .9 })));
  // ring numbers along the right-hand side, inside each band
  const labs = RING_LABEL[scheme] || []; const n = labs.length;
  labs.forEach((v, i) => { const outer = scheme === 'ifaa' ? [1, 2 / 3, 1 / 3][i] : 1 - i / n; const inner = scheme === 'ifaa' ? [2 / 3, 1 / 3, 0][i] : 1 - (i + 1) / n; if (i === n - 1 && scheme !== 'ifaa') return;
    const mid = (outer + inner) / 2 * 100; const fill = bands(scheme).find(b => b[0] >= outer - 1e-6 && b[0] <= outer + 1e-6)?.[1];
    const t = mk('text', { x: mid, y: 3.5, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, fill: fill === BLACK ? '#fff' : '#111', opacity: .9 }); t.textContent = v; svg.append(t); });
  faded.forEach(a => svg.append(mk('circle', { cx: a.x * 100, cy: a.y * 100, r: 2.6, fill: '#111', 'fill-opacity': .28 })));
  arrows.forEach((a, i) => { svg.append(mk('circle', { cx: a.x * 100, cy: a.y * 100, r: 4.2, fill: '#111', stroke: '#fff', 'stroke-width': 1.4 }));
    const t = mk('text', { x: a.x * 100, y: a.y * 100 + 2.6, 'text-anchor': 'middle', 'font-size': 6.5, 'font-weight': 800, fill: '#fff' }); t.textContent = i + 1; svg.append(t); });
  if (label) { const t = mk('text', { x: -106, y: 106, 'font-size': 8, fill: '#667' }); t.textContent = label; svg.append(t); }
  if (onTap) svg.addEventListener('click', e => { const b = svg.getBoundingClientRect(); const x = ((e.clientX - b.left) / b.width * 220 - 110) / 100, y = ((e.clientY - b.top) / b.height * 220 - 110) / 100; onTap(x, y, Math.hypot(x, y)); });
  return svg;
}

export const FACES = {
  '40': '40 cm', '60': '60 cm', '80': '80 cm', '3spot': '40 cm 3-spot',
  'f20': '20 cm', 'f40': '40 cm', 'f60': '60 cm', 'f80': '80 cm',
};

export const INDOOR_ROUNDS = [
  { key: 'wa18',   name: 'WA 18',        face: '40',    scheme: 'wa10', dist: 18, ends: 20, arrows: 3, note: '60 arrows · 600 max' },
  { key: 'wa18h',  name: 'Half WA 18',     face: '40',    scheme: 'wa10', dist: 18, ends: 10, arrows: 3, note: '30 arrows · 300 max' },
  { key: 'vegas',  name: 'Vegas 300',      face: '3spot', scheme: 'spot', dist: 18, ends: 10, arrows: 3, note: '30 arrows on a 3-spot · 300 max' },
  { key: 'ports',  name: 'Portsmouth',     face: '60',    scheme: 'wa10', dist: 18, ends: 20, arrows: 3, note: '60 arrows · 600 max (20 yd ≈ 18 m)' },
  { key: 'icust',  name: 'Custom',         face: '40',    scheme: 'wa10', dist: 18, ends: 10, arrows: 3, note: 'Your choice of face, distance and ends' },
];
export const INDOOR_DISTS = [18, 15, 10];
export const INDOOR_FACES = ['40', '60', '80', '3spot'];

export const FIELD_ROUNDS = [
  { key: 'wafield', name: 'WA Field',   face: 'f60', scheme: 'wafield', dist: 40, ends: 12, arrows: 3, note: '6–1 scoring, yellow 6–5, black 4–1' },
  { key: 'ifaafld', name: 'IFAA Field', face: 'f60', scheme: 'ifaa',    dist: 40, ends: 14, arrows: 4, note: '5-4-3 scoring, 4 arrows per target' },
];
export const FIELD_DISTS = [70, 60, 50, 40, 30, 20, 10];
export const FIELD_FACES = ['f80', 'f60', 'f40', 'f20'];

export function schemeForFace(kind, face, roundScheme) {
  if (face === '3spot') return 'spot';
  if (kind === 'indoor') return 'wa10';
  return roundScheme;
}

// ---- totals & games over ends ----
// scores: { [pid]: [ [ {v,x,y}, ... ], ... ] }  (one array per end)
export function endTotal(scheme, end) { return (end || []).reduce((a, s) => a + valueOf(scheme, s?.v), 0); }
export function tally(round) {
  const out = {};
  round.players.forEach(p => {
    const ends = round.scores[p.id] || []; let total = 0, xs = 0, tens = 0, n = 0;
    const comp = schemeFor(round.scheme, p.bow) !== round.scheme;
    ends.forEach(e => (e || []).forEach(s => { if (!s) return; n++; total += valueOf(round.scheme, s.v); if (s.v === 'X' || (comp && s.v === 10)) xs++; if (s.v === 'X' || s.v === SCHEMES[round.scheme].max) tens++; }));
    out[p.id] = { total, xs, tens, arrows: n, avg: n ? total / n : 0 };
  });
  return out;
}
export function endsComplete(round, e) { return round.players.every(p => (round.scores[p.id]?.[e] || []).filter(Boolean).length >= round.arrows); }
export function setPlay(round) {
  const pts = {}; round.players.forEach(p => pts[p.id] = 0); const log = [];
  for (let e = 0; e < round.ends; e++) { if (!endsComplete(round, e)) break;
    const t = round.players.map(p => [p.id, endTotal(round.scheme, round.scores[p.id][e])]); const best = Math.max(...t.map(x => x[1])); const top = t.filter(x => x[1] === best);
    if (top.length === 1) pts[top[0][0]] += 2; else top.forEach(x => pts[x[0]] += 1); log.push({ e, top: top.map(x => x[0]) }); }
  let winner = null; if (round.players.length === 2) winner = round.players.find(p => pts[p.id] >= 6)?.id || null;
  return { pts, log, winner };
}
export function kingEnds(round) {
  let king = null; const won = {}; round.players.forEach(p => won[p.id] = 0);
  for (let e = 0; e < round.ends; e++) { if (!endsComplete(round, e)) break;
    const t = round.players.map(p => [p.id, endTotal(round.scheme, round.scores[p.id][e])]); const best = Math.max(...t.map(x => x[1])); const top = t.filter(x => x[1] === best).map(x => x[0]);
    const w = top.length === 1 ? top[0] : (king && top.includes(king) ? king : null); if (w) { won[w]++; king = w; } }
  return { king, won };
}
export const roundKey = r => `${r.kind}|${r.roundKey}|${r.dist}|${r.face}|${r.ends}x${r.arrows}`;
export const roundLabel = r => `${r.name} · ${r.dist} m · ${FACES[r.face]}${r.roundKey === 'icust' || r.kind === 'field' ? ` · ${r.ends}×${r.arrows}` : ''}`;
