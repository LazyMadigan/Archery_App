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

// Every colour the app uses as a fill carries white text, and every colour it uses as text sits on a panel.
// So each mode gets two tokens, both held to WCAG AA (4.5:1) whatever the club picks:
//   brand      fill for buttons, top bar, chips, hero: white text on it >= 4.5:1
//   brand-text text and icons on the panels/page:      >= 4.5:1 against the lightest surface it sits on
// accent (hero gradient tail) gets a little headroom for the translucent rows drawn on top of it.
const PAGE_L = '#e9eff8', PAGE_D = '#0c1426';
const colourful = c => { const v = rgb(c); return Math.max(...v) - Math.min(...v) > 40; };
export function tokens({ c1, c2 } = DEFAULT) {
  if (!valid(c1)) c1 = DEFAULT.c1; if (!valid(c2)) c2 = c1;
  let main = c1, second = c2;
  if (lum(main) > 0.6 && lum(second) < lum(main)) [main, second] = [second, main]; // a white/yellow main colour can't carry white text
  const fill = c => darkenTo(c, '#ffffff', 4.6);
  const onLight = c => darkenTo(darkenTo(c, LIGHT_PANEL, 4.6), PAGE_L, 4.6);
  const onDark = c => lightenTo(c, DARK_PANEL, 4.6);
  // dark mode: a near-black main colour disappears on the dark page, so a colourful second colour leads there
  const darkSrc = lum(main) < 0.035 && colourful(second) ? second : main;
  const lightBrand = fill(main), darkBrand = fill(darkSrc);
  const accent = (b, sec) => { for (const t of [0.35, 0.25, 0.15, 0.08, 0]) { const a = mix(b, sec, t); if (contrast(a, '#ffffff') >= 5.2) return a; } return darkenTo(b, '#ffffff', 5.2); };
  return {
    light: { brand: lightBrand, deep: mix(lightBrand, '#000000', 0.3), accent: accent(lightBrand, second), text: onLight(main) },
    dark: { brand: darkBrand, deep: mix(darkBrand, '#000000', 0.35), accent: accent(darkBrand, darkSrc === second ? main : second), text: onDark(darkSrc) },
    main, second,
  };
}
export function css(colours) {
  const t = tokens(colours || DEFAULT); const v = (m, s) => `--brand:${m.brand};--brand-deep:${m.deep};--accent:${m.accent};--brand-text:${m.text};--shadow:0 6px 20px ${s}`;
  return `:root{${v(t.light, t.light.deep + '1f')}}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${v(t.dark, 'rgba(0,0,0,.35)')}}}\n:root[data-theme="dark"]{${v(t.dark, 'rgba(0,0,0,.35)')}}`;
}
export function apply(colours) {
  // the default theme goes through the same rules, so it is held to the same contrast
  const c = colours && valid(colours.c1) ? colours : DEFAULT;
  let el = document.getElementById('clubColours');
  if (!el) { el = document.createElement('style'); el.id = 'clubColours'; document.head.append(el); }
  el.textContent = css(c); setMeta(tokens(c).light.brand);
}
function setMeta(c) { const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', c); }
// Current brand colour for canvas drawings (share images).
export const brandNow = () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || DEFAULT.c1;
