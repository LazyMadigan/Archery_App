// Club colours: turn a club's two colours into app theme tokens that stay readable in light and dark mode.
// Pure functions plus one DOM helper (apply) that writes a <style> element after app.css.

export const DEFAULT = { c1: '#1d4fd8', c2: '#ffffff' };
export const PRESETS = [
  ['Blue & white', '#1d4fd8', '#ffffff'],
  ['Green & gold', '#0f7a3d', '#f2c230'],
  ['Red & black', '#c8102e', '#111111'],
  ['Maroon & white', '#7a1f3d', '#ffffff'],
  ['Navy & sky blue', '#1b2a5c', '#6cb4ee'],
  ['Black & amber', '#111111', '#f5a300'],
  ['Purple & gold', '#5b2a86', '#f2c230'],
  ['Orange & black', '#e86a10', '#111111'],
  ['Teal & white', '#0e7c7b', '#ffffff'],
  ['Green & white', '#138a43', '#ffffff'],
  ['Red & white', '#d0202e', '#ffffff'],
  ['Sky blue & navy', '#5aa9e6', '#13254f'],
];
const LIGHT_PANEL = '#ffffff', DARK_PANEL = '#172442';

export const valid = c => /^#[0-9a-f]{6}$/i.test(c || '');
const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
export const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const darkenTo = (c, bg, min) => { for (let i = 0; i < 30 && contrast(c, bg) < min; i++) c = mix(c, '#000000', 0.06); return c; };
const lightenTo = (c, bg, min) => { for (let i = 0; i < 30 && contrast(c, bg) < min; i++) c = mix(c, '#ffffff', 0.06); return c; };

// Light: brand carries white text (buttons, top bar) and sits on white panels, so it must reach 4.5:1 against white.
// Dark: brand must stand out on the dark panel (3:1) and still carry white text (3:1 for bold button labels).
export function tokens({ c1, c2 } = DEFAULT) {
  if (!valid(c1)) c1 = DEFAULT.c1; if (!valid(c2)) c2 = c1;
  let main = c1, second = c2;
  if (lum(main) > 0.6 && lum(second) < lum(main)) [main, second] = [second, main]; // a white/yellow main colour can't carry white text
  const light = darkenTo(main, LIGHT_PANEL, 4.5);
  let dark = lightenTo(main, DARK_PANEL, 3);
  if (lum(main) < 0.035 || contrast(dark, '#ffffff') < 3) { // a very dark main colour (black, navy) turns grey when lifted: let the second colour lead in dark mode if it works
    const alt = darkenTo(lightenTo(second, DARK_PANEL, 3), '#ffffff', 3);
    const altOk = contrast(alt, DARK_PANEL) >= 2.5 && contrast(alt, '#ffffff') >= 3 && Math.max(...rgb(alt)) - Math.min(...rgb(alt)) > 40;
    dark = altOk ? alt : darkenTo(dark, '#ffffff', 3);
  }
  const accentL = mix(light, second, 0.35), accentD = mix(dark, second, 0.3);
  return {
    light: { brand: light, deep: mix(light, '#000000', 0.3), accent: contrast(accentL, '#ffffff') >= 3 ? accentL : light },
    dark: { brand: dark, deep: mix(dark, '#000000', 0.35), accent: contrast(accentD, '#ffffff') >= 3 ? accentD : dark },
    main, second,
  };
}
export function css(colours) {
  const t = tokens(colours); const v = (m, s) => `--brand:${m.brand};--brand-deep:${m.deep};--accent:${m.accent};--shadow:0 6px 20px ${s}`;
  const shadowL = mix(t.light.deep, '#ffffff', 0) + '1f';
  return `:root{${v(t.light, shadowL)}}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${v(t.dark, 'rgba(0,0,0,.35)')}}}\n:root[data-theme="dark"]{${v(t.dark, 'rgba(0,0,0,.35)')}}`;
}
export function apply(colours) {
  let el = document.getElementById('clubColours');
  if (!colours || !valid(colours.c1)) { el?.remove(); setMeta(DEFAULT.c1); return; }
  if (!el) { el = document.createElement('style'); el.id = 'clubColours'; document.head.append(el); }
  el.textContent = css(colours); setMeta(tokens(colours).light.brand);
}
function setMeta(c) { const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', c); }
// Current brand colour for canvas drawings (share images).
export const brandNow = () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || DEFAULT.c1;
