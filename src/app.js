import { SYSTEMS, ZONES, ZONE_LABEL, scoreTarget, maxArrows } from './scoring.js';
import { totals, kingOfTheCastle, skins, guessTotals, suggestHandicap, distancePoints } from './games.js';
import { icon } from './icons.js';

// ---------- state ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let LIB = { categories: {}, targets: [] };
let state = {
  view: 'home',
  round: LS.get('wa.round', null),      // active round
  history: LS.get('wa.history', []),    // finished rounds
  courses: LS.get('wa.courses', []),    // saved courses [{name, targets:[{targetId,faceId}]}]
  names: LS.get('wa.names', []),        // recent player names
  draft: null,                          // setup draft
  pick: null,                           // target picker ctx {cat, targetId, onDone}
  ti: 0,                                // current target index in round
  pointsOverride: LS.get('wa.points', {}),
};
const save = () => { LS.set('wa.round', state.round); LS.set('wa.history', state.history); LS.set('wa.courses', state.courses); LS.set('wa.names', state.names); LS.set('wa.points', state.pointsOverride); };
const uid = () => Math.random().toString(36).slice(2, 9);
const $ = sel => document.querySelector(sel);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  kids.flat().forEach(k => k != null && el.append(k.nodeType ? k : document.createTextNode(k)));
  return el;
};
function toast(msg) { let t = $('.toast'); if (!t) { t = h('div', { class: 'toast' }); document.body.append(t); } t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }
function system() { const s = structuredClone(SYSTEMS[state.round?.systemKey || state.draft?.systemKey || 'ifaa_hunting']); const o = state.pointsOverride[state.round?.systemKey]; if (o) s.table = o; return s; }
const findTarget = id => LIB.targets.find(t => t.id === id);
const findFace = (t, fid) => t?.faces.find(f => f.id === fid) || t?.faces[0];

// ---------- render ----------
function render() {
  const app = $('#app'); app.innerHTML = '';
  const views = { home, setup, course, pick: picker, play, board, summary, settings, courses: coursesView, history: historyView, progress, about };
  app.append((views[state.view] || home)());
  window.scrollTo(0, 0);
}
function topbar(title, sub, back, right) {
  return h('div', { class: 'topbar' },
    back ? h('button', { onclick: back, 'aria-label': 'Back' }, icon('back')) : h('span', { style: 'width:6px' }),
    h('div', { class: 'title' }, title, sub ? h('div', { class: 'sub' }, sub) : null),
    right || null);
}

// ---------- HOME ----------
function home() {
  const r = state.round; const hist = state.history;
  const best = hist.reduce((m, x) => Math.max(m, ...Object.values(x.final?.totals || {}).map(t => t.gross)), 0);
  const arrowsShot = hist.reduce((n, x) => n + Object.values(x.scores).reduce((a, by) => a + Object.values(by).reduce((b, arr) => b + arr.filter(Boolean).length, 0), 0), 0);
  const animals = LIB.targets.filter(t => t.faces[0]?.photo).slice(0, 12);
  const rings = () => { const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'rings'); [46, 34, 22, 10].forEach(rr => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', 50); c.setAttribute('cy', 50); c.setAttribute('r', rr); svg.append(c); }); return svg; };
  return h('div', {},
    topbar('3D Fun Round', null, null, h('button', { onclick: () => go('settings'), 'aria-label': 'Settings' }, icon('cog'))),
    h('div', { class: 'page' },
      h('div', { class: 'hero' }, rings(),
        h('div', { class: 'pegs' }, h('i', { class: 'r' }), h('i', { class: 'b' }), h('i', { class: 'w' }), h('i', { class: 'y' })),
        h('h1', { style: 'margin-top:10px' }, 'Walk the course. Keep the craic.'),
        h('p', {}, 'Score a 3D round with your mates: points, King of the Castle, skins, guess the distance.'),
        h('div', { class: 'animals' }, ...animals.map(t => h('img', { src: t.faces[0].photo, alt: '' })))),
      r ? h('button', { class: 'cta', onclick: () => { state.ti = nextUnscored(); go('play'); } }, icon('arrow', 'xl'),
        h('div', { style: 'flex:1' }, h('b', {}, 'Back to the round'), h('small', {}, `${r.players.map(p => p.name).join(', ')} · ${Object.keys(r.scores).length} targets scored`)),
        h('span', { class: 'ghost', onclick: e => { e.stopPropagation(); if (confirmBox('Abandon this round?')) { state.round = null; save(); render(); } }, style: 'color:var(--muted);font-size:12px' }, 'Abandon'))
        : h('button', { class: 'cta', onclick: startSetup }, icon('bow', 'xl'), h('div', {}, h('b', {}, 'Shoot a round'), h('small', {}, 'Pick your archers, your game and go'))),
      hist.length ? h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('div', { class: 'v' }, String(hist.length)), h('div', { class: 'k' }, 'Rounds')),
        h('div', { class: 'stat' }, h('div', { class: 'v' }, String(best)), h('div', { class: 'k' }, 'Best score')),
        h('div', { class: 'stat' }, h('div', { class: 'v' }, String(arrowsShot)), h('div', { class: 'k' }, 'Arrows shot'))) : null,
      h('div', { class: 'grid c2' },
        h('button', { class: 'tile', onclick: () => go('progress') }, icon('trend', 'lg'), 'Progress', h('small', {}, 'getting better?')),
        h('button', { class: 'tile', onclick: () => go('history') }, icon('history', 'lg'), 'History', h('small', {}, `${hist.length} rounds`)),
        h('button', { class: 'tile', onclick: () => go('courses') }, icon('course', 'lg'), 'Courses', h('small', {}, `${state.courses.length} saved`)),
        h('button', { class: 'tile', onclick: () => { state.pick = { browse: true }; go('pick'); } }, icon('library', 'lg'), 'Targets', h('small', {}, `${LIB.targets.length} animals`))),
      h('button', { class: 'ghost', style: 'align-self:center', onclick: () => location.href = 'tools/trace.html' }, icon('trace'), ' Trace scoring rings'),
      h('p', { class: 'muted', style: 'font-size:12px;text-align:center' }, 'Free and volunteer-built, for any club. Works offline — add it to your home screen.')));
}
function confirmBox(msg) { return window.confirm ? window.confirm(msg) : true; }
function go(v) { state.view = v; render(); }

// ---------- SETUP ----------
function startSetup() {
  state.draft = { players: [{ id: uid(), name: '', handicap: 0 }], systemKey: 'ifaa_hunting', arrows: 1, games: { total: true, king: false, skins: false, guess: false }, useHandicap: false, targets: [], courseName: '' };
  go('setup');
}
function setup() {
  const d = state.draft; const sys = SYSTEMS[d.systemKey];
  d.arrows = maxArrows(sys, d.arrows);
  const playerRow = (p, i) => h('div', { class: 'row' },
    h('input', { placeholder: `Player ${i + 1}`, value: p.name, list: 'names', oninput: e => { p.name = e.target.value; if (d.useHandicap) { const s = suggestHandicap(state.history, p.name, d.systemKey); if (s != null) p.handicap = s; } } }),
    d.useHandicap ? h('input', { type: 'number', step: '0.5', style: 'flex:0 0 90px', value: p.handicap, title: 'Handicap: points per target added', oninput: e => p.handicap = parseFloat(e.target.value) || 0 }) : null,
    h('button', { class: 'ghost', style: 'flex:0 0 44px', onclick: () => { d.players.splice(i, 1); render(); } }, '✕'));
  return h('div', {},
    topbar('Shoot a round', null, () => go('home')),
    h('datalist', { id: 'names' }, state.names.map(n => h('option', { value: n }))),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('div', { class: 'row' }, icon('people'), h('h3', {}, 'Who’s shooting')),
        ...d.players.map(playerRow),
        h('div', { class: 'row' },
          h('button', { onclick: () => { d.players.push({ id: uid(), name: '', handicap: 0 }); render(); }, disabled: d.players.length >= 6 }, '+ Add player'),
          h('label', { class: 'row', style: 'flex:0 0 auto' }, h('input', { type: 'checkbox', style: 'width:24px;min-height:24px', checked: d.useHandicap, onchange: e => { d.useHandicap = e.target.checked; if (d.useHandicap) d.players.forEach(p => { const s = suggestHandicap(state.history, p.name, d.systemKey); if (s != null) p.handicap = s; }); render(); } }), 'Handicap'))),
      h('div', { class: 'card' }, h('h3', {}, 'Scoring'),
        h('select', { onchange: e => { d.systemKey = e.target.value; d.arrows = SYSTEMS[d.systemKey].arrows; render(); } }, ...Object.entries(SYSTEMS).map(([k, s]) => h('option', { value: k, selected: k === d.systemKey }, s.name))),
        h('div', { class: 'muted', style: 'font-size:13px' }, sys.desc),
        h('div', { class: 'row' }, h('span', { style: 'flex:0 0 auto' }, 'Arrows per target'),
          h('div', { class: 'seg' }, ...[1, 2, 3].map(n => h('button', { class: (d.arrows === n ? 'on' : ''), disabled: n > sys.arrows, onclick: () => { d.arrows = n; render(); } }, String(n)))))),
      h('div', {}, h('h3', { style: 'margin:4px 0 8px' }, 'Games'),
        h('div', { class: 'list' }, ...[['total', 'rings', 'Total points', 'Plain score, highest wins'], ['king', 'crown', 'King of the Castle', 'Best arrow takes the target; hold it to stay King'], ['skins', 'skin', 'Skins', 'Each target is a skin; ties roll over'], ['guess', 'ruler', 'Guess the distance', 'Call it, shoot it, then lase it']].map(([k, ic, n, desc]) =>
          h('div', { class: 'gamecard' + (d.games[k] ? ' on' : ''), onclick: () => { d.games[k] = !d.games[k]; render(); } }, icon(ic, 'lg'), h('div', {}, h('b', {}, n), h('small', {}, desc)), h('span', { class: 'chk' }, d.games[k] ? icon('check') : null))))),
      h('div', { class: 'card' }, h('h3', {}, 'Course'),
        h('div', { class: 'muted', style: 'font-size:13px' }, 'Load a saved course, build one now, or just pick each animal when you get to it.'),
        h('div', { class: 'row' },
          h('select', { onchange: e => { const c = state.courses.find(c => c.name === e.target.value); d.targets = c ? structuredClone(c.targets) : []; d.courseName = c?.name || ''; render(); } },
            h('option', { value: '' }, d.targets.length ? `${d.targets.length} targets chosen` : 'Pick as we go'), ...state.courses.map(c => h('option', { value: c.name, selected: c.name === d.courseName }, `${c.name} (${c.targets.length})`))),
          h('button', { style: 'flex:0 0 auto', onclick: () => go('course') }, d.targets.length ? 'Edit' : 'Build')))),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: startRound, disabled: !d.players.some(p => p.name.trim()) }, 'Start shooting')));
}
function startRound() {
  const d = state.draft;
  d.players = d.players.filter(p => p.name.trim()).map(p => ({ ...p, name: p.name.trim() }));
  d.players.forEach(p => { if (!state.names.includes(p.name)) state.names.unshift(p.name); }); state.names = state.names.slice(0, 24);
  state.round = { id: uid(), started: Date.now(), players: d.players, systemKey: d.systemKey, arrows: d.arrows, games: d.games, useHandicap: d.useHandicap, targets: d.targets.map(t => ({ ...t })), scores: {}, courseName: d.courseName };
  state.ti = 0; save(); go('play');
}

// ---------- COURSE BUILDER ----------
function course() {
  const d = state.draft || { targets: [] };
  const list = d.targets.map((t, i) => {
    const T = findTarget(t.targetId), F = findFace(T, t.faceId);
    return h('div', { class: 'item' }, h('div', { class: 'n' }, String(i + 1)),
      F?.photo ? h('img', { src: F.photo, style: 'height:44px;width:60px;object-fit:contain' }) : null,
      h('div', { class: 't' }, T?.name || '?', h('small', {}, F?.label || '')),
      h('button', { class: 'ghost', disabled: i === 0, onclick: () => { [d.targets[i - 1], d.targets[i]] = [d.targets[i], d.targets[i - 1]]; render(); } }, '↑'),
      h('button', { class: 'ghost', disabled: i === d.targets.length - 1, onclick: () => { [d.targets[i + 1], d.targets[i]] = [d.targets[i], d.targets[i + 1]]; render(); } }, '↓'),
      h('button', { class: 'ghost', onclick: () => { d.targets.splice(i, 1); render(); } }, '✕'));
  });
  return h('div', {},
    topbar('Course', `${d.targets.length} targets`, () => go('setup')),
    h('div', { class: 'page' },
      h('div', { class: 'list' }, ...list),
      h('button', { class: 'tile', onclick: () => { state.pick = { onDone: sel => { d.targets.push(sel); go('course'); }, back: 'course' }; go('pick'); } }, '+ Add target'),
      h('div', { class: 'card' }, h('h3', {}, 'Save course'),
        h('div', { class: 'row' }, h('input', { placeholder: 'Course name, e.g. Red pegs Nov 2026', value: d.courseName || '', oninput: e => d.courseName = e.target.value }),
          h('button', { style: 'flex:0 0 auto', disabled: !d.targets.length, onclick: () => { const name = (d.courseName || `Course ${new Date().toLocaleDateString()}`).trim(); state.courses = state.courses.filter(c => c.name !== name); state.courses.unshift({ name, targets: structuredClone(d.targets), saved: Date.now() }); d.courseName = name; save(); toast('Course saved'); } }, 'Save')))),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: () => go('setup') }, 'Done')));
}
function coursesView() {
  return h('div', {}, topbar('Saved courses', null, () => go('home')),
    h('div', { class: 'page' }, state.courses.length ? h('div', { class: 'list' }, ...state.courses.map(c => h('div', { class: 'item' }, h('div', { class: 't' }, c.name, h('small', {}, `${c.targets.length} targets · ${new Date(c.saved).toLocaleDateString()}`)),
      h('button', { onclick: () => { startSetup(); state.draft.targets = structuredClone(c.targets); state.draft.courseName = c.name; go('setup'); } }, 'Use'),
      h('button', { class: 'ghost', onclick: () => { state.courses = state.courses.filter(x => x !== c); save(); render(); } }, '✕')))) : h('p', { class: 'muted' }, 'No saved courses yet. Build one from New round → Course.')));
}

// ---------- TARGET PICKER (3 taps: category → animal → face) ----------
function picker() {
  const p = state.pick || {}; const cats = LIB.categories;
  const back = () => { if (p.targetId) { p.targetId = null; render(); } else if (p.cat) { p.cat = null; render(); } else go(p.back || (state.round ? 'play' : 'home')); };
  let body;
  if (!p.cat && !p.q) {
    body = h('div', { class: 'grid c2' }, ...Object.entries(cats).map(([k, n]) => {
      const n1 = LIB.targets.filter(t => t.cat === k).length; if (!n1) return null;
      const sample = LIB.targets.find(t => t.cat === k && t.faces[0]?.photo);
      return h('button', { class: 'tile', onclick: () => { p.cat = k; render(); } }, sample ? h('img', { src: sample.faces[0].photo, alt: '' }) : null, n, h('small', {}, `${n1}`));
    }));
  } else if (!p.targetId) {
    const ql = (p.q || '').toLowerCase();
    const items = LIB.targets.filter(t => (p.cat ? t.cat === p.cat : true) && (!ql || t.name.toLowerCase().includes(ql)));
    body = h('div', { class: 'grid c2' }, ...items.map(t => h('button', { class: 'tile', onclick: () => choose(t) }, t.faces[0]?.photo ? h('img', { src: t.faces[0].photo, alt: '' }) : h('span', { class: 'muted' }, 'no photo yet'), t.name, h('small', {}, `${t.maker}${t.faces.length > 1 ? ` · ${t.faces.length} sides` : ''}`))));
  } else {
    const t = findTarget(p.targetId);
    body = h('div', { class: 'grid c2' }, ...t.faces.map(f => h('button', { class: 'tile', onclick: () => done(t, f) }, h('img', { src: f.photo, alt: '' }), f.label, h('small', {}, f.sets?.length ? `${f.sets.length} zone set${f.sets.length > 1 ? 's' : ''}` : 'zones not traced yet'))));
  }
  function choose(t) { if (p.browse) { p.targetId = t.id; render(); return; } if (t.faces.length <= 1) done(t, t.faces[0]); else { p.targetId = t.id; render(); } }
  function done(t, f) {
    if (p.browse) { p.preview = { targetId: t.id, faceId: f?.id }; render(); return; }
    const sel = { targetId: t.id, faceId: f?.id || null };
    if (p.onDone) p.onDone(sel); else go('play');
  }
  const title = p.targetId ? findTarget(p.targetId).name : p.cat ? cats[p.cat] : 'What’s the target?';
  return h('div', {}, topbar(title, p.browse ? 'Library' : `Target ${state.pick?.ti != null ? state.pick.ti + 1 : ''}`, back),
    h('div', { class: 'page' },
      !p.targetId ? h('div', { class: 'search' }, h('input', { type: 'search', placeholder: 'Search… fox, bear, dodo', value: p.q || '', oninput: e => { p.q = e.target.value; p.cat = null; render(); setTimeout(() => $('.search input')?.focus(), 0); } })) : null,
      p.preview ? diagram(findTarget(p.preview.targetId), findFace(findTarget(p.preview.targetId), p.preview.faceId)) : null,
      body));
}

// ---------- DIAGRAM ----------
function diagram(T, F, opts = {}) {
  if (!F) return h('div', { class: 'card muted' }, 'No photo for this target yet.');
  const sys = system();
  const pts = sys.table[0];
  const legend = h('div', { class: 'legend' },
    h('div', {}, h('i', { style: 'background:var(--centre)' }), `Centre ${pts.centre}`),
    h('div', {}, h('i', { style: 'background:var(--inner)' }), `Inner ${pts.inner}`),
    h('div', {}, h('i', { style: 'background:var(--vital)' }), `Vital ${pts.vital}`),
    h('div', {}, h('i', { style: 'background:#eee' }), `Body ${pts.body}`));
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none');
  const poly = (pts, cls) => { const e = document.createElementNS(ns, 'path'); e.setAttribute('d', smoothPath(pts)); e.setAttribute('class', cls); e.setAttribute('vector-effect', 'non-scaling-stroke'); return e; };
  const ell = (c, cls) => { const e = document.createElementNS(ns, 'ellipse'); e.setAttribute('cx', c.cx); e.setAttribute('cy', c.cy); e.setAttribute('rx', c.rx); e.setAttribute('ry', c.ry); e.setAttribute('class', cls); e.setAttribute('vector-effect', 'non-scaling-stroke'); return e; };
  (F.sets || []).forEach(s => { if (s.outer) svg.append(poly(s.outer, 'z-vital')); if (s.inner) svg.append(poly(s.inner, 'z-inner')); if (s.centre) svg.append(ell(s.centre, 'z-centre')); });
  (opts.marks || []).forEach(m => { const e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', m.x); e.setAttribute('cy', m.y); e.setAttribute('r', 1.4); e.setAttribute('class', 'arrow'); e.setAttribute('vector-effect', 'non-scaling-stroke'); svg.append(e); });
  const wrap = h('div', { class: 'diagram' }, h('img', { src: F.photo, alt: `${T.name}, ${F.label}` }), svg, legend,
    !(F.sets || []).length ? h('div', { class: 'notrace' }, 'Rings not traced yet — score with the buttons') : null);
  if (opts.onTap) wrap.addEventListener('click', e => { const r = wrap.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100; opts.onTap({ x, y, zone: zoneAt(F, x, y) }); });
  return wrap;
}
function smoothPath(pts) { // Catmull-Rom → cubic bezier closed path
  const n = pts.length; if (n < 3) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`; }
  return d + 'Z';
}
function inPoly(pts, x, y) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function zoneAt(F, x, y) {
  for (const s of F.sets || []) {
    if (s.centre && ((x - s.centre.cx) ** 2 / s.centre.rx ** 2 + (y - s.centre.cy) ** 2 / s.centre.ry ** 2) <= 1) return 'centre';
    if (s.inner && inPoly(s.inner, x, y)) return 'inner';
    if (s.outer && inPoly(s.outer, x, y)) return 'vital';
  }
  return 'body';
}

// ---------- PLAY ----------
function nextUnscored() { const r = state.round; for (let i = 0; i < Math.max(r.targets.length, Object.keys(r.scores).length + 1); i++) if (!r.scores[i]) return i; return r.targets.length; }
function play() {
  const r = state.round; const sys = system(); const ti = state.ti;
  const t = r.targets[ti];
  if (!t) { // choose the animal for this target
    if (!state.pick || state.pick.ti !== ti || state.pick.browse) state.pick = { ti, back: 'board', onDone: sel => { r.targets[ti] = { ...sel }; state.pick = null; save(); go('play'); } };
    return picker();
  }
  const T = findTarget(t.targetId), F = findFace(T, t.faceId);
  r.scores[ti] = r.scores[ti] || {};
  r.players.forEach(p => { r.scores[ti][p.id] = r.scores[ti][p.id] || []; });
  t.marks = t.marks || {};
  let active = r.players.find(p => (r.scores[ti][p.id].filter(Boolean).length < r.arrows) && !(sys.walkdown && r.scores[ti][p.id].some(z => z && z !== 'miss'))) || r.players[0];
  const sel = state.selPid ? r.players.find(p => p.id === state.selPid) : null; if (sel) active = sel;
  function setZone(z) {
    const arr = r.scores[ti][active.id];
    let i = arr.findIndex(v => !v); if (i < 0) i = Math.min(arr.length, r.arrows - 1);
    if (i >= r.arrows) i = r.arrows - 1;
    arr[i] = z;
    if (sys.walkdown && z !== 'miss') arr.length = i + 1;
    state.selPid = null; save(); render();
  }
  const zoneBtns = h('div', { class: 'zones' }, ...ZONES.map(z => h('button', { class: z, onclick: () => setZone(z) }, ZONE_LABEL[z], h('small', {}, String(sys.table[Math.min(r.scores[ti][active.id].filter(Boolean).length, sys.table.length - 1)][z])))));
  const playerRows = r.players.map(p => { const arr = r.scores[ti][p.id]; return h('div', { class: 'player', style: p.id === active.id ? 'background:var(--bg);margin:0 -14px;padding:8px 14px;border-radius:10px' : '', onclick: () => { state.selPid = p.id; render(); } },
    h('div', { class: 'name' }, p.id === active.id ? '▶ ' : '', p.name),
    h('div', { class: 'arrows' }, ...Array.from({ length: r.arrows }, (_, i) => h('span', { style: arr[i] ? `background:var(--${arr[i] === 'miss' ? 'body' : arr[i]});color:${arr[i] === 'centre' ? '#111' : '#fff'}` : '', onclick: e => { e.stopPropagation(); arr[i] = undefined; while (arr.length && !arr[arr.length - 1]) arr.pop(); state.selPid = p.id; save(); render(); } }, arr[i] ? ZONE_LABEL[arr[i]][0] : '·'))),
    h('div', { class: 'score' }, String(scoreTarget(sys, arr)))); });
  const guess = r.games.guess ? h('div', { class: 'card' }, h('h3', {}, 'Guess the distance'),
    h('div', { class: 'grid c2' }, ...r.players.map(p => h('label', {}, h('small', { class: 'muted' }, p.name), h('input', { type: 'number', inputmode: 'decimal', placeholder: 'm', value: t.distanceGuess?.[p.id] ?? '', onchange: e => { t.distanceGuess = t.distanceGuess || {}; t.distanceGuess[p.id] = e.target.value === '' ? null : parseFloat(e.target.value); save(); } })))),
    h('label', {}, h('small', { class: 'muted' }, 'Actual (lased) distance'), h('input', { type: 'number', inputmode: 'decimal', placeholder: 'm', value: t.distanceActual ?? '', onchange: e => { t.distanceActual = e.target.value === '' ? null : parseFloat(e.target.value); save(); render(); } })),
    t.distanceActual != null ? h('div', { class: 'row' }, ...r.players.map(p => h('span', { class: 'pill' }, `${p.name}: ${t.distanceGuess?.[p.id] ?? '–'} → ${distancePoints(t.distanceGuess?.[p.id], t.distanceActual)} pts`))) : null) : null;
  const allDone = r.players.every(p => { const a = r.scores[ti][p.id]; return a.filter(Boolean).length >= r.arrows || (sys.walkdown && a.some(z => z && z !== 'miss')); });
  return h('div', {},
    topbar(`${ti + 1}. ${T?.name || 'Target'}`, `${F?.label || ''} · ${sys.name}`, () => go('board'), h('button', { onclick: () => { state.pick = { ti, back: 'play', onDone: sel => { r.targets[ti] = { ...sel, distanceGuess: t.distanceGuess, distanceActual: t.distanceActual }; save(); go('play'); } }; go('pick'); } }, '⇄')),
    h('div', { class: 'page' },
      diagram(T, F, { marks: Object.values(t.marks).flat(), onTap: m => { t.marks[active.id] = [...(t.marks[active.id] || []), { x: m.x, y: m.y }].slice(-r.arrows); setZone(m.zone); } }),
      h('div', { class: 'card' }, h('div', { class: 'muted', style: 'font-size:13px' }, `Scoring ${active.name} · arrow ${Math.min(r.scores[ti][active.id].filter(Boolean).length + 1, r.arrows)} of ${r.arrows} — tap the animal where it landed, or a zone button`), zoneBtns),
      h('div', { class: 'card' }, ...playerRows),
      guess),
    h('div', { class: 'bottombar' },
      h('button', { onclick: () => { state.ti = Math.max(0, ti - 1); state.selPid = null; render(); }, disabled: ti === 0 }, '‹ Prev'),
      h('button', { class: 'primary', onclick: () => { state.ti = ti + 1; state.selPid = null; save(); render(); } }, allDone ? 'Next target ›' : 'Skip ›'),
      h('button', { onclick: () => go('board') }, 'Board')));
}

// ---------- SCOREBOARD ----------
function board() {
  const r = state.round; if (!r) return home(); const sys = system();
  const tot = totals(r, sys); const k = r.games.king ? kingOfTheCastle(r, sys) : null; const sk = r.games.skins ? skins(r, sys) : null; const g = r.games.guess ? guessTotals(r) : null;
  const rows = [...r.players].sort((a, b) => (r.useHandicap ? tot[b.id].net - tot[a.id].net : tot[b.id].gross - tot[a.id].gross));
  const table = h('table', {}, h('tr', {}, h('th', {}, 'Player'), h('th', { class: 'num' }, 'Pts'), r.useHandicap ? h('th', { class: 'num' }, 'Net') : null, k ? h('th', { class: 'num' }, 'Holes') : null, sk ? h('th', { class: 'num' }, 'Skins') : null, g ? h('th', { class: 'num' }, 'Dist') : null),
    ...rows.map(p => h('tr', {}, h('td', {}, k && k.king === p.id ? h('span', { class: 'crown' }, '♛ ') : '', p.name), h('td', { class: 'num' }, h('b', {}, String(tot[p.id].gross))), r.useHandicap ? h('td', { class: 'num' }, String(tot[p.id].net)) : null, k ? h('td', { class: 'num' }, `${k.holesWon[p.id]}${k.streak[p.id] > 1 ? ` (${k.streak[p.id]}🔥)` : ''}`) : null, sk ? h('td', { class: 'num' }, String(sk.won[p.id])) : null, g ? h('td', { class: 'num' }, String(g[p.id].pts)) : null)));
  const perTarget = h('div', { class: 'list' }, ...Array.from({ length: Math.max(r.targets.length, Object.keys(r.scores).length) }, (_, i) => {
    const t = r.targets[i]; const T = t && findTarget(t.targetId); const sc = r.scores[i] || {};
    return h('div', { class: 'item', onclick: () => { state.ti = i; go('play'); } }, h('div', { class: 'n' }, String(i + 1)), h('div', { class: 't' }, T?.name || 'Not picked yet', h('small', {}, r.players.map(p => `${p.name} ${sc[p.id] ? scoreTarget(sys, sc[p.id]) : '–'}`).join(' · '))), t?.distanceActual != null ? h('span', { class: 'pill' }, `${t.distanceActual} m`) : null);
  }));
  return h('div', {}, topbar('Scoreboard', `${sys.name}${sk ? ` · ${sk.carry > 1 ? sk.carry + ' skins riding' : ''}` : ''}`, () => go('home')),
    h('div', { class: 'page' }, h('div', { class: 'card' }, table), h('h3', {}, 'Targets'), perTarget),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: () => { state.ti = nextUnscored(); go('play'); } }, 'Continue'), h('button', { onclick: finishRound }, 'Finish round')));
}
function finishRound() {
  const r = state.round; const sys = system();
  r.final = { totals: totals(r, sys), king: r.games.king ? kingOfTheCastle(r, sys) : null, skins: r.games.skins ? skins(r, sys) : null, guess: r.games.guess ? guessTotals(r) : null, ended: Date.now() };
  state.history.unshift(r); state.round = null; state.last = r; save(); go('summary');
}
function summary() {
  const r = state.last || state.history[0]; if (!r) return home(); const sys = SYSTEMS[r.systemKey];
  const rows = [...r.players].sort((a, b) => r.final.totals[b.id].gross - r.final.totals[a.id].gross);
  const canvas = h('canvas', { width: 1080, height: 300 + rows.length * 70 + (r.targets.length) * 44, style: 'width:100%;height:auto;border-radius:12px;border:1px solid var(--line)' });
  setTimeout(() => drawSummary(canvas, r, sys, rows), 0);
  return h('div', {}, topbar('Round summary', new Date(r.started).toLocaleDateString(), () => go('home')),
    h('div', { class: 'page' }, canvas,
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => { const a = document.createElement('a'); a.download = `round-${new Date(r.started).toISOString().slice(0, 10)}.png`; a.href = canvas.toDataURL('image/png'); a.click(); } }, 'Save image'),
        navigator.share ? h('button', { onclick: async () => { canvas.toBlob(async b => { const f = new File([b], 'round.png', { type: 'image/png' }); try { await navigator.share({ files: [f], title: '3D Fun Round' }); } catch {} }); } }, 'Share') : null)));
}
function drawSummary(c, r, sys, rows) {
  const x = c.getContext('2d'); const W = c.width; x.fillStyle = '#eef2fa'; x.fillRect(0, 0, W, c.height);
  x.fillStyle = '#1d4fd8'; x.fillRect(0, 0, W, 120); x.fillStyle = '#fff'; x.font = 'bold 44px system-ui'; x.fillText('3D Fun Round', 40, 70); x.font = '24px system-ui'; x.fillText(`${new Date(r.started).toLocaleDateString()} · ${sys.name} · ${r.targets.length} targets`, 40, 105);
  let y = 180; x.fillStyle = '#121a2e';
  rows.forEach((p, i) => { const t = r.final.totals[p.id]; x.font = 'bold 36px system-ui'; x.fillText(`${i + 1}. ${p.name}`, 40, y); x.textAlign = 'right'; x.fillText(String(t.gross), W - 40, y); x.textAlign = 'left';
    const bits = []; if (r.useHandicap) bits.push(`net ${t.net}`); if (r.final.king) bits.push(`${r.final.king.holesWon[p.id]} holes${r.final.king.king === p.id ? ' · KING' : ''}`); if (r.final.skins) bits.push(`${r.final.skins.won[p.id]} skins`); if (r.final.guess) bits.push(`distance ${r.final.guess[p.id].pts} pts${r.final.guess[p.id].calls ? `, avg ${(r.final.guess[p.id].absErr / r.final.guess[p.id].calls).toFixed(1)} m off` : ''}`);
    x.font = '22px system-ui'; x.fillStyle = '#5a6680'; x.fillText(bits.join(' · '), 40, y + 30); x.fillStyle = '#121a2e'; y += 70; });
  y += 20; x.font = 'bold 22px system-ui'; x.fillStyle = '#5a6680'; x.fillText('TARGET', 40, y); rows.forEach((p, i) => { x.textAlign = 'right'; x.fillText(p.name.slice(0, 10), W - 40 - i * 130, y); x.textAlign = 'left'; }); y += 14;
  r.targets.forEach((t, i) => { y += 40; const T = findTarget(t.targetId); x.font = '22px system-ui'; x.fillStyle = '#121a2e'; x.fillText(`${i + 1}. ${T?.name || '?'}${t.distanceActual != null ? ` (${t.distanceActual} m)` : ''}`, 40, y);
    rows.forEach((p, j) => { const a = r.scores[i]?.[p.id]; x.textAlign = 'right'; x.fillText(a ? String(scoreTarget(sys, a)) : '–', W - 40 - j * 130, y); x.textAlign = 'left'; }); });
}
function historyView() {
  return h('div', {}, topbar('History', null, () => go('home')),
    h('div', { class: 'page' }, state.history.length ? h('div', { class: 'list' }, ...state.history.map(r => h('div', { class: 'item', onclick: () => { state.last = r; go('summary'); } }, h('div', { class: 't' }, r.players.map(p => `${p.name} ${r.final?.totals?.[p.id]?.gross ?? ''}`).join(' · '), h('small', {}, `${new Date(r.started).toLocaleDateString()} · ${SYSTEMS[r.systemKey]?.name} · ${r.targets.length} targets`))))) : h('p', { class: 'muted' }, 'No finished rounds yet.')));
}

// ---------- PROGRESS ----------
function sparkline(points, { w = 320, hgt = 120, label } = {}) {
  const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`); svg.setAttribute('class', 'spark');
  if (points.length < 1) return svg;
  const ys = points.map(p => p.y); const lo = Math.min(...ys) * 0.9, hi = Math.max(...ys) * 1.05 || 1;
  const X = i => 20 + (points.length === 1 ? (w - 40) / 2 : i * (w - 40) / (points.length - 1)), Y = v => hgt - 22 - (v - lo) / (hi - lo || 1) * (hgt - 40);
  const mk = (t, a) => { const e = document.createElementNS(ns, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  [0, .5, 1].forEach(f => svg.append(mk('line', { class: 'grid', x1: 20, x2: w - 20, y1: Y(lo + (hi - lo) * f), y2: Y(lo + (hi - lo) * f) })));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i)},${Y(p.y)}`).join(' ');
  if (points.length > 1) { svg.append(mk('path', { class: 'area', d: `${d} L${X(points.length - 1)},${hgt - 22} L${X(0)},${hgt - 22}Z` })); svg.append(mk('path', { class: 'line', d })); }
  points.forEach((p, i) => { svg.append(mk('circle', { class: 'dot', cx: X(i), cy: Y(p.y), r: 4 })); const t = mk('text', { x: X(i), y: hgt - 6, 'text-anchor': 'middle' }); t.textContent = p.label; svg.append(t); });
  const t1 = mk('text', { x: 2, y: Y(hi) + 4 }); t1.textContent = hi.toFixed(0); const t2 = mk('text', { x: 2, y: Y(lo) + 4 }); t2.textContent = lo.toFixed(0); svg.append(t1, t2);
  return svg;
}
function progress() {
  const names = [...new Set(state.history.flatMap(r => r.players.map(p => p.name)))];
  const who = state.progName && names.includes(state.progName) ? state.progName : names[0];
  const rounds = state.history.filter(r => r.players.some(p => p.name === who)).slice().reverse();
  const bySys = {};
  rounds.forEach(r => { const p = r.players.find(p => p.name === who); const t = r.final?.totals?.[p.id]; if (!t?.targets) return; (bySys[r.systemKey] = bySys[r.systemKey] || []).push({ y: t.gross / t.targets, label: new Date(r.started).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), r, gross: t.gross }); });
  // zone distribution across all arrows
  const dist = { centre: 0, inner: 0, vital: 0, body: 0, miss: 0 }; let n = 0;
  rounds.forEach(r => { const p = r.players.find(p => p.name === who); Object.values(r.scores).forEach(by => (by[p.id] || []).forEach(z => { if (z) { dist[z]++; n++; } })); });
  const guess = rounds.filter(r => r.final?.guess).map(r => { const p = r.players.find(p => p.name === who); const g = r.final.guess[p.id]; return g?.calls ? g.absErr / g.calls : null; }).filter(v => v != null);
  const kings = rounds.filter(r => { const p = r.players.find(p => p.name === who); return r.final?.king?.king === p.id; }).length;
  return h('div', {}, topbar('Progress', 'Am I getting better?', () => go('home')),
    h('div', { class: 'page' },
      names.length ? h('select', { onchange: e => { state.progName = e.target.value; render(); } }, ...names.map(nm => h('option', { value: nm, selected: nm === who }, nm))) : h('p', { class: 'muted' }, 'Shoot a round first and your trend shows up here.'),
      ...Object.entries(bySys).map(([k, pts]) => {
        const first = pts[0].y, last = pts[pts.length - 1].y, delta = last - first;
        return h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', {}, SYSTEMS[k]?.name || k), pts.length > 1 ? h('span', { class: 'delta ' + (delta >= 0 ? 'up' : 'down'), style: 'flex:0 0 auto' }, `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)} pts/target`) : null),
          h('div', { class: 'row' }, h('div', { class: 'stat' }, h('div', { class: 'v' }, last.toFixed(1)), h('div', { class: 'k' }, 'Last avg / target')), h('div', { class: 'stat' }, h('div', { class: 'v' }, Math.max(...pts.map(p => p.gross))), h('div', { class: 'k' }, 'Best round')), h('div', { class: 'stat' }, h('div', { class: 'v' }, String(pts.length)), h('div', { class: 'k' }, 'Rounds'))),
          sparkline(pts.slice(-10)));
      }),
      n ? h('div', { class: 'card' }, h('h3', {}, `Where the arrows go · ${n} arrows`),
        h('div', { class: 'bars' }, ...['centre', 'inner', 'vital', 'body', 'miss'].map(z => h('i', { style: `width:${dist[z] / n * 100}%;background:var(--${z === 'miss' ? 'fg' : z})`, title: z }))),
        h('div', { class: 'row', style: 'font-size:12px' }, ...['centre', 'inner', 'vital', 'body', 'miss'].map(z => h('span', { class: 'pill' }, `${ZONE_LABEL[z]} ${Math.round(dist[z] / n * 100)}%`)))) : null,
      guess.length ? h('div', { class: 'card' }, h('h3', {}, 'Distance judging'), h('div', { class: 'row' }, h('div', { class: 'stat' }, h('div', { class: 'v' }, guess[guess.length - 1].toFixed(1) + ' m'), h('div', { class: 'k' }, 'Last avg error')), h('div', { class: 'stat' }, h('div', { class: 'v' }, Math.min(...guess).toFixed(1) + ' m'), h('div', { class: 'k' }, 'Best')))) : null,
      kings ? h('div', { class: 'card' }, h('div', { class: 'row' }, icon('crown', 'lg'), h('div', {}, h('b', {}, `King of the Castle ${kings}×`), h('small', { class: 'muted' }, 'rounds finished wearing the crown')))) : null));
}

// ---------- SETTINGS ----------
function settings() {
  const key = state.settingsKey || 'ifaa_hunting'; const base = SYSTEMS[key]; const table = state.pointsOverride[key] || base.table;
  return h('div', {}, topbar('Settings', 'Points per zone', () => go('home')),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('h3', {}, 'Scoring system'),
        h('select', { onchange: e => { state.settingsKey = e.target.value; render(); } }, ...Object.entries(SYSTEMS).map(([k, s]) => h('option', { value: k, selected: k === key }, s.name))),
        h('div', { class: 'muted', style: 'font-size:13px' }, base.desc + ' Edit below if your club scores differently.'),
        h('table', {}, h('tr', {}, h('th', {}, 'Arrow'), ...ZONES.map(z => h('th', { class: 'num' }, ZONE_LABEL[z]))),
          ...table.map((row, i) => h('tr', {}, h('td', {}, `${i + 1}`), ...ZONES.map(z => h('td', { class: 'num' }, h('input', { type: 'number', style: 'width:64px;min-height:40px;padding:0 6px;text-align:right', value: row[z], onchange: e => { const t = structuredClone(table); t[i][z] = parseInt(e.target.value) || 0; state.pointsOverride[key] = t; save(); } })))))),
        h('button', { class: 'ghost', onclick: () => { delete state.pointsOverride[key]; save(); render(); } }, 'Reset to default')),
      h('div', { class: 'card' }, h('h3', {}, 'Data'),
        h('div', { class: 'row' },
          h('button', { onclick: () => { const blob = new Blob([JSON.stringify({ history: state.history, courses: state.courses }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '3d-fun-round-backup.json'; a.click(); } }, 'Export backup'),
          h('button', { class: 'ghost', onclick: () => { if (confirmBox('Delete all rounds and courses on this phone?')) { state.history = []; state.courses = []; state.round = null; save(); toast('Cleared'); } } }, 'Clear all'))),
      h('button', { onclick: () => go('about') }, 'About, privacy & fair use'),
      h('p', { class: 'muted', style: 'font-size:12px' }, 'v0.2 · github.com/LazyMadigan/wicklow-archers-3d-fun-app')));
}
function about() {
  const P = (...k) => h('p', { style: 'margin:0' }, ...k);
  return h('div', {}, topbar('About', 'Privacy & fair use', () => go('settings')),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('h3', {}, 'Your data stays on your phone'),
        P('No accounts, no server, no analytics, no ads. Names, scores, courses and traced rings live in this phone\u2019s browser storage and are never sent anywhere. Sharing a summary image or copying tracing JSON is something you do, not something the app does.'),
        P(h('b', {}, 'Clear all'), ' in Settings deletes everything; there is no copy elsewhere, so export a backup first if you want one.')),
      h('div', { class: 'card' }, h('h3', {}, 'Free for any club'),
        P('Volunteer-built, open source (MIT). Use it, share the link, fork it, rebrand it. Please don\u2019t charge for it, bolt on tracking, or present it as an official federation scoring system \u2014 the points tables are editable because clubs differ.')),
      h('div', { class: 'card' }, h('h3', {}, 'Help: trace the rings'),
        P('Only some targets have their scoring rings traced. Tap ', h('b', {}, 'Trace scoring rings'), ' on the home screen, pick the animal, tap around the moulded lines, save. Then Copy JSON and send it in so every club gets it.'),
        h('button', { class: 'primary', onclick: () => location.href = 'tools/trace.html' }, 'Open the tracing tool')),
      h('div', { class: 'card' }, h('h3', {}, 'Target photos'),
        P('Greyscale manufacturer product photos (SRT, Eleven, Rinehart, Delta McKenzie) used only to identify the animal and show ring positions in a non-commercial club tool. Being replaced with our own photos. Any maker who\u2019d rather theirs weren\u2019t here: open an issue and it goes the same day.')),
      h('p', { class: 'muted', style: 'font-size:12px' }, 'Full text: PRIVACY.md, FAIR-USE.md and docs/MANUAL.md in the repository.')));
}

// ---------- boot ----------
fetch('targets/targets.json').then(r => r.json()).then(j => {
  LIB = j;
  // zones traced on this phone with tools/trace.html override the shipped ones
  const local = LS.get('wa.zones.local', {});
  LIB.targets.forEach(t => t.faces.forEach(f => { if (local[f.id]?.some(s => s.outer?.length > 2 || s.centre)) f.sets = local[f.id]; }));
  render();
}).catch(() => render());
