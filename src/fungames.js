// Shared game engines for 3D and target (indoor/field) rounds.
// A round is reduced to "steps" (one per completed end or target): steps[i] = { [playerId]: score }.
// Bingo works on each archer's arrows in the order they were shot.

// King of the Castle, fought in crown battles of `bout` ends/targets (1 = every end).
// Highest total over the battle takes the crown. A King who ties keeps it; tied challengers win nothing.
export function kingBouts(steps, ids, bout = 1, finished = false) { // finished: a short last battle still counts
  bout = Math.max(1, bout | 0);
  let king = null; const won = {}, streak = {}, reign = {}; ids.forEach(id => { won[id] = 0; streak[id] = 0; reign[id] = 0; });
  const log = []; const full = Math.floor(steps.length / bout); const n = full + (finished && steps.length % bout ? 1 : 0);
  for (let b = 0; b < n; b++) {
    const sum = {}; ids.forEach(id => sum[id] = 0);
    for (let s = b * bout; s < Math.min(steps.length, (b + 1) * bout); s++) ids.forEach(id => sum[id] += steps[s][id] || 0);
    const best = Math.max(...ids.map(id => sum[id])); const top = ids.filter(id => sum[id] === best);
    const w = top.length === 1 ? top[0] : (king && top.includes(king) ? king : null);
    if (w) { won[w]++; if (w === king) streak[w]++; else { if (king) streak[king] = 0; streak[w] = 1; king = w; } reign[w] = Math.max(reign[w], streak[w]); }
    log.push({ b, winner: w, kept: !!w && w === king && streak[w] > 1 });
  }
  return { king, won, holesWon: won, streak, reign, bout, battles: n, into: n > full ? 0 : steps.length - full * bout, log };
}

// Last archer standing: everyone starts with `lives`. Each end, whoever is lowest (among those still in) loses a life.
// If everyone still in ties, nobody loses one. Last archer with lives left wins.
export function lastStanding(steps, ids, lives = 3) {
  const left = {}, outAt = {}; ids.forEach(id => left[id] = lives);
  let winner = null;
  steps.forEach((st, i) => {
    if (winner) return;
    const alive = ids.filter(id => left[id] > 0); if (alive.length < 2) return;
    const low = Math.min(...alive.map(id => st[id] || 0)); const losers = alive.filter(id => (st[id] || 0) === low);
    if (losers.length === alive.length) return;
    losers.forEach(id => { left[id]--; if (!left[id]) outAt[id] = i; });
    const still = ids.filter(id => left[id] > 0);
    if (still.length === 1 && ids.length > 1) winner = still[0];
  });
  return { lives, left, outAt, winner };
}

// Climb the ladder: beat your previous end to go up a rung, match it to stay, drop below it to slip down one.
export function ladder(steps, ids) {
  const rung = {}, top = {}, last = {}; ids.forEach(id => { rung[id] = 0; top[id] = 0; last[id] = null; });
  steps.forEach(st => ids.forEach(id => { const v = st[id] || 0;
    if (last[id] != null) { if (v > last[id]) rung[id]++; else if (v < last[id]) rung[id] = Math.max(0, rung[id] - 1); top[id] = Math.max(top[id], rung[id]); }
    last[id] = v; }));
  const best = Math.max(0, ...ids.map(id => rung[id])); const leaders = ids.filter(id => rung[id] === best);
  return { rung, top, winner: ids.length > 1 && best > 0 && leaders.length === 1 ? leaders[0] : null };
}

// Bingo: hit every value on the card at least once. Fewest arrows to fill the card wins.
export function bingo(seqs, ids, card) {
  const got = {}, doneAt = {};
  ids.forEach(id => { const have = new Set(); (seqs[id] || []).forEach((v, i) => { if (card.includes(v) && !have.has(v)) { have.add(v); if (have.size === card.length && doneAt[id] == null) doneAt[id] = i + 1; } }); got[id] = [...have]; });
  const fin = ids.filter(id => doneAt[id] != null).sort((a, b) => doneAt[a] - doneAt[b]);
  const winner = fin.length && (fin.length === 1 || doneAt[fin[0]] < doneAt[fin[1]]) ? fin[0] : null;
  return { card, got, doneAt, winner };
}

export const FUN_GAMES = ['king', 'last', 'ladder', 'bingo'];

// One result shape for boards, summaries and exports.
// ctx: { ids, name:{id:name}, steps, kingSteps?, seqs, card, cardLabel?, bout, unit:'end'|'target' }
export function funResult(games, ctx) {
  const { ids, name, steps, unit } = ctx; const key = FUN_GAMES.find(k => games?.[k]); if (!key) return null;
  const nm = id => name[id] || '?'; const plural = n => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (key === 'king') {
    const k = kingBouts(ctx.kingSteps || steps, ids, ctx.bout || 1, !!ctx.finished);
    const status = (k.king ? `${nm(k.king)} holds the crown${k.streak[k.king] > 1 ? ` · ${k.streak[k.king]} battles in a row` : ''}` : 'Nobody holds the crown yet') + (k.bout > 1 && !ctx.finished ? ` · battle ${k.battles + 1}: ${k.into} of ${plural(k.bout)} shot` : '');
    return { key, raw: k, winner: k.king, col: 'Crowns', status,
      val: Object.fromEntries(ids.map(id => [id, `${k.won[id]}${k.streak[id] > 1 ? ` 🔥${k.streak[id]}` : ''}`])),
      rank: Object.fromEntries(ids.map(id => [id, k.won[id] * 100 + (id === k.king ? 50 : 0) + k.reign[id]])),
      bit: id => `${k.won[id]} crown battle${k.won[id] === 1 ? '' : 's'} won${k.reign[id] > 1 ? ` · longest reign ${k.reign[id]}` : ''}${id === k.king ? ' · KING' : ''}` };
  }
  if (key === 'last') {
    const l = lastStanding(steps, ids, 3); const inN = ids.filter(id => l.left[id] > 0).length;
    return { key, raw: l, winner: l.winner, col: 'Lives',
      status: ids.length < 2 ? 'Needs two or more archers' : l.winner ? `${nm(l.winner)} is the last archer standing` : `${inN} archers still in`,
      val: Object.fromEntries(ids.map(id => [id, l.left[id] > 0 ? `${l.left[id]}♥` : 'out'])),
      rank: Object.fromEntries(ids.map(id => [id, l.left[id] * 1000 + (l.outAt[id] ?? 999)])),
      bit: id => l.left[id] > 0 ? `${l.left[id]} ${l.left[id] === 1 ? 'life' : 'lives'} left${id === l.winner ? ' · LAST STANDING' : ''}` : `out after ${unit} ${l.outAt[id] + 1}` };
  }
  if (key === 'ladder') {
    const d = ladder(steps, ids); const best = ids.slice().sort((a, b) => d.rung[b] - d.rung[a])[0];
    return { key, raw: d, winner: d.winner, col: 'Rung',
      status: steps.length < 2 ? `Beat your first ${unit} to start climbing` : `${nm(best)} is highest, on rung ${d.rung[best]}`,
      val: Object.fromEntries(ids.map(id => [id, String(d.rung[id])])),
      rank: Object.fromEntries(ids.map(id => [id, d.rung[id] * 100 + d.top[id]])),
      bit: id => `rung ${d.rung[id]} · highest ${d.top[id]}` };
  }
  const g = bingo(ctx.seqs, ids, ctx.card); const lab = v => (ctx.cardLabel?.[v] ?? String(v));
  const fin = ids.filter(id => g.doneAt[id] != null);
  return { key, raw: g, winner: g.winner, col: 'Card',
    status: g.winner ? `${nm(g.winner)} filled the card in ${g.doneAt[g.winner]} arrows` : fin.length ? 'Card filled: tie on arrows' : `Card: ${ctx.card.map(lab).join(' · ')}`,
    val: Object.fromEntries(ids.map(id => [id, g.doneAt[id] != null ? `✓ ${g.doneAt[id]}` : `${g.got[id].length}/${ctx.card.length}`])),
    rank: Object.fromEntries(ids.map(id => [id, g.doneAt[id] != null ? 10000 - g.doneAt[id] : g.got[id].length])),
    bit: id => g.doneAt[id] != null ? `card filled in ${g.doneAt[id]} arrows` : `${g.got[id].length} of ${ctx.card.length} on the card · still need ${ctx.card.filter(v => !g.got[id].includes(v)).map(lab).join(', ')}` };
}
// Strip functions so the result can be saved with the round.
export const funSave = f => f && { key: f.key, winner: f.winner, col: f.col, status: f.status, val: f.val, rank: f.rank, bits: Object.fromEntries(Object.keys(f.val).map(id => [id, f.bit(id)])) };
