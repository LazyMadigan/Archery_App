// Contrast audit: every visible piece of text on the main screens, for every club colour preset plus awkward and
// random custom colours, in light and dark mode, must meet WCAG AA against what is actually behind it
// (4.5:1 normal text, 3:1 large text: 24px+, or 18.66px+ bold). Disabled controls are exempt, as in WCAG.
// QUICK=1 runs a small subset. Report of failures goes to /tmp/contrast-report.txt.
const BASE = process.env.BASE || 'http://localhost:8111';
const fs = require('fs');
const { chromium, devices } = require('playwright');

const PRESETS = [['#1d4fd8', '#ffffff'], ['#0f7a3d', '#f2c230'], ['#c8102e', '#111111'], ['#7a1f3d', '#ffffff'], ['#1b2a5c', '#6cb4ee'], ['#111111', '#f5a300'], ['#5b2a86', '#f2c230'], ['#e86a10', '#111111'], ['#0e7c7b', '#ffffff'], ['#138a43', '#ffffff'], ['#d0202e', '#ffffff'], ['#5aa9e6', '#13254f']];
const AWKWARD = [['#ffffff', '#ffffff'], ['#ffff00', '#ffff00'], ['#ffd400', '#ffffff'], ['#000000', '#000000'], ['#808080', '#808080'], ['#ff0000', '#00ff00'], ['#00ff00', '#ffff00'], ['#00ffff', '#ff00ff'], ['#ffc0cb', '#ffc0cb'], ['#808000', '#000080'], ['#172442', '#0c1426'], ['#e9eff8', '#cfd9ec']];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const RANDOM = Array.from({ length: 12 }, () => [0, 0].map(() => '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0')));
const COMBOS = [null, ...PRESETS, ...AWKWARD, ...RANDOM];
const LIST = process.env.QUICK ? [null, PRESETS[1], AWKWARD[0], AWKWARD[1], AWKWARD[3]] : COMBOS;

// Runs in the page: returns failing text elements on the current screen.
function audit() {
  const parse = c => { // rgb()/rgba() and color(srgb r g b / a) (what Chrome reports for color-mix)
    let m = c.match(/color\(srgb ([^)]+)\)/); if (m) { const v = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] == null || isNaN(v[3]) ? 1 : v[3]]; }
    m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] == null ? 1 : v[3]]; };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const L = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // possible backgrounds behind an element: composite every ancestor's colour; gradients contribute each colour stop
  const backs = el => {
    const layers = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) layers.push(e);
    let set = [[255, 255, 255, 1]]; const root = getComputedStyle(document.documentElement).backgroundColor; const rb = parse(root); if (rb && rb[3] > 0) set = [over(rb, [255, 255, 255, 1])];
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor); if (bodyBg && bodyBg[3] > 0) set = set.map(b => over(bodyBg, b));
    for (const e of layers.reverse()) {
      const cs = getComputedStyle(e); const bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0) set = set.map(b => over(bg, b));
      const gi = cs.backgroundImage; if (gi && gi.includes('gradient')) { const stops = [...gi.matchAll(/(rgba?|color)\([^)]+\)/g)].map(m => parse(m[0])).filter(Boolean); if (stops.length) set = stops.flatMap(s => set.map(b => over(s, b))); }
    }
    return set;
  };
  const fails = []; const seen = new Set();
  const els = [...document.querySelectorAll('body *')].filter(e => !['SCRIPT', 'STYLE', 'svg', 'path', 'circle', 'line', 'IMG', 'CANVAS', 'OPTION', 'DATALIST'].includes(e.tagName));
  for (const e of els) {
    const isField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName) && !['color', 'checkbox', 'file', 'radio', 'hidden'].includes(e.type);
    const txt = isField ? (e.value || '') : [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;
    if (e.closest('[disabled]') || e.disabled) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    if (op < 0.05) continue; // fully faded (e.g. a toast that is hidden) is not visible text
    const fg0 = parse(cs.color); if (!fg0) continue; const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const large = fs >= 24 || (bold && fs >= 18.66); const need = large ? 3 : 4.5;
    let worst = 99, wb = null;
    for (const b of backs(e)) { const fg = over([fg0[0], fg0[1], fg0[2], fg0[3] * op], b); const k = ratio(fg, b); if (k < worst) { worst = k; wb = b; } }
    if (worst < need - 0.01) { const key = e.className + '|' + txt.slice(0, 24); if (seen.has(key)) continue; seen.add(key);
      fails.push({ text: txt.slice(0, 40), cls: (typeof e.className === 'string' ? e.className : e.className?.baseVal) || e.tagName.toLowerCase(), parent: (typeof e.parentElement?.className === 'string' ? e.parentElement.className : e.parentElement?.className?.baseVal) || e.parentElement?.tagName?.toLowerCase() || '', ratio: +worst.toFixed(2), need, fg: cs.color, bg: `rgb(${wb.slice(0, 3).map(Math.round).join(',')})` }); }
  }
  return fails;
}

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const report = []; let total = 0, checks = 0;
  for (const scheme of ['light', 'dark']) for (const combo of LIST) {
    const ctx = await b.newContext({ ...devices['Pixel 7'], colorScheme: scheme }); const p = await ctx.newPage();
    p.on('dialog', d => d.accept());
    await p.addInitScript(([c]) => { if (sessionStorage.x) return; sessionStorage.x = 1; const t = Date.now() - 86400e3;
      localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.rulesOff', JSON.stringify(['3d_king', '3d_skins', '3d_guess', 't_king', 't_sets']));
      localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian', club: 'Wicklow Archers', bows: ['recurve'], ...(c ? { colours: { c1: c[0], c2: c[1] } } : {}) }));
      localStorage.setItem('wa.history', JSON.stringify([{ id: 'a', kind: 'indoor', started: t, roundKey: 'wa18', name: 'WA 18', face: '40', scheme: 'wa10', dist: 18, ends: 1, arrows: 3, games: { total: true }, mode: 'practice', goal: 'Follow through', players: [{ id: 'm', name: 'Cian', bow: 'recurve' }], scores: { m: [[{ v: 'X' }, { v: 10 }, { v: 9 }]] }, final: { tally: { m: { total: 29, xs: 1, tens: 2, arrows: 3, avg: 9.67 } }, ended: t } }]));
      localStorage.setItem('wa.sight', JSON.stringify([{ id: 's', bow: '30lb Hoyt', type: 'recurve', note: '', created: t, updated: t, marks: [{ d: 20, s: 3.2, calls: ['on'], at: t }, { d: 30, s: 4.6, calls: ['on'], at: t }, { d: 40, s: 6, calls: ['high'], at: t }] }]));
      localStorage.setItem('wa.ach', JSON.stringify([])); }, [combo]);
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(500);
    const tag = `${scheme} ${combo ? combo.join('/') : 'default'}`;
    const check = async (screen) => { checks++; const f = await p.evaluate(audit); f.forEach(x => report.push({ tag, screen, ...x })); total += f.length; };
    const back = async () => { await p.locator('.topbar button').first().click(); await p.waitForTimeout(150); };
    await check('home');
    await p.locator('.dots .dot').nth(1).click(); await p.waitForTimeout(450); await check('home: your best');
    await p.locator('.dots .dot').nth(2).click(); await p.waitForTimeout(450); await check('home: news');
    await p.locator('.heroes').evaluate(t => t.scrollTo({ left: 0 })); await p.evaluate(() => window.scrollTo(0, 99999)); await p.waitForTimeout(150); await check('home: tiles');
    await p.locator('.avatar').first().click(); await p.waitForTimeout(200); await check('profile');
    await p.locator('#pfEdit').click(); await p.waitForTimeout(150); await check('profile edit');
    await p.getByRole('button', { name: 'Cancel' }).click(); await p.waitForTimeout(100); await back();
    await p.locator('button[aria-label=Settings]').click(); await p.waitForTimeout(200); await check('settings'); await back();
    await p.locator('.tile:has-text("Achievements")').click(); await p.waitForTimeout(200); await check('achievements'); await back();
    await p.locator('.tile:has-text("Sight marks")').click(); await p.waitForTimeout(200); await check('sight marks');
    await p.locator('.schart-item').first().click(); await p.waitForTimeout(200); await check('sight chart');
    await p.getByRole('button', { name: 'Shoot a session' }).click(); await p.waitForTimeout(150); await check('sight setup');
    await p.locator('#sStart').click(); await p.waitForTimeout(150); await p.getByRole('button', { name: '↑ High' }).click(); await p.getByRole('button', { name: '● On' }).click(); await check('sight shooting');
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(400);
    await p.getByRole('button', { name: /Indoor/ }).first().click(); await p.waitForTimeout(200); await check('indoor setup');
    await p.locator('.gamecard:has-text("Practice")').click(); await p.locator('#tGoal').fill('Hold'); await check('indoor practice setup');
    await p.locator('#tStart').click(); await p.waitForTimeout(200);
    for (const v of ['X', '9', 'M']) await p.locator('.vbtns button', { hasText: new RegExp('^' + v + '$') }).click();
    await check('indoor shooting');
    await p.getByRole('button', { name: 'Board' }).click(); await p.waitForTimeout(150); await check('scoreboard');
    await p.getByRole('button', { name: 'Finish & save' }).click(); await p.waitForTimeout(300); await check('round summary');
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(400);
    await p.getByRole('button', { name: /3D Course/ }).first().click(); await p.waitForTimeout(300); await check('3D setup');
    await p.evaluate(() => window.scrollTo(0, 99999)); await check('3D setup (games)');
    if (errs.length) report.push({ tag, screen: 'page errors', text: errs.join(' | ') });
    await ctx.close(); process.stdout.write('.');
  }
  await b.close();
  const lines = report.map(r => `${r.tag} · ${r.screen} · "${r.text}" [${r.cls} in ${r.parent}] ${r.ratio ?? ''} < ${r.need ?? ''}  fg ${r.fg ?? ''} on ${r.bg ?? ''}`);
  fs.writeFileSync('/tmp/contrast-report.txt', lines.join('\n'));
  console.log(`\n${LIST.length} colour choices × 2 modes, ${checks} screens checked, ${total} text failures`);
  // summary by element so fixes are easy to find
  const by = {}; report.forEach(r => { const k = `${r.screen} · ${r.cls} in ${r.parent}`; by[k] = by[k] || { n: 0, worst: 99, ex: r }; by[k].n++; by[k].worst = Math.min(by[k].worst, r.ratio ?? 0); });
  Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, 40).forEach(([k, v]) => console.log(`${String(v.n).padStart(3)}× worst ${v.worst}  ${k}  e.g. "${v.ex.text}" (${v.ex.tag})`));
  console.log(total ? 'FAIL contrast' : 'PASS contrast'); process.exit(total ? 1 : 0);
})();
