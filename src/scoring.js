// Scoring systems. Each system maps (arrowIndex, zone) -> points.
// Zones: 'centre' (smallest spot), 'inner' (next ring), 'vital' (outer kill line), 'body' (anywhere else on the animal), 'miss'.
// Points are club-configurable in Settings; these are the defaults as commonly shot.
export const SYSTEMS = {
  ifaa_hunting: {
    name: 'IFAA 3D Hunting (1 arrow)',
    arrows: 1,
    desc: '20 / 16 / 10. One arrow per target.',
    table: [{ centre: 20, inner: 20, vital: 16, body: 10, miss: 0 }],
  },
  ifaa_standard: {
    name: 'IFAA 3D Standard (2 arrows)',
    arrows: 2,
    desc: 'Each arrow 10 / 8 / 5. Two arrows per target.',
    table: [
      { centre: 10, inner: 10, vital: 8, body: 5, miss: 0 },
      { centre: 10, inner: 10, vital: 8, body: 5, miss: 0 },
    ],
  },
  wa_3d: {
    name: 'World Archery 3D (2 arrows)',
    arrows: 2,
    desc: '11 / 10 / 8 / 5 per arrow.',
    table: [
      { centre: 11, inner: 10, vital: 8, body: 5, miss: 0 },
      { centre: 11, inner: 10, vital: 8, body: 5, miss: 0 },
    ],
  },
  nfas_big_game: {
    name: 'NFAS Big Game (walk-down, up to 3)',
    arrows: 3,
    walkdown: true,
    desc: '1st arrow 24 / 20 / 16, 2nd 14 / 10, 3rd 8 / 4. Stop when you hit.',
    table: [
      { centre: 24, inner: 24, vital: 20, body: 16, miss: 0 },
      { centre: 14, inner: 14, vital: 14, body: 10, miss: 0 },
      { centre: 8, inner: 8, vital: 8, body: 4, miss: 0 },
    ],
  },
  asa: {
    name: 'ASA (1 arrow)',
    arrows: 1,
    desc: '12 / 10 / 8 / 5.',
    table: [{ centre: 12, inner: 10, vital: 8, body: 5, miss: 0 }],
  },
  ibo: {
    name: 'IBO (1 arrow)',
    arrows: 1,
    desc: '11 / 10 / 8 / 5.',
    table: [{ centre: 11, inner: 10, vital: 8, body: 5, miss: 0 }],
  },
};

export const ZONES = ['centre', 'inner', 'vital', 'body', 'miss'];
export const ZONE_LABEL = { centre: 'Centre', inner: 'Inner', vital: 'Vital', body: 'Body', miss: 'Miss' };
export const ZONE_COLOUR = { centre: '#f2c94c', inner: '#e0494a', vital: '#4a8de0', body: '#7c7c7c', miss: '#333' };

export function maxArrows(system, requested) {
  return Math.min(3, requested || system.arrows, system.arrows);
}

// Score one player's arrows on one target. arrows: array of zone strings.
export function scoreTarget(system, arrows) {
  let total = 0;
  for (let i = 0; i < arrows.length && i < system.table.length; i++) {
    const z = arrows[i];
    if (!z) continue;
    const row = system.table[i];
    total += row[z] ?? 0;
    if (system.walkdown && z !== 'miss') break; // walk-down: first hit ends the target
  }
  return total;
}

// Best single arrow score on a target (used by King of the Castle / Skins)
export function bestArrow(system, arrows) {
  let best = 0;
  arrows.forEach((z, i) => {
    if (!z || !system.table[i]) return;
    best = Math.max(best, system.table[i][z] ?? 0);
  });
  return best;
}

export function zoneRank(z) {
  return { centre: 4, inner: 3, vital: 2, body: 1, miss: 0 }[z] ?? 0;
}
