// Sight marks: per-bow sight charts. Shoot a few arrows at each distance you have a target at,
// record the sight setting, and the app fits a curve and builds a sight mark chart you can save as an image or Excel file.
import { BOWS, bowName } from './faces.js';
import { loadXLSX } from './export.js';

let C; // ctx: { h, icon, state, save, go, render, topbar, toast, confirmBox, uid, $ }
export function init(ctx) { C = ctx; return { sight, schart, ssetup, splay }; }

// ---------- maths ----------
export function sightFit(pts) { // least squares quadratic s = a d^2 + b d + c (falls back to linear / none)
  if (pts.length < 2) return null;
  const n = pts.length; const S = k => pts.reduce((a, p) => a + p.d ** k, 0); const T = k => pts.reduce((a, p) => a + p.s * p.d ** k, 0);
  if (n < 3 || new Set(pts.map(p => p.d)).size < 3) { const b = (T(1) - S(1) * T(0) / n) / (S(2) - S(1) ** 2 / n || 1); const c = (T(0) - b * S(1)) / n; return d => b * d + c; }
  const A = [[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), n]], B = [T(2), T(1), T(0)];
  for (let i = 0; i < 3; i++) { let m = i; for (let k = i + 1; k < 3; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k; [A[i], A[m]] = [A[m], A[i]]; [B[i], B[m]] = [B[m], B[i]]; if (Math.abs(A[i][i]) < 1e-9) return null;
    for (let k = i + 1; k < 3; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < 3; j++) A[k][j] -= f * A[i][j]; B[k] -= f * B[i]; } }
  const x = [0, 0, 0]; for (let i = 2; i >= 0; i--) { x[i] = (B[i] - (i < 2 ? A[i][i + 1] * x[i + 1] : 0) - (i < 1 ? A[i][i + 2] * x[i + 2] : 0)) / A[i][i]; }
  return d => x[0] * d * d + x[1] * d + x[2];
}
const r1 = v => Math.round(v * 10) / 10;
const fmt = v => (Math.round(v * 10) / 10).toString();
export const DISTS = [5, 10, 15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90];
// The chart rows: every 5 m across the measured range, plus every measured distance.
export function chartRows(chart) {
  const m = [...chart.marks].sort((a, b) => a.d - b.d); if (!m.length) return [];
  const f = sightFit(m.map(x => ({ d: x.d, s: x.s })));
  const ds = new Set(m.map(x => x.d)); if (f) for (let d = Math.ceil(m[0].d / 5) * 5; d <= m[m.length - 1].d; d += 5) ds.add(d);
  return [...ds].sort((a, b) => a - b).map(d => { const mk = m.find(x => x.d === d); return { d, s: mk ? mk.s : r1(f(d)), measured: !!mk }; });
}
const calls = c => { const n = { high: 0, on: 0, low: 0 }; (c || []).forEach(x => n[x]++); return n; };
const advice = c => { const n = calls(c); const tot = n.high + n.on + n.low; if (!tot) return ''; if (n.high > n.on && n.high > n.low) return 'Group high: move your sight up, then shoot again.'; if (n.low > n.on && n.low > n.high) return 'Group low: move your sight down, then shoot again.'; return n.on === tot ? 'All on. Save this mark.' : 'Mostly on. Save this mark, or adjust and shoot again.'; };
const charts = () => (C.state.sight = C.state.sight || []);
const chartOf = id => charts().find(c => c.id === id);
const title = c => c.bow + (c.note ? ` · ${c.note}` : '');
const fileBase = c => `sight-marks-${c.bow.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bow'}`;

// ---------- drawing ----------
function chartSVG(chart, hgt = 190) {
  const ns = 'http://www.w3.org/2000/svg'; const w = 320; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`); svg.setAttribute('class', 'spark'); svg.style.height = hgt + 'px';
  const mk = (t, a) => { const e = document.createElementNS(ns, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const pts = chart.marks; if (!pts.length) return svg; const f = sightFit(pts);
  const dmin = Math.max(0, Math.floor(Math.min(...pts.map(p => p.d)) / 10) * 10), dmax = Math.max(dmin + 10, Math.ceil(Math.max(...pts.map(p => p.d)) / 10) * 10);
  const sv = pts.map(p => p.s); const pad = Math.max(1, (Math.max(...sv) - Math.min(...sv)) * 0.15); const smin = Math.floor(Math.min(...sv) - pad), smax = Math.ceil(Math.max(...sv) + pad);
  const X = d => 30 + (d - dmin) / (dmax - dmin) * (w - 42), Y = s => hgt - 20 - (s - smin) / (smax - smin || 1) * (hgt - 32);
  for (let d = dmin; d <= dmax; d += 10) { svg.append(mk('line', { class: 'grid', x1: X(d), x2: X(d), y1: 10, y2: hgt - 20 })); const t = mk('text', { x: X(d), y: hgt - 6, 'text-anchor': 'middle' }); t.textContent = d; svg.append(t); }
  [smin, r1((smin + smax) / 2), smax].forEach(s => { const t = mk('text', { x: 2, y: Y(s) + 4 }); t.textContent = s; svg.append(t); });
  if (f) { const a = Math.min(...pts.map(p => p.d)), b = Math.max(...pts.map(p => p.d)); let d = ''; for (let x = a; x <= b; x += 0.5) d += `${d ? 'L' : 'M'}${X(x)},${Y(f(x))} `; svg.append(mk('path', { class: 'line', d })); }
  pts.forEach(p => svg.append(mk('circle', { class: 'dot', cx: X(p.d), cy: Y(p.s), r: 4.5 })));
  return svg;
}
// The shareable card: a portrait image with the curve and a big, readable distance → setting table.
function drawCard(chart) {
  const rows = chartRows(chart); const W = 1080, cols = 2, per = Math.ceil(rows.length / cols), rowH = 64;
  const H = 360 + 420 + 70 + per * rowH + 110; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const me = (C.state.profile?.name || '').trim();
  const B = C.brandImg ? C.brandImg() : '#1d4fd8'; x.fillStyle = '#eef2fa'; x.fillRect(0, 0, W, H); x.fillStyle = B; x.fillRect(0, 0, W, 210);
  x.fillStyle = '#fff'; x.font = 'bold 30px system-ui'; x.fillText('SIGHT MARKS', 48, 62); x.font = 'bold 60px system-ui'; x.fillText(chart.bow.slice(0, 26), 48, 132);
  x.font = '28px system-ui'; x.fillText([bowName(chart.type), chart.note, me, new Date(chart.updated || chart.created).toLocaleDateString()].filter(Boolean).join(' · ').slice(0, 64), 48, 182);
  // plot
  const px = 110, py = 260, pw = W - 170, ph = 420; const pts = chart.marks; const f = sightFit(pts);
  x.fillStyle = '#fff'; x.fillRect(48, 236, W - 96, ph + 90);
  if (pts.length) {
    const dmin = Math.max(0, Math.floor(Math.min(...pts.map(p => p.d)) / 10) * 10), dmax = Math.max(dmin + 10, Math.ceil(Math.max(...pts.map(p => p.d)) / 10) * 10);
    const sv = pts.map(p => p.s); const pad = Math.max(1, (Math.max(...sv) - Math.min(...sv)) * 0.15); const smin = Math.floor(Math.min(...sv) - pad), smax = Math.ceil(Math.max(...sv) + pad);
    const X = d => px + (d - dmin) / (dmax - dmin) * pw, Y = s => py + ph - (s - smin) / (smax - smin || 1) * ph;
    x.strokeStyle = '#d8deea'; x.lineWidth = 2; x.fillStyle = '#5a6680'; x.font = '24px system-ui'; x.textAlign = 'center';
    for (let d = dmin; d <= dmax; d += 10) { x.beginPath(); x.moveTo(X(d), py); x.lineTo(X(d), py + ph); x.stroke(); x.fillText(`${d} m`, X(d), py + ph + 38); }
    x.textAlign = 'right'; [smin, r1((smin + smax) / 2), smax].forEach(s => x.fillText(String(s), px - 14, Y(s) + 8)); x.textAlign = 'left';
    if (f) { const a = Math.min(...pts.map(p => p.d)), b = Math.max(...pts.map(p => p.d)); x.strokeStyle = B; x.lineWidth = 5; x.beginPath(); for (let d = a; d <= b; d += 0.5) d === a ? x.moveTo(X(d), Y(f(d))) : x.lineTo(X(d), Y(f(d))); x.stroke(); }
    pts.forEach(p => { x.fillStyle = B; x.beginPath(); x.arc(X(p.d), Y(p.s), 11, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(X(p.d), Y(p.s), 5, 0, 7); x.fill(); });
  }
  // table
  let ty = 236 + ph + 90 + 60; x.fillStyle = '#121a2e'; x.font = 'bold 30px system-ui'; x.fillText('Distance → setting', 48, ty); ty += 24;
  rows.forEach((r, i) => { const c = Math.floor(i / per), k = i % per; const cx = 48 + c * ((W - 96) / cols), cy = ty + k * rowH; const cw = (W - 96) / cols - 16;
    x.fillStyle = k % 2 ? '#e4e9f4' : '#fff'; x.fillRect(cx, cy, cw, rowH - 6);
    x.fillStyle = '#121a2e'; x.font = `${r.measured ? 'bold ' : ''}34px system-ui`; x.fillText(`${r.d} m`, cx + 22, cy + 42); x.textAlign = 'right'; x.fillText(fmt(r.s), cx + cw - 22, cy + 42); x.textAlign = 'left'; });
  x.fillStyle = '#5a6680'; x.font = '24px system-ui'; x.fillText('Bold = shot and marked. Others read off the fitted curve, so check them on the range.', 48, H - 50);
  return cv;
}

// ---------- exports ----------
const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
async function share(blob, name, label) { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: label }); } catch {} } else download(blob, name); }
export async function chartsWorkbook(list, me) {
  const XLSX = await loadXLSX(); const wb = XLSX.utils.book_new(); const used = new Set();
  const sheetName = s => { let n = s.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28).trim() || 'Bow', b = n, i = 2; while (used.has(n.toLowerCase())) n = `${b.slice(0, 25)} ${i++}`; used.add(n.toLowerCase()); return n; };
  list.forEach(c => {
    const rows = [['Bow', c.bow], ['Type', bowName(c.type)], ['Note', c.note || ''], ['Archer', me || ''], ['Updated', new Date(c.updated || c.created).toISOString().slice(0, 10)], [],
      ['Distance (m)', 'Sight setting', 'Source'], ...chartRows(c).map(r => [r.d, r.s, r.measured ? 'Shot' : 'Fitted curve'])];
    const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }]; XLSX.utils.book_append_sheet(wb, ws, sheetName(c.bow + (c.note ? ' ' + c.note : '')));
  });
  const marks = [['Bow', 'Note', 'Distance (m)', 'Sight setting', 'Arrows high', 'Arrows on', 'Arrows low', 'Date']];
  list.forEach(c => [...c.marks].sort((a, b) => a.d - b.d).forEach(m => { const n = calls(m.calls); marks.push([c.bow, c.note || '', m.d, m.s, n.high, n.on, n.low, m.at ? new Date(m.at).toISOString().slice(0, 10) : '']); }));
  const ws = XLSX.utils.aoa_to_sheet(marks); ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]; XLSX.utils.book_append_sheet(wb, ws, 'All marks');
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const busy = (fn) => async e => { const b = e.currentTarget, t = b.textContent; b.disabled = true; b.textContent = 'Building…'; try { await fn(); } catch (err) { C.toast(err.message || 'Something went wrong'); } b.disabled = false; b.textContent = t; };

// ---------- views ----------
function sight() {
  const { h, icon, state, go, topbar } = C; const list = charts();
  const me = (state.profile?.name || '').trim();
  const day = t => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const sighted = c => c.marks.length ? Math.max(...c.marks.map(m => m.at || c.updated || c.created)) : null;
  const types = [...BOWS.map(b => b[0]), ...new Set(list.map(c => c.type).filter(t => !BOWS.some(b => b[0] === t)))].filter(t => list.some(c => (c.type || 'recurve') === t));
  return h('div', {}, topbar('Sight marks', 'A chart for every bow', () => go('home')),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('div', { class: 'muted', style: 'font-size:14px' }, 'Tell the app the distances you have targets at, shoot a few arrows at each, and enter your sight setting once the group is on. It fits a curve and builds a sight mark chart you can save as an image or Excel file.')),
      ...types.map(t => h('div', {}, h('h3', { style: 'margin:4px 0 8px' }, bowName(t)),
        h('div', { class: 'list' }, ...list.filter(c => (c.type || 'recurve') === t).sort((a, b) => (sighted(b) || b.created) - (sighted(a) || a.created)).map(c => h('button', { class: 'disc schart-item', onclick: () => { state.sc = c.id; go('schart'); } },
          h('span', { class: 'disc-ic' }, icon('ruler', 'lg')),
          h('div', { style: 'flex:1;min-width:0' }, h('b', {}, c.bow + (c.note ? ` · ${c.note}` : '')),
            h('small', {}, c.marks.length ? `Sighted ${day(sighted(c))} · ${c.marks.length} mark${c.marks.length > 1 ? 's' : ''}, ${c.marks.length > 1 ? `${Math.min(...c.marks.map(m => m.d))}–${Math.max(...c.marks.map(m => m.d))}` : c.marks[0].d} m` : `Created ${day(c.created)} · no marks yet`)),
          h('span', { class: 'disc-go' }, icon('back'))))))),
      list.length ? null : h('div', { class: 'muted', style: 'text-align:center;font-size:14px' }, 'No sight charts yet.'),
      list.length > 1 ? h('button', { onclick: busy(async () => download(await chartsWorkbook(list, me), `sight-marks-all-bows-${new Date().toISOString().slice(0, 10)}.xlsx`)) }, 'Export all charts to Excel') : null),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: () => { state.sform = { id: null, bow: '', type: (state.profile?.lastBow) || 'recurve', note: '', dists: [10, 20, 30, 40, 50], arrows: 3 }; go('ssetup'); } }, '+ New sight chart')));
}

// ---------- editing sheets ----------
function sheet(title, body, actions) {
  const { h } = C; document.querySelector('.sheet-bg')?.remove();
  const close = () => bg.remove();
  const bg = h('div', { class: 'sheet-bg', onclick: e => { if (e.target === bg) close(); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('h2', {}, title), ...body, h('div', { class: 'sheet-actions' }, ...actions(close))));
  document.body.append(bg); setTimeout(() => bg.querySelector('input')?.focus(), 60); return close;
}
function editMark(c, d, measured, current) {
  const { h, save, confirmBox } = C; let val = current;
  const commit = close => { if (val == null || isNaN(val)) { C.toast('Enter a setting'); return; } c.marks = c.marks.filter(m => m.d !== d); c.marks.push({ d, s: val, calls: [], at: Date.now() }); c.marks.sort((a, b) => a.d - b.d); c.updated = Date.now(); save(); close(); C.render(); C.toast(`${d} m saved`); };
  sheet(`${d} m`, [
    h('label', { class: 'fld' }, h('span', {}, 'Sight setting'), h('input', { id: 'smEdit', type: 'number', inputmode: 'decimal', step: 'any', value: current ?? '', oninput: e => { val = e.target.value === '' ? null : parseFloat(e.target.value); } })),
    h('small', { class: 'muted' }, measured ? 'This is a mark you shot. Change it, or delete it.' : 'This setting comes from the curve. Save it to make it a mark.')],
    close => [
      measured ? h('button', { class: 'ghost danger', onclick: () => { if (!confirmBox(`Delete the ${d} m mark?`)) return; c.marks = c.marks.filter(m => m.d !== d); c.updated = Date.now(); save(); close(); C.render(); C.toast(`${d} m deleted`); } }, 'Delete mark') : h('button', { class: 'ghost', onclick: close }, 'Cancel'),
      h('button', { class: 'primary', onclick: () => commit(close) }, measured ? 'Save' : 'Save as mark')]);
}
function editChart(c) {
  const { h, state, save, go, confirmBox } = C; const f = { bow: c.bow, type: c.type || 'recurve', note: c.note || '' };
  sheet('Chart details', [
    h('label', { class: 'fld' }, h('span', {}, 'Bow name'), h('input', { id: 'scBow', value: f.bow, placeholder: 'e.g. 30lb Hoyt', oninput: e => { f.bow = e.target.value; } })),
    h('label', { class: 'fld' }, h('span', {}, 'Type'), h('select', { onchange: e => { f.type = e.target.value; } }, ...BOWS.map(([k, n]) => h('option', { value: k, selected: f.type === k }, n)))),
    h('label', { class: 'fld' }, h('span', {}, 'Note (optional)'), h('input', { value: f.note, placeholder: 'e.g. indoor arrows, new string', oninput: e => { f.note = e.target.value; } })),
    h('button', { class: 'ghost danger', style: 'align-self:flex-start;padding:0', onclick: () => { if (!confirmBox(`Delete the sight chart for ${title(c)}? This can't be undone.`)) return; state.sight = charts().filter(x => x !== c); save(); document.querySelector('.sheet-bg')?.remove(); go('sight'); C.toast('Chart deleted'); } }, 'Delete this chart')],
    close => [h('button', { class: 'ghost', onclick: close }, 'Cancel'),
      h('button', { class: 'primary', onclick: () => { if (!f.bow.trim()) { C.toast('Give the bow a name'); return; } Object.assign(c, { bow: f.bow.trim(), type: f.type, note: f.note.trim(), updated: Date.now() }); save(); close(); C.render(); C.toast('Chart updated'); } }, 'Save')]);
}

function ssetup() {
  const { h, icon, state, go, topbar, $ } = C; const f = state.sform; if (!f) { go('sight'); return h('div'); }
  const existing = f.id ? chartOf(f.id) : null; const bows = [...new Set(charts().map(c => c.bow))];
  const ok = () => f.bow.trim() && f.dists.length;
  const sync = () => { const b = $('#sStart'); if (b) b.disabled = !ok(); };
  const extra = f.dists.filter(d => !DISTS.includes(d));
  return h('div', {}, topbar(existing ? 'Shoot sight marks' : 'New sight chart', existing ? title(existing) : 'Set up', () => go(existing ? 'schart' : 'sight')),
    h('datalist', { id: 'sbows' }, bows.map(b => h('option', { value: b }))),
    h('div', { class: 'page' },
      h('div', { class: 'card' }, h('div', { class: 'row' }, icon('bow'), h('h3', {}, 'Bow')),
        h('label', { class: 'fld' }, h('span', {}, 'Bow name'), h('input', { id: 'sBow', list: 'sbows', placeholder: 'e.g. 30lb Hoyt', value: f.bow, oninput: e => { f.bow = e.target.value; sync(); } })),
        h('label', { class: 'fld' }, h('span', {}, 'Type'), h('select', { onchange: e => { f.type = e.target.value; } }, ...BOWS.map(([k, n]) => h('option', { value: k, selected: f.type === k }, n)))),
        h('label', { class: 'fld' }, h('span', {}, 'Note (optional)'), h('input', { placeholder: 'e.g. indoor arrows, new string', value: f.note, oninput: e => { f.note = e.target.value; } }))),
      h('div', { class: 'card' }, h('div', { class: 'row' }, icon('ruler'), h('h3', {}, 'Distances you have targets at')),
        h('div', { class: 'chips c4' }, ...[...DISTS, ...extra].sort((a, b) => a - b).map(d => h('button', { class: f.dists.includes(d) ? 'on' : '', 'aria-pressed': f.dists.includes(d) ? 'true' : 'false', onclick: () => { f.dists = f.dists.includes(d) ? f.dists.filter(x => x !== d) : [...f.dists, d].sort((a, b) => a - b); C.render(); } }, `${d} m`))),
        h('div', { class: 'row' }, h('input', { id: 'sAddD', type: 'number', inputmode: 'decimal', placeholder: 'Other distance (m)' }), h('button', { style: 'flex:0 0 auto;padding:0 18px', onclick: () => { const v = parseFloat($('#sAddD').value); if (v > 0 && v <= 150 && !f.dists.includes(v)) { f.dists = [...f.dists, v].sort((a, b) => a - b); C.render(); } } }, 'Add')),
        h('small', { class: 'muted', style: 'font-size:12px' }, `${f.dists.length} distance${f.dists.length === 1 ? '' : 's'} picked. Three or more spread out gives the best curve.`)),
      h('div', { class: 'card' }, h('div', { class: 'optblock' }, h('span', { class: 'optlbl' }, 'Arrows at each distance'),
        h('div', { class: 'stepper' }, h('button', { 'aria-label': 'Fewer', onclick: () => { f.arrows = Math.max(1, f.arrows - 1); C.render(); } }, '−'), h('b', {}, String(f.arrows)), h('button', { 'aria-label': 'More', onclick: () => { f.arrows = Math.min(12, f.arrows + 1); C.render(); } }, '+'))))),
    h('div', { class: 'bottombar' }, h('button', { id: 'sStart', class: 'primary', disabled: !ok(), onclick: () => {
      if (!ok()) return; const now = Date.now(); let c = existing;
      if (!c) { c = { id: C.uid(), bow: f.bow.trim(), type: f.type, note: f.note.trim(), created: now, updated: now, marks: [] }; charts().unshift(c); } else Object.assign(c, { bow: f.bow.trim(), type: f.type, note: f.note.trim() });
      state.sdraft = { chart: c.id, dists: [...f.dists], arrows: f.arrows, i: 0, entries: {} }; state.sform = null; C.save(); go('splay'); } }, 'Start shooting')));
}

function splay() {
  const { h, icon, state, save, go, topbar } = C; const s = state.sdraft; const c = s && chartOf(s.chart); if (!c) { state.sdraft = null; go('sight'); return h('div'); }
  const d = s.dists[s.i]; const e = (s.entries[d] = s.entries[d] || { s: null, calls: [] });
  const fit = sightFit([...c.marks.filter(m => !s.entries[m.d]?.s), ...Object.entries(s.entries).filter(([, v]) => v.s != null).map(([k, v]) => ({ d: +k, s: v.s }))]);
  const prev = c.marks.find(m => m.d === d); const guess = prev ? prev.s : fit ? r1(fit(d)) : null;
  const last = s.i >= s.dists.length - 1; const n = calls(e.calls); const total = s.arrows + (e.extra || 0);
  const call = k => () => { if (e.calls.length >= total) { C.toast('All arrows called: tap + Extra arrow to shoot another, or Reset'); return; } e.calls.push(k); save(); C.render(); };
  const extra = () => { e.extra = (e.extra || 0) + 1; save(); C.render(); };
  const finish = () => { const now = Date.now(); Object.entries(s.entries).forEach(([k, v]) => { if (v.s == null || isNaN(v.s)) return; const dd = +k; c.marks = c.marks.filter(m => m.d !== dd); c.marks.push({ d: dd, s: v.s, calls: v.calls, at: now }); });
    c.marks.sort((a, b) => a.d - b.d); c.updated = now; state.sdraft = null; state.sc = c.id; save(); C.achCheck?.(); go('schart'); };
  const step = dir => { s.i = Math.max(0, Math.min(s.dists.length - 1, s.i + dir)); state._top = true; save(); C.render(); };
  const marked = Object.values(s.entries).filter(v => v.s != null).length;
  return h('div', {}, topbar(`${d} m`, `${s.i + 1} of ${s.dists.length} · ${title(c)}`, () => { if (C.confirmBox(marked ? 'Leave? Marks entered so far are kept if you finish; leaving now discards them.' : 'Stop this session?')) { state.sdraft = null; save(); go(c.marks.length ? 'schart' : 'sight'); } }),
    h('div', { class: 'page' },
      h('div', { class: 'sdist' }, h('div', { class: 'big' }, `${d}`, h('small', {}, ' m')), h('div', { class: 'muted' }, `Shoot ${total} arrow${total > 1 ? 's' : ''}, then call where each one went`)),
      h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { style: 'flex:1' }, 'Arrows'), h('span', { class: 'muted', style: 'flex:0 0 auto;font-size:13px' }, `${Math.min(e.calls.length, total)} of ${total}`)),
        h('div', { class: 'scalls' }, ...Array.from({ length: total }, (_, i) => h('span', { class: 'sc ' + (e.calls[i] || '') }, e.calls[i] === 'high' ? '↑' : e.calls[i] === 'low' ? '↓' : e.calls[i] === 'on' ? '●' : '·'))),
        h('div', { class: 'grid c3' }, h('button', { onclick: call('high') }, '↑ High'), h('button', { class: 'primary', onclick: call('on') }, '● On'), h('button', { onclick: call('low') }, '↓ Low')),
        e.calls.length ? h('div', { class: 'muted', style: 'font-size:13px' }, advice(e.calls)) : null,
        h('div', { class: 'row' }, h('button', { id: 'sExtra', onclick: extra }, '+ Extra arrow'), e.calls.length || e.extra ? h('button', { class: 'ghost', style: 'flex:0 0 auto;padding:0 16px', onclick: () => { e.calls = []; e.extra = 0; save(); C.render(); } }, 'Reset') : null)),
      h('div', { class: 'card' }, h('label', { class: 'fld' }, h('span', {}, `Sight setting at ${d} m`),
        h('input', { id: 'sSet', type: 'number', inputmode: 'decimal', step: 'any', placeholder: guess != null ? `Try ${fmt(guess)}` : 'e.g. 4.5', value: e.s ?? '', oninput: ev => { e.s = ev.target.value === '' ? null : parseFloat(ev.target.value); save(); const nb = C.$('#sNext'); if (nb) nb.textContent = e.s != null ? 'Next distance' : 'Skip distance'; } })),
        h('small', { class: 'muted', style: 'font-size:12px' }, prev ? `Last time: ${fmt(prev.s)}.` : guess != null ? `The curve so far says about ${fmt(guess)}.` : 'Enter the setting your group was on with.'))),
    h('div', { class: 'bottombar' },
      h('button', { style: 'flex:0 0 56px', disabled: s.i === 0, onclick: () => step(-1), 'aria-label': 'Previous distance' }, icon('back')),
      last ? h('button', { class: 'primary', onclick: finish }, 'Finish & build chart') : h('button', { id: 'sNext', class: 'primary', onclick: () => step(1) }, e.s != null ? 'Next distance' : 'Skip distance'),
      last ? null : h('button', { style: 'flex:0 0 auto;padding:0 14px', onclick: finish, disabled: !marked && !c.marks.length }, 'Finish')));
}

function schart() {
  const { h, icon, state, save, go, topbar, confirmBox, $ } = C; const c = chartOf(state.sc); if (!c) { go('sight'); return h('div'); }
  const rows = chartRows(c); const me = (state.profile?.name || '').trim();
  const shoot = () => { state.sform = { id: c.id, bow: c.bow, type: c.type, note: c.note || '', dists: c.marks.length ? c.marks.map(m => m.d) : [10, 20, 30, 40, 50], arrows: 3 }; go('ssetup'); };
  return h('div', {}, topbar(c.bow, [bowName(c.type), c.note].filter(Boolean).join(' · '), () => go('sight'), h('button', { id: 'scEdit', class: 'tb-text', onclick: () => editChart(c), 'aria-label': 'Edit or delete this chart' }, 'Edit')),
    h('div', { class: 'page' },
      c.marks.length ? h('div', { class: 'card' }, h('div', { class: 'row' }, icon('ruler'), h('h3', {}, 'Sight mark chart')), chartSVG(c),
        h('table', { class: 'stable' }, h('tr', {}, h('th', {}, 'Distance'), h('th', { class: 'num' }, 'Setting'), h('th', {}, '')),
          ...rows.map(r => h('tr', { class: (r.measured ? 'm ' : '') + 'tap', tabindex: '0', role: 'button', 'aria-label': `${r.d} m, setting ${fmt(r.s)}. Tap to edit`, onclick: () => editMark(c, r.d, r.measured, r.s) }, h('td', {}, `${r.d} m`), h('td', { class: 'num' }, fmt(r.s)), h('td', { class: 'muted' }, r.measured ? 'shot ✎' : 'curve ✎')))),
        h('small', { class: 'muted', style: 'font-size:12px' }, c.marks.length < 2 ? 'Shoot one more distance and the curve fills in the gaps. Tap a row to edit it.' : 'Bold rows were shot; the others come from the curve. Tap any row to edit or delete it.'))
        : h('div', { class: 'card' }, h('div', { class: 'muted' }, 'No marks yet. Shoot a session, or add marks you already know below.')),
      c.marks.length ? h('div', { class: 'grid c2' },
        h('button', { class: 'primary', onclick: () => drawCard(c).toBlob(b => download(b, fileBase(c) + '.png')) }, 'Save image'),
        h('button', { onclick: () => drawCard(c).toBlob(b => share(b, fileBase(c) + '.png', `Sight marks · ${c.bow}`)) }, 'Share image'),
        h('button', { onclick: busy(async () => download(await chartsWorkbook([c], me), fileBase(c) + '.xlsx')) }, 'Export to Excel'),
        h('button', { onclick: busy(async () => share(await chartsWorkbook([c], me), fileBase(c) + '.xlsx', `Sight marks · ${c.bow}`)) }, 'Share Excel')) : null,
      h('div', { class: 'card' }, h('h3', {}, 'Marks'),
        ...[...c.marks].sort((a, b) => a.d - b.d).map(m => h('div', { class: 'row smark' }, h('b', { style: 'flex:0 0 64px' }, `${m.d} m`), h('span', { style: 'flex:1;font-size:17px' }, fmt(m.s)),
          h('button', { style: 'flex:0 0 auto;padding:0 14px', 'aria-label': `Edit ${m.d} m`, onclick: () => editMark(c, m.d, true, m.s) }, 'Edit'),
          h('button', { class: 'ghost danger', style: 'flex:0 0 auto;padding:0 10px', 'aria-label': `Delete ${m.d} m`, onclick: () => { if (!confirmBox(`Delete the ${m.d} m mark?`)) return; c.marks = c.marks.filter(x => x !== m); c.updated = Date.now(); save(); C.render(); C.toast(`${m.d} m deleted`); } }, 'Delete'))),
        h('div', { class: 'row smark' }, h('input', { id: 'smD', type: 'number', inputmode: 'decimal', placeholder: 'Dist (m)', style: 'flex:0 0 96px' }), h('input', { id: 'smS', type: 'number', inputmode: 'decimal', step: 'any', placeholder: 'Setting' }),
          h('button', { style: 'flex:0 0 auto;padding:0 14px', onclick: () => { const d = parseFloat($('#smD').value), s = parseFloat($('#smS').value); if (!(d > 0) || isNaN(s)) { C.toast('Enter a distance and a setting'); return; } c.marks = c.marks.filter(x => x.d !== d); c.marks.push({ d, s, calls: [], at: Date.now() }); c.marks.sort((a, b) => a.d - b.d); c.updated = Date.now(); save(); C.render(); } }, 'Add'))),
      h('button', { class: 'ghost', style: 'color:var(--danger)', onclick: () => { if (confirmBox(`Delete the sight chart for ${title(c)}?`)) { state.sight = charts().filter(x => x !== c); save(); go('sight'); } } }, 'Delete this chart')),
    h('div', { class: 'bottombar' }, h('button', { class: 'primary', onclick: shoot }, c.marks.length ? 'Shoot a session' : 'Shoot sight marks')));
}
