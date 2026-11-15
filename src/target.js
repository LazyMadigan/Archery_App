// Indoor & Field rounds + Profile. Views get UI helpers from app.js via init(ctx).
import { buildWorkbook } from './export.js';
import { PRESETS, valid as validColour, tokens as colourTokens } from './colours.js';
import { CLUBS, PROVINCES, isListed } from './clubs.js';
import { SCHEMES, BOWS, bowName, schemeFor, FACES, INDOOR_ROUNDS, INDOOR_DISTS, INDOOR_FACES, FIELD_ROUNDS, FIELD_DISTS, FIELD_FACES, scoreAt, valueOf, drawFace, schemeForFace, endTotal, tally, endsComplete, setPlay, kingEnds, roundKey, roundLabel } from './faces.js';

let C; // ctx: { h, icon, state, save, go, render, topbar, toast, confirmBox, uid, $ }
export function init(ctx) { C = ctx; return { tsetup, tplay, tboard, tsummary, profile, liveCard, historyItem, progressCards, startTarget, profileBadge, pbs, isTarget }; }
export const isTarget = r => r && (r.kind === 'indoor' || r.kind === 'field');

const KIND = { indoor: { title: 'Indoor', rounds: INDOOR_ROUNDS, dists: INDOOR_DISTS, faces: INDOOR_FACES, icon: 'rings' }, field: { title: 'Field', rounds: FIELD_ROUNDS, dists: FIELD_DISTS, faces: FIELD_FACES, icon: 'peg' } };

// ---------- profile ----------
export const myBows = p => { const b = Array.isArray(p?.bows) ? p.bows.filter(Boolean) : p?.bow ? [p.bow] : []; return b.length ? b : []; };
export const defaultBow = p => { const b = myBows(p); return b.includes(p?.lastBow) ? p.lastBow : b[0] || 'recurve'; };
export function profileBadge(onclick) {
  const { h, icon, state } = C; const p = state.profile || {};
  const inner = p.photo ? h('img', { src: p.photo, alt: '' }) : p.name ? h('span', {}, p.name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()) : icon('people');
  return h('button', { class: 'avatar', onclick, 'aria-label': 'Profile' }, inner);
}
function resizePhoto(file, cb) {
  const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); cb(c.toDataURL('image/jpeg', .82)); }; img.src = r.result; }; r.readAsDataURL(file);
}
export function pbs(name) {
  const { state } = C; const best = {};
  state.history.filter(isTarget).forEach(r => { const p = r.players.find(x => x.name === name); if (!p) return; const t = r.final?.tally?.[p.id]; if (!t) return; const k = roundKey(r) + '|' + (p.bow || 'recurve');
    if (!best[k] || t.total > best[k].total) best[k] = { total: t.total, xs: t.xs, label: `${roundLabel(r)} · ${bowName(p.bow)}`, date: r.started, kind: r.kind, max: r.ends * r.arrows * SCHEMES[r.scheme].max }; });
  return Object.values(best).sort((a, b) => b.date - a.date);
}
function profile() {
  const { h, icon, state, save, go, topbar, toast, confirmBox } = C; state.profile = state.profile || {};
  if (!state.pdraft) state.pdraft = JSON.parse(JSON.stringify(state.profile));
  const p = state.pdraft; const saved = state.profile;
  const dirty = () => JSON.stringify(p) !== JSON.stringify(saved);
  const markDirty = () => { const b = document.getElementById('pfSave'); if (b) { b.disabled = !dirty(); b.textContent = dirty() ? 'Save profile' : 'Saved'; } };
  const set = k => e => { p[k] = e.target.value; markDirty(); };
  const back = state.pback || 'home';
  const editing = !!state.pedit || !(saved.name || '').trim() || !!state.focusBooking;
  const leave = () => { if (dirty() && !confirmBox('Discard your unsaved changes?')) return; state.pdraft = null; state.pback = null; state.pedit = false; state.clubOther = false; C.applyColours(saved.colours); go(back); };
  const cancelEdit = () => { if (dirty() && !confirmBox('Discard your unsaved changes?')) return; state.pdraft = null; state.pedit = false; state.clubOther = false; C.applyColours(saved.colours); C.render(); };
  const commit = () => { const prevName = (saved.name || '').trim(); state.profile = JSON.parse(JSON.stringify(p)); if ((state.profile.name || '').trim()) state.onboarded = true; state.pdraft = null; state.pedit = false; state.clubOther = false; C.applyColours(state.profile.colours); save(); toast('Profile saved'); C.render(); };
  const field = (k, label, ph, type = 'text') => h('label', { class: 'fld' }, h('span', {}, label), h('input', { id: 'pf-' + k, type, inputmode: type === 'tel' ? 'numeric' : type === 'url' ? 'url' : undefined, autocapitalize: type === 'url' ? 'off' : undefined, placeholder: ph, value: p[k] || '', oninput: set(k) }));
  const name = (saved.name || '').trim();
  const hist = name ? state.history.filter(r => r.players.some(x => x.name === name)) : [];
  const byKind = { '3d': 0, indoor: 0, field: 0 }; hist.forEach(r => byKind[r.kind || '3d']++);
  const arrows = hist.reduce((n, r) => { const pl = r.players.find(x => x.name === name); if (isTarget(r)) return n + (r.final?.tally?.[pl.id]?.arrows || 0); return n + Object.values(r.scores || {}).reduce((a, by) => a + (by[pl.id] || []).filter(Boolean).length, 0); }, 0);
  const my = name ? pbs(name) : [];
  const best3d = name ? state.history.filter(r => !isTarget(r)).reduce((m, r) => { const pl = r.players.find(x => x.name === name); const t = pl && r.final?.totals?.[pl.id]; return t && t.gross > (m?.gross || -1) ? { gross: t.gross, r } : m; }, null) : null;
  const photoIn = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: e => { const f = e.target.files[0]; if (f) resizePhoto(f, d => { p.photo = d; C.render(); }); } });
  if (state.focusBooking) { state.focusBooking = false; setTimeout(() => { const el = document.getElementById('pf-booking'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 50); }
  const toSettings = () => { if (dirty() && !confirmBox('Discard your unsaved changes?')) return; state.pdraft = null; state.pedit = false; state.clubOther = false; C.applyColours(saved.colours); go('settings'); };
  return h('div', {}, topbar('Profile', dirty() ? 'Unsaved changes' : null, leave, h('button', { 'aria-label': 'Settings', onclick: toSettings }, icon('cog'))),
    h('div', { class: 'page' },
      !editing ? h('div', { class: 'card pview' },
        h('div', { class: 'avatar xl' }, saved.photo ? h('img', { src: saved.photo, alt: '' }) : icon('people', 'xl')),
        h('h2', {}, name), (saved.club || '').trim() ? h('div', { class: 'muted' }, saved.club) : null,
        h('dl', { class: 'pinfo' }, ...[['Bows I shoot', myBows(saved).map(b => BOWS.find(x => x[0] === b)?.[1]).filter(Boolean).join(', ')], ['Archery Ireland no.', saved.ai], ['Club', saved.club], ['Club number', saved.clubNo], ['Club colours', saved.colours ? (PRESETS.find(x => x[1] === saved.colours.c1 && x[2] === saved.colours.c2)?.[0] || 'Custom') : '']]
          .map(([k, v], i) => h('div', { class: i === 0 ? 'wide' : '' }, h('dt', {}, k), h('dd', { class: (v || '').toString().trim() ? '' : 'empty' }, k === 'Club colours' && saved.colours ? h('span', { class: 'swpair sm' }, h('i', { style: `background:${saved.colours.c1}` }), h('i', { style: `background:${saved.colours.c2}` })) : null, (v || '').toString().trim() || (k === 'Club colours' ? 'App default' : 'Not set'))))),
        h('small', { class: 'muted pstay' }, 'Stored only on this phone. Nothing is sent to us.'),
        h('div', { class: 'grid c2', style: 'width:100%' }, h('button', { id: 'pfEdit', onclick: () => { state.pedit = true; C.render(); } }, 'Edit details'), h('button', { id: 'pfSettings', onclick: toSettings }, icon('cog'), ' Settings'))) : null,
      editing ? h('div', { class: 'card', style: 'align-items:center;text-align:center' },
        h('div', { class: 'avatar xl', onclick: () => photoIn.click() }, p.photo ? h('img', { src: p.photo, alt: '' }) : icon('people', 'xl')), photoIn,
        h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'ghost', style: 'flex:0 0 auto', onclick: () => photoIn.click() }, p.photo ? 'Change photo' : 'Add photo'), p.photo ? h('button', { class: 'ghost', style: 'flex:0 0 auto;color:var(--danger)', onclick: () => { delete p.photo; C.render(); } }, 'Remove') : null)) : null,
      editing ? h('div', { class: 'card' }, h('h3', {}, 'Archer'),
        field('name', 'Name', 'Your name'),
        h('div', { class: 'fld', role: 'group', 'aria-label': 'Bows I shoot' }, h('span', {}, 'Bows I shoot'),
          h('div', { class: 'bowgrid' }, ...BOWS.map(([k, n]) => { const on = myBows(p).includes(k); return h('button', { class: 'bowchip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { const cur = myBows(p); p.bows = on ? cur.filter(x => x !== k) : [...cur, k]; delete p.bow; C.render(); } }, h('span', { class: 'chk' }, on ? icon('check') : null), h('span', { class: 'bowlbl' }, n)); })),
          h('small', { class: 'muted', style: 'font-size:12px;text-transform:none;letter-spacing:0;font-weight:500' }, myBows(p).length > 1 ? `Rounds start with the bow you shot last (${BOWS.find(b => b[0] === defaultBow(p))[1]}); change it per round in setup.` : 'Tick every bow you shoot. You can change it per round in setup.')),
        field('ai', 'Archery Ireland number', 'e.g. 12345', 'tel'),
        (() => { const club = (p.club || '').trim(); const other = state.clubOther || (club && !isListed(club));
          const cur = other ? '__other' : (CLUBS.find(c => c[0].toLowerCase() === club.toLowerCase())?.[0] || '');
          return h('div', { class: 'fld' }, h('span', {}, 'Club'),
            h('select', { id: 'pf-clubsel', 'aria-label': 'Club', onchange: e => { const v = e.target.value; if (v === '__other') { state.clubOther = true; if (isListed(p.club)) p.club = ''; } else { state.clubOther = false; p.club = v; } markDirty(); C.render(); if (v === '__other') setTimeout(() => document.getElementById('pf-club')?.focus(), 50); } },
              h('option', { value: '', selected: cur === '' }, 'Choose your club'),
              ...PROVINCES.map(pr => h('optgroup', { label: pr }, ...CLUBS.filter(c => c[2] === pr).map(([n, co]) => h('option', { value: n, selected: cur === n }, co ? `${n} (${co})` : n)))),
              h('option', { value: '__other', selected: cur === '__other' }, 'Other (type your club)')),
            other ? h('input', { id: 'pf-club', placeholder: 'Your club’s name', value: p.club || '', oninput: e => { p.club = e.target.value; markDirty(); } }) : null); })(),
        (() => { const cur = p.colours; const name = cur ? (PRESETS.find(x => x[1] === cur.c1 && x[2] === cur.c2)?.[0] || 'Custom') : 'App default';
          return h('div', { class: 'fld' }, h('span', {}, 'Club colours'),
            h('button', { id: 'pfColours', class: 'coltile', onclick: () => coloursSheet(p, () => { markDirty(); C.render(); }) },
              h('span', { class: 'swpair' }, h('i', { style: `background:${cur?.c1 || '#1d4fd8'}` }), h('i', { style: `background:${cur?.c2 || '#bcd4ff'}` })),
              h('span', { style: 'flex:1;text-align:left' }, name), h('small', { class: 'muted' }, 'Change'))); })(),
        field('clubNo', 'Club number', 'Membership no.', 'tel'), field('booking', 'Club booking link', 'https://…', 'url'),
        h('div', { class: 'muted', style: 'font-size:12px' }, 'Your name fills Player 1 automatically. Your club shows at the top of the home screen, and the booking link opens from the Booking tile. Nothing here leaves your phone.')) : null,
      name ? h('div', { class: 'card' }, h('h3', {}, 'Track record'),
        h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('div', { class: 'v' }, String(hist.length)), h('div', { class: 'k' }, 'Rounds')), h('div', { class: 'stat' }, h('div', { class: 'v' }, String(arrows)), h('div', { class: 'k' }, 'Arrows')), h('div', { class: 'stat' }, h('div', { class: 'v' }, `${byKind['3d']}/${byKind.indoor}/${byKind.field}`), h('div', { class: 'k' }, '3D/In/Field'))),
        my.length || best3d ? h('h3', { style: 'margin-top:6px' }, 'Personal bests') : h('div', { class: 'muted', style: 'font-size:13px' }, 'Finish a round and your personal bests show here.'),
        ...my.map(b => h('div', { class: 'pb' }, h('span', { class: 'pbk' }, icon(KIND[b.kind].icon)), h('div', { style: 'flex:1;min-width:0' }, h('b', {}, b.label), h('small', {}, new Date(b.date).toLocaleDateString())), h('div', { class: 'pbv' }, String(b.total), h('small', {}, `/${b.max}${b.xs ? ` · ${b.xs}X` : ''}`)))),
        best3d ? h('div', { class: 'pb' }, h('span', { class: 'pbk' }, icon('bow')), h('div', { style: 'flex:1' }, h('b', {}, '3D best round'), h('small', {}, `${best3d.r.targets.length} targets · ${new Date(best3d.r.started).toLocaleDateString()}`)), h('div', { class: 'pbv' }, String(best3d.gross))) : null,
        h('div', { class: 'row' }, h('button', { onclick: () => { state.progName = name; state.pdraft = null; go('progress'); } }, 'See progress'), h('button', { onclick: () => { state.pdraft = null; state.achBack = 'profile'; go('achievements'); } }, `Achievements ${C.achCount().join('/')}`))) : null,
      h('div', { class: 'card' }, h('div', { class: 'row' }, icon('share'), h('h3', {}, 'Export my data')),
        h('div', { class: 'muted', style: 'font-size:13px' }, 'One Excel file with your profile, every round, every arrow, your 3D targets, courses and sight marks. It includes a “Read me” sheet that explains the data, so you can give it to an AI and ask for coaching advice. Built on this phone; your photo isn’t included.'),
        h('div', { class: 'row' },
          h('button', { class: 'primary', id: 'xlBtn', onclick: async e => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Building…'; try { const x = await buildWorkbook(state, C.lib()); const a = document.createElement('a'); a.href = URL.createObjectURL(x.blob); a.download = x.name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); toast(`Exported ${x.counts.rounds} rounds`); } catch (err) { toast('Export failed: ' + err.message); } b.disabled = false; b.textContent = 'Export to Excel'; } }, 'Export to Excel'),
          navigator.canShare ? h('button', { onclick: async e => { const b = e.currentTarget; b.disabled = true; try { const x = await buildWorkbook(state, C.lib()); const f = new File([x.blob], x.name, { type: x.blob.type }); if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'My archery data' }); else toast('Sharing files isn’t supported here — use Export'); } catch (err) { if (err.name !== 'AbortError') toast('Share failed'); } b.disabled = false; } }, 'Share…') : null))),
      h('div', { class: 'card', id: 'privacy' }, h('h3', {}, 'Privacy & contact'),
        h('b', {}, 'Your data stays on this phone'),
        h('div', { class: 'muted', style: 'font-size:13px' }, 'No account, no server, no analytics, no ads. Your profile, photo, rounds and sight marks are stored only in this phone’s browser and are never sent to us.'),
        h('b', {}, 'GDPR'),
        h('div', { class: 'muted', style: 'font-size:13px' }, 'We don’t collect, receive or store any of your personal data, so there is no copy anywhere else to ask for or delete. You stay in control here: Export my data gives you a full copy, and Delete all my data erases everything from this phone.'),
        h('b', {}, 'What goes online'),
        h('div', { class: 'muted', style: 'font-size:13px' }, 'Opening the app loads it from GitHub Pages, the lettering comes from Google Fonts, and the news slide reads headlines from archery.ie. Those sites see an ordinary web visit (such as your IP address), as with any website. None of your archery data goes with it.'),
        h('div', { class: 'grid c2' },
          h('a', { class: 'button tile-link', href: 'https://github.com/LazyMadigan/Archery_App/issues', target: '_blank', rel: 'noopener' }, 'Contact us'),
          h('button', { onclick: () => { state.pdraft = null; state.pedit = false; state.aboutBack = 'profile'; go('about'); } }, 'About')),
        h('button', { class: 'ghost danger', id: 'pfWipe', onclick: () => {
          if (!confirmBox('Delete ALL your data from this phone? Profile, photo, rounds, courses, sight marks and settings. This can’t be undone.')) return;
          if (!confirmBox('Last check: delete everything? Export my data first if you want a copy.')) return;
          try { Object.keys(localStorage).filter(k => k.startsWith('wa.')).forEach(k => localStorage.removeItem(k)); } catch {}
          location.reload(); } }, 'Delete all my data')),
    editing ? h('div', { class: 'bottombar' }, (saved.name || '').trim() ? h('button', { style: 'flex:0 0 auto;padding:0 18px', onclick: cancelEdit }, 'Cancel') : null, h('button', { id: 'pfSave', class: 'primary', disabled: !dirty(), onclick: commit }, dirty() ? 'Save profile' : 'Saved')) : null);
}

function coloursSheet(p, changed) {
  const { h } = C; document.querySelector('.sheet-bg')?.remove();
  const before = p.colours ? { ...p.colours } : null;
  const close = keep => { if (!keep) { if (before) p.colours = before; else delete p.colours; C.applyColours(p.colours); } bg.remove(); changed(); };
  const body = h('div', { class: 'colbody' });
  const draw = () => { const cur = p.colours; const t = cur ? colourTokens(cur) : null; const setC = c => { if (c) p.colours = c; else delete p.colours; C.applyColours(p.colours); draw(); };
    body.replaceChildren(...[
      h('div', { class: 'swgrid' },
        h('button', { class: 'sw' + (!cur ? ' on' : ''), 'aria-pressed': !cur ? 'true' : 'false', onclick: () => setC(null) }, h('span', { class: 'swpair' }, h('i', { style: 'background:#1d4fd8' }), h('i', { style: 'background:#bcd4ff' })), h('span', {}, 'App default')),
        ...PRESETS.map(([n, a, b]) => { const on = cur && cur.c1 === a && cur.c2 === b; return h('button', { class: 'sw' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => setC({ c1: a, c2: b }) }, h('span', { class: 'swpair' }, h('i', { style: `background:${a}` }), h('i', { style: `background:${b}` })), h('span', {}, n)); })),
      h('div', { class: 'row swcustom' },
        h('label', {}, h('input', { type: 'color', 'aria-label': 'Main colour', value: cur?.c1 || '#1d4fd8', onchange: e => setC({ c1: e.target.value, c2: cur?.c2 || '#ffffff' }) }), h('small', {}, 'Main')),
        h('label', {}, h('input', { type: 'color', 'aria-label': 'Second colour', value: cur?.c2 || '#ffffff', onchange: e => setC({ c1: cur?.c1 || '#1d4fd8', c2: e.target.value }) }), h('small', {}, 'Second')),
        h('small', { class: 'muted', style: 'flex:1;font-size:12px' }, 'Or pick your own. The app previews it behind this.')),
      t && t.light.brand.toLowerCase() !== t.main.toLowerCase() ? h('small', { class: 'muted', style: 'font-size:12px' }, 'Shade adjusted slightly so text on buttons stays readable.') : null].filter(Boolean)); };
  draw();
  const bg = h('div', { class: 'sheet-bg', onclick: e => { if (e.target === bg) close(true); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Club colours' }, h('h2', {}, 'Club colours'), body,
      h('div', { class: 'sheet-actions' }, h('button', { class: 'ghost', onclick: () => close(false) }, 'Cancel'), h('button', { class: 'primary', id: 'colDone', onclick: () => close(true) }, 'Done'))));
  document.body.append(bg);
}

// ---------- setup ----------
export function startTarget(kind) {
  const { state, uid, go } = C; const R = KIND[kind].rounds[0]; const me = (state.profile?.name || '').trim();
  state.tdraft = { kind, roundKey: R.key, name: R.name, face: R.face, scheme: R.scheme, dist: R.dist, ends: R.ends, arrows: R.arrows, games: { total: true }, mode: 'fun', goal: '', players: [{ id: uid(), name: me, bow: defaultBow(state.profile) }] };
  go('tsetup');
}
function tsetup() {
  const { h, icon, state, go, topbar, uid, $ } = C; const d = state.tdraft; const K = KIND[d.kind]; const R = K.rounds.find(r => r.key === d.roundKey);
  const applyRound = r => Object.assign(d, { roundKey: r.key, name: r.name, face: r.face, scheme: r.scheme, dist: r.dist, ends: r.ends, arrows: r.arrows });
  const seg = (opts, cur, set, fmt = x => x) => h('div', { class: 'chips' + (opts.length <= 2 ? ' c2' : opts.length === 3 ? ' c3' : opts.length === 4 ? ' c4' : ' c4') }, ...opts.map(o => h('button', { class: o === cur ? 'on' : '', onclick: () => { set(o); C.render(); } }, fmt(o))));
  const practice = d.mode === 'practice';
  const canStart = () => d.players.some(x => x.name.trim()) && (d.mode !== 'practice' || !!(d.goal || '').trim());
  const goalHint = () => (d.goal || '').trim() ? 'Shown while you shoot and saved with the round.' : 'Write your goal to start. It stays on screen while you shoot.';
  const syncStart = () => { const b = $('#tStart'); if (b) b.disabled = !canStart(); const g = $('#tGoalHint'); if (g) g.textContent = goalHint(); };
  const playerRow = (p, i) => h('div', { class: 'row prow' }, h('input', { placeholder: `Player ${i + 1}`, value: p.name, list: 'names', oninput: e => { p.name = e.target.value; syncStart(); } }),
    h('select', { class: 'bowsel', 'aria-label': 'Bow', onchange: e => { p.bow = e.target.value; C.render(); } }, ...(() => { const mineFirst = p.name.trim() && p.name.trim() === (state.profile?.name || '').trim() ? [...BOWS.filter(b => myBows(state.profile).includes(b[0])), ...BOWS.filter(b => !myBows(state.profile).includes(b[0]))] : BOWS; return mineFirst.map(([k, n]) => h('option', { value: k, selected: (p.bow || 'recurve') === k }, n)); })()),
    h('button', { class: 'ghost', style: 'flex:0 0 44px', onclick: () => { d.players.splice(i, 1); C.render(); } }, '✕'));
  const sch = schemeForFace(d.kind, d.face, d.scheme);
  if (state._focusGoal) { state._focusGoal = false; setTimeout(() => { const el = $('#tGoal'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 50); }
  return h('div', {}, topbar(K.title, 'Set up', () => go('home')),
    h('datalist', { id: 'names' }, (state.names || []).map(n => h('option', { value: n }))),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('div', { class: 'row' }, icon('people'), h('h3', {}, 'Who’s shooting')), ...d.players.map(playerRow),
        h('button', { onclick: () => { d.players.push({ id: uid(), name: '', bow: 'recurve' }); C.render(); }, disabled: d.players.length >= 6 }, '+ Add player'),
        d.players.some(p => p.bow === 'compound') && ['wa10', 'spot'].includes(schemeForFace(d.kind, d.face, d.scheme)) ? h('div', { class: 'muted', style: 'font-size:12px' }, 'Compound scores 10 only in the inner ring (X10); the rest of the 10 ring counts 9. Recurve, barebow and traditional get the full 10.') : d.kind === 'field' && d.players.some(p => p.bow === 'barebow') ? h('div', { class: 'muted', style: 'font-size:12px' }, 'Field: barebow normally shoots from the blue peg, recurve and compound from red. Scoring is the same.') : null),
      h('div', { class: 'card' }, h('h3', {}, 'Round'),
        h('select', { onchange: e => { applyRound(K.rounds.find(r => r.key === e.target.value)); C.render(); } }, ...K.rounds.map(r => h('option', { value: r.key, selected: r.key === d.roundKey }, r.name))),
        h('div', { class: 'muted', style: 'font-size:13px' }, R.note),
        h('div', { class: 'optblock' }, h('span', { class: 'optlbl' }, 'Distance'), seg(K.dists, d.dist, v => d.dist = v, v => `${v} m`)),
        h('div', { class: 'optblock' }, h('span', { class: 'optlbl' }, 'Face'), seg(K.faces, d.face, v => d.face = v, v => v === '3spot' ? '3-spot' : FACES[v])),
        h('div', { class: 'optpair' },
          h('div', { class: 'optblock' }, h('span', { class: 'optlbl' }, d.kind === 'field' ? 'Targets' : 'Ends'), h('div', { class: 'stepper' }, h('button', { 'aria-label': 'Fewer', onclick: () => { d.ends = Math.max(1, d.ends - 1); C.render(); } }, '−'), h('b', {}, String(d.ends)), h('button', { 'aria-label': 'More', onclick: () => { d.ends = Math.min(60, d.ends + 1); C.render(); } }, '+'))),
          h('div', { class: 'optblock' }, h('span', { class: 'optlbl' }, 'Arrows'), seg(d.kind === 'field' ? [3, 4] : [3, 6], d.arrows, v => d.arrows = v))),
        h('div', { class: 'facepreview' }, drawFace(sch, { size: '120px' }), h('div', { class: 'muted', style: 'font-size:13px' }, `${SCHEMES[sch].name}`, h('br'), `${d.ends * d.arrows} arrows · ${d.ends * d.arrows * SCHEMES[sch].max} max`))),
      h('div', {}, h('h3', { style: 'margin:4px 0 8px' }, 'What are we doing'),
        h('div', { class: 'list' },
          h('div', { class: 'gamecard' + (!practice ? ' on' : ''), onclick: () => { d.mode = 'fun'; C.render(); } }, icon('trophy', 'lg'), h('div', {}, h('b', {}, 'Competition'), h('small', {}, 'Score against each other')), h('span', { class: 'chk' }, !practice ? icon('check') : null)),
          h('div', { class: 'gamecard' + (practice ? ' on' : ''), onclick: () => { if (practice) return; d.mode = 'practice'; d.games = { total: true }; state._focusGoal = true; C.render(); } }, icon('target', 'lg'), h('div', {}, h('b', {}, 'Practice'), h('small', {}, 'Set a goal for the session, then shoot')), h('span', { class: 'chk' }, practice ? icon('check') : null)))),
      practice ? h('div', { class: 'card', style: 'border-color:var(--brand);border-width:2px' },
        h('label', { class: 'fld' }, h('span', {}, 'Goal for this practice'),
          h('textarea', { id: 'tGoal', rows: 3, maxlength: 300, placeholder: 'e.g. Hold at full draw until the shot breaks; keep every arrow in the gold', value: d.goal || '', oninput: e => { d.goal = e.target.value; syncStart(); } })),
        h('small', { id: 'tGoalHint', class: 'muted', style: 'font-size:12px' }, goalHint())) : null,
      practice ? null : h('div', {}, h('h3', { style: 'margin:4px 0 8px' }, 'Game'),
        h('div', { class: 'list' }, ...[['total', 'rings', 'Total points', 'Highest total wins'], ['king', 'crown', 'King of the Castle', 'Best end takes the crown; hold it to stay King'], ['sets', 'trophy', 'Set play', 'Olympic match style: 2 points for winning an end, 1 each for a tie. First to 6 (head to head)']].map(([k, ic, n, desc]) =>
          h('div', { class: 'gamecard' + (d.games[k] ? ' on' : ''), onclick: () => { const was = d.games[k]; d.games = { [k]: true }; C.render(); if (!was) C.showRules?.('t_' + k); } }, icon(ic, 'lg'), h('div', {}, h('b', {}, n), h('small', {}, desc)), h('span', { class: 'chk' }, d.games[k] ? icon('check') : null)))))),
    h('div', { class: 'bottombar' }, h('button', { id: 'tStart', class: 'primary', disabled: !canStart(), onclick: () => { if (canStart()) startT(); } }, practice ? 'Start practice' : 'Start shooting')));
}
function startT() {
  const { state, save, go, uid } = C; const d = state.tdraft;
  const players = d.players.filter(p => p.name.trim()).map(p => ({ ...p, name: p.name.trim(), bow: p.bow || 'recurve' }));
  players.forEach(p => { if (!state.names.includes(p.name)) state.names.unshift(p.name); }); state.names = state.names.slice(0, 24);
  const meName = (state.profile?.name || '').trim(); const mine = players.find(p => p.name === meName); if (mine && state.profile) state.profile.lastBow = mine.bow;
  const scheme = schemeForFace(d.kind, d.face, d.scheme);
  state.tround = { id: uid(), kind: d.kind, started: Date.now(), roundKey: d.roundKey, name: d.name, face: d.face, scheme, dist: d.dist, ends: d.ends, arrows: d.arrows, games: d.mode === 'practice' ? { total: true } : d.games, ...(d.mode === 'practice' ? { mode: 'practice', goal: d.goal.trim() } : {}), players, scores: Object.fromEntries(players.map(p => [p.id, []])), end: 0 };
  state.tsel = null; save(); go('tplay');
}

// ---------- play ----------
function tplay() {
  const { h, icon, state, save, go, topbar } = C; const r = state.tround; if (!r) { go('home'); return h('div'); }
  const e = r.end; const sch = r.scheme;
  const endOf = p => (r.scores[p.id][e] = r.scores[p.id][e] || []);
  const doneP = p => endOf(p).filter(Boolean).length >= r.arrows;
  let active = r.players.find(p => p.id === state.tsel) || r.players.find(p => !doneP(p)) || r.players[0];
  const psch = schemeFor(sch, active.bow);
  const add = (v, x, y) => { const arr = endOf(active); if (arr.filter(Boolean).length >= r.arrows) return; arr.push({ v, x, y }); if (arr.length >= r.arrows) state.tsel = null; save(); C.render(); };
  const tal = tally(r);
  const face = drawFace(sch, { arrows: endOf(active).filter(s => s?.x != null), faded: r.scores[active.id].slice(0, e).flat().filter(s => s?.x != null), onTap: (x, y, rad) => add(scoreAt(psch, rad), x, y) });
  const btn = v => h('button', { class: 'vbtn v' + String(v).toLowerCase(), onclick: () => add(v) }, String(v));
  const rows = r.players.map(p => { const arr = endOf(p); return h('div', { class: 'player' + (p.id === active.id ? ' up' : ''), onclick: () => { state.tsel = p.id; C.render(); } },
    h('div', { class: 'name' }, p.name, h('small', { class: 'bowtag' }, bowName(p.bow)), p.id === active.id ? h('small', { class: 'upnow' }, 'shooting') : null),
    h('div', { class: 'arrows' }, ...Array.from({ length: r.arrows }, (_, i) => h('span', { class: arr[i] ? 'vc v' + String(arr[i].v).toLowerCase() : '', onclick: ev => { ev.stopPropagation(); if (arr[i]) { arr.splice(i, 1); state.tsel = p.id; save(); C.render(); } } }, arr[i] ? String(arr[i].v) : '·'))),
    h('div', { class: 'score', title: 'End / total' }, h('small', { class: 'muted', style: 'font-size:12px;font-weight:600;margin-right:6px' }, String(endTotal(sch, arr))), String(tal[p.id].total))); });
  const all = endsComplete(r, e); const last = e >= r.ends - 1;
  return h('div', {}, topbar(`${r.kind === 'field' ? 'Target' : 'End'} ${e + 1} of ${r.ends}`, `${r.name} · ${r.dist} m · ${FACES[r.face]}`, () => go('tboard')),
    h('div', { class: 'page sch-' + psch },
      r.goal ? goalBanner(r) : null,
      h('div', { class: 'facewrap' }, face, h('div', { class: 'muted', style: 'font-size:12px;text-align:center' }, `${active.name} · arrow ${Math.min(endOf(active).filter(Boolean).length + 1, r.arrows)} of ${r.arrows} — tap where it landed (or use the buttons; only tapped arrows show on your group)`)),
      h('div', { class: 'vbtns n' + SCHEMES[psch].buttons.length }, ...SCHEMES[psch].buttons.map(btn)),
      h('div', { class: 'card' }, ...rows)),
    h('div', { class: 'bottombar' },
      h('button', { style: 'flex:0 0 56px', disabled: e === 0, onclick: () => { r.end = Math.max(0, e - 1); state.tsel = null; state._top = true; save(); C.render(); } }, icon('back')),
      h('button', { style: 'flex:0 0 auto;padding:0 18px', onclick: () => go('tboard') }, 'Board'),
      h('button', { class: 'primary', disabled: !all, onclick: () => { if (last) { finishT(); return; } r.end = e + 1; state.tsel = null; state._top = true; save(); C.render(); } }, last ? 'Finish' : r.kind === 'field' ? 'Next target' : 'Next end')));
}

const goalBanner = r => { const { h, icon } = C; return h('div', { class: 'goalbar' }, icon('target'), h('div', {}, h('small', {}, 'Goal'), h('span', {}, r.goal))); };

// ---------- board / finish / summary ----------
function standings(r) {
  const tal = tally(r); const sp = r.games.sets ? setPlay(r) : null; const kg = r.games.king ? kingEnds(r) : null;
  const order = [...r.players].sort((a, b) => sp ? (sp.pts[b.id] - sp.pts[a.id] || tal[b.id].total - tal[a.id].total) : kg ? (kg.won[b.id] - kg.won[a.id] || tal[b.id].total - tal[a.id].total) : (tal[b.id].total - tal[a.id].total || tal[b.id].xs - tal[a.id].xs));
  return { tal, sp, kg, order };
}
function tboard() {
  const { h, icon, state, save, go, topbar, confirmBox } = C; const r = state.tround; if (!r) { go('home'); return h('div'); }
  const { tal, sp, kg, order } = standings(r);
  const table = h('table', {}, h('tr', {}, h('th', {}, 'Archer'), h('th', { class: 'num' }, 'Total'), h('th', { class: 'num' }, 'X'), h('th', { class: 'num' }, 'Avg'), sp ? h('th', { class: 'num' }, 'Sets') : null, kg ? h('th', { class: 'num' }, 'Ends') : null),
    ...order.map(p => h('tr', {}, h('td', {}, kg?.king === p.id ? h('span', { class: 'crown' }, '♛ ') : '', sp?.winner === p.id ? '🏆 ' : '', p.name, h('small', { class: 'muted', style: 'margin-left:6px;font-size:11px' }, bowName(p.bow))), h('td', { class: 'num' }, h('b', {}, String(tal[p.id].total))), h('td', { class: 'num' }, String(tal[p.id].xs)), h('td', { class: 'num' }, tal[p.id].avg.toFixed(2)), sp ? h('td', { class: 'num' }, String(sp.pts[p.id])) : null, kg ? h('td', { class: 'num' }, String(kg.won[p.id])) : null)));
  const ends = h('div', { class: 'endgrid', style: `grid-template-columns:auto repeat(${r.players.length},1fr)` }, h('b', {}, 'End'), ...r.players.map(p => h('b', {}, p.name.slice(0, 8))),
    ...Array.from({ length: r.ends }, (_, e) => [h('span', { class: 'muted' }, String(e + 1)), ...r.players.map(p => { const en = r.scores[p.id][e]; return h('span', { onclick: () => { r.end = e; save(); go('tplay'); } }, en?.length ? String(endTotal(r.scheme, en)) : '–'); })]).flat());
  return h('div', {}, topbar(r.mode === 'practice' ? 'Practice' : 'Scoreboard', roundLabel(r), () => go('home')),
    h('div', { class: 'page' }, r.goal ? goalBanner(r) : null, h('div', { class: 'card' }, table), h('div', { class: 'card' }, h('h3', {}, 'Ends'), ends)),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: () => go('tplay') }, 'Continue'), h('button', { onclick: () => { if (confirmBox('Finish and save this round?')) finishT(); } }, 'Finish & save'), h('button', { class: 'ghost', style: 'flex:0 0 auto;color:var(--danger)', onclick: () => { if (confirmBox('Delete this round? It will not be saved.')) { state.tround = null; save(); go('home'); } } }, 'Delete')));
}
function finishT() {
  const { state, save, go } = C; const r = state.tround; const { tal, sp, kg } = standings(r);
  r.final = { tally: tal, sets: sp, king: kg, ended: Date.now() }; state.history.unshift(r); state.tround = null; state.tlast = r; save(); go('tsummary'); C.achCheck?.();
}
function tsummary() {
  const { h, icon, state, save, go, topbar, confirmBox } = C; const r = state.tlast; if (!r) { go('home'); return h('div'); }
  const { tal, sp, kg, order } = standings(r); const max = r.ends * r.arrows * SCHEMES[r.scheme].max;
  const groups = order.map(p => h('div', { class: 'card', style: 'align-items:center' }, h('div', { class: 'row', style: 'width:100%' }, h('b', { style: 'font-family:var(--display);font-size:19px' }, p.name, h('small', { class: 'bowtag', style: 'margin-left:8px' }, bowName(p.bow))), h('span', { class: 'big', style: 'flex:0 0 auto;font-size:28px' }, String(tal[p.id].total), h('small', { class: 'muted', style: 'font-size:13px' }, ` / ${max}`))),
    h('div', { class: 'row', style: 'font-size:13px;width:100%' }, h('span', { class: 'pill' }, `${tal[p.id].xs} X`), h('span', { class: 'pill' }, `${tal[p.id].tens} × ${SCHEMES[r.scheme].max}`), h('span', { class: 'pill' }, `avg ${tal[p.id].avg.toFixed(2)}`), sp ? h('span', { class: 'pill' }, `${sp.pts[p.id]} set pts`) : null, kg ? h('span', { class: 'pill' }, `${kg.won[p.id]} ends${kg.king === p.id ? ' · King' : ''}`) : null),
    drawFace(r.scheme, { faded: (r.scores[p.id] || []).flat().filter(s => s?.x != null), size: '220px', label: 'Arrow group' })));
  const canvas = h('canvas', { width: 1080, height: 260 + order.length * 90, style: 'width:100%;height:auto;border-radius:12px;border:1px solid var(--line)' });
  setTimeout(() => { const x = canvas.getContext('2d'); const W = 1080; x.fillStyle = '#eef2fa'; x.fillRect(0, 0, W, canvas.height); x.fillStyle = C.brandImg(); x.fillRect(0, 0, W, 130); x.fillStyle = '#fff'; x.font = 'bold 44px system-ui'; x.fillText(`${r.kind === 'field' ? 'Field' : 'Indoor'}${r.mode === 'practice' ? ' practice' : ''} · ${r.name}`, 40, 70); x.font = '24px system-ui'; x.fillText(`${new Date(r.started).toLocaleDateString()} · ${r.dist} m · ${FACES[r.face]} · ${r.ends * r.arrows} arrows`, 40, 108);
    let y = 200; order.forEach((p, i) => { x.fillStyle = '#121a2e'; x.font = 'bold 38px system-ui'; x.fillText(`${i + 1}. ${p.name} (${bowName(p.bow)})`, 40, y); x.textAlign = 'right'; x.fillText(`${tal[p.id].total}`, W - 40, y); x.textAlign = 'left'; x.font = '22px system-ui'; x.fillStyle = '#5a6680'; x.fillText(`${tal[p.id].xs} X · avg ${tal[p.id].avg.toFixed(2)}${sp ? ` · ${sp.pts[p.id]} set pts` : ''}${kg ? ` · ${kg.won[p.id]} ends` : ''} · of ${max}`, 40, y + 32); y += 90; }); }, 0);
  return h('div', {}, topbar('Round summary', new Date(r.started).toLocaleDateString(), () => go('home')),
    h('div', { class: 'page' },
      r.goal ? h('div', { class: 'card', style: 'border-color:var(--brand);border-width:2px' }, goalBanner(r),
        h('label', { class: 'fld' }, h('span', {}, 'How did it go?'), h('textarea', { rows: 3, maxlength: 500, placeholder: 'Did you hit your goal? What to work on next time', value: r.review || '', oninput: e => { r.review = e.target.value; save(); } }))) : null,
      canvas,
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => { const a = document.createElement('a'); a.download = `${r.kind}-${new Date(r.started).toISOString().slice(0, 10)}.png`; a.href = canvas.toDataURL('image/png'); a.click(); } }, 'Save image'),
        navigator.share ? h('button', { onclick: () => canvas.toBlob(async b => { try { await navigator.share({ files: [new File([b], 'round.png', { type: 'image/png' })], title: r.name }); } catch {} }) }, 'Share') : null),
      ...groups,
      h('div', { class: 'row' }, h('button', { onclick: () => go('progress') }, 'See my progress'), h('button', { onclick: () => go('home') }, 'Home'),
        h('button', { class: 'ghost', style: 'flex:0 0 auto;color:var(--danger)', onclick: () => { if (confirmBox('Delete this saved round?')) { state.history = state.history.filter(x => x !== r); state.tlast = null; save(); go('home'); } } }, 'Delete'))));
}

// ---------- pieces used by app.js ----------
function liveCard() {
  const { h, icon, state, save, go, confirmBox } = C; const r = state.tround; if (!r) return null;
  const done = r.players.length ? Math.min(...r.players.map(p => (r.scores[p.id] || []).filter(e => e?.length >= r.arrows).length)) : 0;
  return h('div', { class: 'live' },
    h('div', { class: 'live-head' }, h('span', { class: 'live-badge' }, icon(KIND[r.kind].icon, 'lg')), h('div', { style: 'flex:1;min-width:0' }, h('div', { class: 'live-title' }, `${KIND[r.kind].title} ${r.mode === 'practice' ? 'practice' : 'round'} in progress`), h('div', { class: 'live-sub' }, roundLabel(r))), h('span', { class: 'live-dot' })),
    h('div', { class: 'live-players' }, ...r.players.map(p => h('span', { class: 'pill' }, p.name))),
    h('div', { class: 'live-prog' }, h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(done / r.ends * 100)}%` })), h('span', {}, `${done} of ${r.ends} ${r.kind === 'field' ? 'targets' : 'ends'}`)),
    h('div', { class: 'grid c2' }, h('button', { class: 'primary', onclick: () => go('tplay') }, 'Continue'), h('button', { onclick: () => go('tboard') }, 'Scoreboard'),
      h('button', { onclick: () => { if (confirmBox('Stop here and save the round?')) finishT(); } }, 'Stop & save'), h('button', { class: 'ghost', style: 'color:var(--danger)', onclick: () => { if (confirmBox('Delete this round? It will not be saved.')) { state.tround = null; save(); C.render(); } } }, 'Delete')));
}
function historyItem(r) {
  const { h, icon, state, go } = C; const tal = r.final?.tally || {};
  return h('div', { class: 'item', onclick: () => { state.tlast = r; go('tsummary'); } }, icon(KIND[r.kind].icon), h('div', { class: 't' }, r.players.map(p => `${p.name} ${tal[p.id]?.total ?? ''}`).join(' · '), h('small', {}, `${new Date(r.started).toLocaleDateString()} · ${r.mode === 'practice' ? 'Practice · ' : ''}${roundLabel(r)}`), r.goal ? h('small', {}, `Goal: ${r.goal}`) : null));
}
function progressCards(who) {
  const { h, icon, state } = C; const out = [];
  const rounds = state.history.filter(r => isTarget(r) && r.players.some(p => p.name === who)).slice().reverse();
  const groups = {}; rounds.forEach(r => { const k = roundKey(r) + '|' + (r.players.find(x => x.name === who).bow || 'recurve'); (groups[k] = groups[k] || []).push(r); });
  Object.values(groups).forEach(rs => {
    const pts = rs.map(r => { const p = r.players.find(x => x.name === who); return { y: r.final.tally[p.id].total, label: new Date(r.started).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) }; });
    const first = pts[0].y, last = pts[pts.length - 1].y, d = last - first; const r0 = rs[rs.length - 1]; const max = r0.ends * r0.arrows * SCHEMES[r0.scheme].max;
    const arrows = rs.slice(-5).flatMap(r => { const p = r.players.find(x => x.name === who); return (r.scores[p.id] || []).flat().filter(s => s?.x != null); });
    out.push(h('div', { class: 'card' }, h('div', { class: 'row' }, icon(KIND[r0.kind].icon), h('h3', { style: 'flex:1' }, `${roundLabel(r0)} · ${bowName(r0.players.find(x => x.name === who).bow)}`), pts.length > 1 ? h('span', { class: 'delta ' + (d >= 0 ? 'up' : 'down'), style: 'flex:0 0 auto' }, `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}`) : null),
      h('div', { class: 'row' }, h('div', { class: 'stat' }, h('div', { class: 'v' }, String(last)), h('div', { class: 'k' }, 'Last')), h('div', { class: 'stat' }, h('div', { class: 'v' }, String(Math.max(...pts.map(p => p.y)))), h('div', { class: 'k' }, `PB / ${max}`)), h('div', { class: 'stat' }, h('div', { class: 'v' }, String(pts.length)), h('div', { class: 'k' }, 'Rounds'))),
      C.sparkline(pts.slice(-10)),
      arrows.length ? h('div', { class: 'facepreview' }, drawFace(r0.scheme, { faded: arrows, size: '140px' }), h('div', { class: 'muted', style: 'font-size:13px' }, `Your group over the last ${Math.min(5, rs.length)} round${rs.length > 1 ? 's' : ''}`, h('br'), `${arrows.length} arrows`)) : null));
  });
  return out;
}
