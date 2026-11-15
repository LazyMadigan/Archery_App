import { scoreTarget, bestArrow } from './scoring.js';

// round = { players:[{id,name,handicap}], system, arrows, targets:[{targetId,faceId,distanceGuess:{pid:m},distanceActual}], scores:{ [targetIndex]: { [pid]: [zones] } } }

export function totals(round, system) {
  const out = {};
  round.players.forEach(p => (out[p.id] = { gross: 0, targets: 0, net: 0 }));
  Object.entries(round.scores).forEach(([ti, byPlayer]) => {
    Object.entries(byPlayer).forEach(([pid, arrows]) => {
      if (!out[pid]) return;
      out[pid].gross += scoreTarget(system, arrows);
      out[pid].targets += 1;
    });
  });
  round.players.forEach(p => {
    out[p.id].net = out[p.id].gross + Math.round((p.handicap || 0) * out[p.id].targets);
  });
  return out;
}

// King of the Castle: best arrow wins the target. Winner becomes King; ties keep the current King.
export function kingOfTheCastle(round, system) {
  let king = null;
  const holesWon = {};
  const streak = {};
  round.players.forEach(p => { holesWon[p.id] = 0; streak[p.id] = 0; });
  const order = Object.keys(round.scores).map(Number).sort((a, b) => a - b);
  for (const ti of order) {
    const byPlayer = round.scores[ti];
    let best = -1, winners = [];
    round.players.forEach(p => {
      const arrows = byPlayer[p.id];
      if (!arrows) return;
      const s = bestArrow(system, arrows);
      if (s > best) { best = s; winners = [p.id]; } else if (s === best) winners.push(p.id);
    });
    if (winners.length === 0) continue;
    let w;
    if (winners.length === 1) w = winners[0];
    else if (king && winners.includes(king)) w = king;
    else w = null; // tie between non-kings: nobody takes it
    if (w) {
      holesWon[w] += 1;
      if (w === king) streak[w] += 1; else { round.players.forEach(p => (streak[p.id] = 0)); streak[w] = 1; king = w; }
    }
  }
  return { king, holesWon, streak };
}

// Skins: each target is a skin, ties carry over.
export function skins(round, system) {
  const won = {};
  round.players.forEach(p => (won[p.id] = 0));
  let carry = 1;
  const order = Object.keys(round.scores).map(Number).sort((a, b) => a - b);
  const log = [];
  for (const ti of order) {
    const byPlayer = round.scores[ti];
    let best = -1, winners = [];
    round.players.forEach(p => {
      const arrows = byPlayer[p.id];
      if (!arrows) return;
      const s = bestArrow(system, arrows);
      if (s > best) { best = s; winners = [p.id]; } else if (s === best) winners.push(p.id);
    });
    if (winners.length === 1) { won[winners[0]] += carry; log.push({ ti, winner: winners[0], skins: carry }); carry = 1; }
    else { log.push({ ti, winner: null, skins: carry }); carry += 1; }
  }
  return { won, carry, log };
}

// Guess the distance: points for closeness of the call.
export function distancePoints(guess, actual) {
  if (guess == null || actual == null) return 0;
  const d = Math.abs(guess - actual);
  if (d <= 1) return 5;
  if (d <= 2) return 3;
  if (d <= 3) return 1;
  return 0;
}

export function guessTotals(round) {
  const out = {};
  round.players.forEach(p => (out[p.id] = { pts: 0, calls: 0, absErr: 0 }));
  round.targets.forEach((t, ti) => {
    if (t.distanceActual == null || !t.distanceGuess) return;
    round.players.forEach(p => {
      const g = t.distanceGuess[p.id];
      if (g == null) return;
      out[p.id].pts += distancePoints(g, t.distanceActual);
      out[p.id].calls += 1;
      out[p.id].absErr += Math.abs(g - t.distanceActual);
    });
  });
  return out;
}

// Handicap suggestion: average points per target over past rounds, relative to the group's par.
// Returns points-per-target to add (positive helps weaker archers).
export function suggestHandicap(history, playerName, systemKey) {
  const rounds = history.filter(r => r.systemKey === systemKey);
  const perTarget = [];
  rounds.slice(-8).forEach(r => {
    const p = r.players.find(x => x.name.toLowerCase() === playerName.toLowerCase());
    if (!p || !r.final?.totals?.[p.id]) return;
    const t = r.final.totals[p.id];
    if (t.targets) perTarget.push(t.gross / t.targets);
  });
  if (!perTarget.length) return null;
  const avg = perTarget.reduce((a, b) => a + b, 0) / perTarget.length;
  // par = best average seen for this system across all players, fallback to 80% of max first-arrow score
  const all = [];
  rounds.forEach(r => Object.values(r.final?.totals || {}).forEach(t => t.targets && all.push(t.gross / t.targets)));
  const par = all.length ? Math.max(...all) : avg;
  return Math.round((par - avg) * 10) / 10;
}
