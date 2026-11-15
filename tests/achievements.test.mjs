// Unit tests for the achievements engine (node tests/achievements.test.mjs)
import { evaluate, TOTAL } from '../src/achievements.js';
import { SYSTEMS } from '../src/scoring.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
ok(TOTAL === 60, 'there are 60 achievements, got ' + TOTAL);
const ids = evaluate([], 'Me', k => SYSTEMS[k]).map(a => a.id); ok(new Set(ids).size === ids.length, 'ids unique');
const D = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const me = { id: 'm', name: 'Me', bow: 'recurve' }, mate = { id: 'o', name: 'Oisín', bow: 'recurve' };
const end = vs => vs.map(v => ({ v }));
const indoor = (t, ends, extra = {}) => ({ kind: 'indoor', started: t, roundKey: 'wa18', name: 'WA 18', face: '40', scheme: 'wa10', dist: 18, ends: ends.length, arrows: 3, games: { total: true }, players: [me], scores: { m: ends }, final: { ended: t + 3600e3 }, ...extra });
const td = (t, zones, extra = {}) => ({ started: t, mode: 'fun', systemKey: 'ifaa_hunting', arrows: 1, players: [me, mate], courseName: 'Dargle', targets: zones.map(() => ({})), scores: Object.fromEntries(zones.map((z, i) => [i, { m: [z], o: ['body'] }])), games: { total: true, king: true }, final: { ended: t, king: { king: 'm' } }, ...extra });
const H = [
  indoor(D(2026, 11, 2, 7), Array.from({ length: 20 }, () => end([10, 9, 9]))),                 // Mon 7am, 560
  indoor(D(2026, 11, 4), [end(['X', 'X', 10]), ...Array.from({ length: 19 }, () => end([10, 10, 9]))]), // Wed, PB 589 (+29), perfect end
  td(D(2026, 11, 8), Array(10).fill('centre')),                                                   // Sun: 10 centres, king
  { ...indoor(D(2026, 11, 15, 22), [end([6, 6, 6])]), kind: 'field', roundKey: 'wafield', scheme: 'wafield', face: 'f60', dist: 40, ends: 1 }, // Sun 10pm
];
const got = Object.fromEntries(evaluate(H, 'Me', k => SYSTEMS[k]).map(a => [a.id, a]));
for (const id of ['a100', 'r1', 'f3d', 'findoor', 'ffield', 'fmates', 'w2', 'w3', 'early', 'owl', 'allthree', 'x1', 'perfect', 'clean', 'wa450', 'wa500', 'wa550', 'wa570', 'p90', 'pb1', 'pb20', 'c1', 'c5', 'c10', 'clean3d', 'p3d75', 'king', 'fld75']) ok(got[id].done, id + ' should be earned');
for (const id of ['a250', 'r10', 's3', 's6', 'b2b', 'double', 'weekend', 'x10', 'perfect3', 'pb3', 'skins', 'sets', 'wins3', 'flaser', 'fgoal', 'vg250', 'eyes']) ok(!got[id].done, id + ' should NOT be earned');
ok(got.a250.have === got.a250.need * 0 + Math.min(250, 120 + 10 + 3), 'arrow progress ' + got.a250.have);
ok(got.wa570.date === H[1].final.ended, 'WA 570 dated to the round that earned it');
// someone else's rounds don't count
ok(!evaluate(H, 'Nobody', k => SYSTEMS[k]).some(a => a.done), 'other names earn nothing');
// weekend + double + back to back
const W = [indoor(D(2026, 11, 7), [end([5, 5, 5])]), indoor(D(2026, 11, 8, 10), [end([5, 5, 5])]), indoor(D(2026, 11, 8, 15), [end([5, 5, 5])])];
const g2 = Object.fromEntries(evaluate(W, 'Me', k => SYSTEMS[k]).map(a => [a.id, a.done])); ok(g2.weekend && g2.double && g2.b2b, 'weekend/double/b2b');
const S = [D(2026, 10, 27), D(2026, 11, 5), D(2026, 11, 12)].map(t => indoor(t, [end([5, 5, 5])])); // Tue, Thu, Thu: 3 Monday-weeks
ok(Object.fromEntries(evaluate(S, 'Me', k => SYSTEMS[k]).map(a => [a.id, a.done])).s3, '3 weeks in a row');
ok(!Object.fromEntries(evaluate([S[0], S[2]], 'Me', k => SYSTEMS[k]).map(a => [a.id, a.done])).s3, 'gap week breaks streak');
console.log(fail ? `${fail} failed` : 'all achievement tests pass'); process.exit(fail ? 1 : 0);
