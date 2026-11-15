// Original hand-drawn SVG icons. All 24x24 viewBox, stroke = currentColor.
const w = (inner, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
export const I = {
  bow: w('<path d="M5 3c6 3 6 15 0 18"/><path d="M5 3l1 18"/><path d="M5.5 12h13"/><path d="M15.5 9.5L18.5 12l-3 2.5"/>'),
  arrow: w('<path d="M3 21L19 5"/><path d="M14 5h5v5"/><path d="M6 15l-2 3 3-2"/><path d="M8 13l-2 3 3-2"/>'),
  peg: w('<path d="M12 22V9"/><path d="M12 9l7-3-7-3v6z" fill="currentColor"/><path d="M8 22h8"/>'),
  rings: w('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
  crown: w('<path d="M4 18h16l1-10-5 4-4-7-4 7-5-4z"/><path d="M4 21h16"/>'),
  skin: w('<path d="M6 4h12l2 5-8 11L4 9z"/><path d="M4 9h16"/><path d="M10 9l2 11 2-11"/>'),
  ruler: w('<path d="M3 17L17 3l4 4L7 21z"/><path d="M8 12l2 2"/><path d="M11 9l2 2"/><path d="M14 6l2 2"/>'),
  trophy: w('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4"/><path d="M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v4"/><path d="M8 21h8"/>'),
  course: w('<path d="M4 20c2-6 6-6 8-10s6-4 8-8"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/><circle cx="20" cy="2.5" r="1.5" fill="currentColor"/>'),
  history: w('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  trend: w('<path d="M3 17l5-5 4 3 7-8"/><path d="M15 7h4v4"/>'),
  library: w('<path d="M4 5h5a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-5a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h6z"/>'),
  trace: w('<path d="M4 14c0-6 5-10 9-10s7 3 7 7-4 7-9 7c-3 0-4-2-4-4z"/><circle cx="13" cy="11" r="2.5"/>'),
  cog: w('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  back: w('<path d="M15 5l-7 7 7 7"/>'),
  swap: w('<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>'),
  plus: w('<path d="M12 5v14M5 12h14"/>'),
  share: w('<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7h14v-7"/>'),
  check: w('<path d="M5 12l5 5L20 7"/>'),
  people: w('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14.5a5 5 0 0 1 6.5 5.5"/>'),
};
export const icon = (name, cls = '') => { const s = document.createElement('span'); s.className = 'ic ' + cls; s.innerHTML = I[name] || ''; return s; };
