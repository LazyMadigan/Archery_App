// Club colours: every preset and awkward custom picks must stay readable (node tests/colours.test.mjs)
import { PRESETS, tokens, contrast } from '../src/colours.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const cases = [...PRESETS.map(([n, a, b]) => [n, a, b]), ['White & green', '#ffffff', '#0f7a3d'], ['Yellow & black', '#ffd400', '#111111'], ['Black & white', '#000000', '#ffffff'], ['White & white', '#ffffff', '#ffffff'], ['Pale pink & navy', '#f6c6d8', '#13254f'], ['Grey & grey', '#777777', '#888888']];
for (const [n, a, b] of cases) {
  const t = tokens({ c1: a, c2: b });
  for (const [mode, m, panel, page] of [['light', t.light, '#ffffff', '#e9eff8'], ['dark', t.dark, '#172442', '#0c1426']]) {
    ok(contrast(m.brand, '#ffffff') >= 4.5, `${n} ${mode}: white text on brand ${contrast(m.brand, '#ffffff').toFixed(2)}`);
    ok(contrast(m.deep, '#ffffff') >= 4.5, `${n} ${mode}: white text on brand-deep`);
    ok(contrast(m.accent, '#ffffff') >= 4.5, `${n} ${mode}: white text on accent`);
    ok(contrast(m.text, panel) >= 4.5 && contrast(m.text, page) >= 4.5, `${n} ${mode}: brand-text on panel ${contrast(m.text, panel).toFixed(2)} / page ${contrast(m.text, page).toFixed(2)}`);
  }
}
ok(tokens({ c1: '#1d4fd8', c2: '#ffffff' }).light.brand === '#1d4fd8', 'default blue unchanged');
ok(tokens({ c1: 'nonsense' }).light.brand === '#1d4fd8', 'bad input falls back');
console.log(fail ? `${fail} failed` : `all colour tests pass (${cases.length} combinations)`); process.exit(fail ? 1 : 0);
