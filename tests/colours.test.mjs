// Club colours: every preset and awkward custom picks must stay readable (node tests/colours.test.mjs)
import { PRESETS, tokens, contrast } from '../src/colours.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const cases = [...PRESETS.map(([n, a, b]) => [n, a, b]), ['White & green', '#ffffff', '#0f7a3d'], ['Yellow & black', '#ffd400', '#111111'], ['Black & white', '#000000', '#ffffff'], ['White & white', '#ffffff', '#ffffff'], ['Pale pink & navy', '#f6c6d8', '#13254f'], ['Grey & grey', '#777777', '#888888']];
for (const [n, a, b] of cases) {
  const t = tokens({ c1: a, c2: b });
  ok(contrast(t.light.brand, '#ffffff') >= 4.5, `${n}: light brand vs white text ${contrast(t.light.brand, '#ffffff').toFixed(2)}`);
  ok(contrast(t.dark.brand, '#172442') >= 2.5, `${n}: dark brand vs dark panel ${contrast(t.dark.brand, '#172442').toFixed(2)}`);
  ok(contrast(t.dark.brand, '#ffffff') >= 3, `${n}: dark brand vs white text ${contrast(t.dark.brand, '#ffffff').toFixed(2)}`);
  ok(contrast(t.light.accent, '#ffffff') >= 3 && contrast(t.dark.accent, '#ffffff') >= 3, `${n}: accent carries white text`);
}
ok(tokens({ c1: '#1d4fd8', c2: '#ffffff' }).light.brand === '#1d4fd8', 'default blue unchanged');
ok(tokens({ c1: 'nonsense' }).light.brand === '#1d4fd8', 'bad input falls back');
console.log(fail ? `${fail} failed` : `all colour tests pass (${cases.length} combinations)`); process.exit(fail ? 1 : 0);
