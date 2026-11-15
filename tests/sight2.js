// Sight marks: list grouped by bow type with bow name + sighting date; tap a row to edit/delete; chart Edit sheet; extra arrow.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage();
  await p.addInitScript(() => { if (sessionStorage.x) return; sessionStorage.x = 1; const t = Date.UTC(2026, 10, 14, 12);
    localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' }));
    localStorage.setItem('wa.sight', JSON.stringify([
      { id: 'a', bow: 'X10 Hero', type: 'compound', note: '', created: t, updated: t, marks: [] },
      { id: 'b', bow: 'Mathews Title', type: 'compound', note: 'outdoor', created: t, updated: t, marks: [{ d: 20, s: 3.2, calls: [], at: t }, { d: 30, s: 4.6, calls: [], at: t }, { d: 40, s: 6, calls: [], at: t }] },
      { id: 'c', bow: '30lb Hoyt', type: 'recurve', note: '', created: t, updated: t, marks: [{ d: 18, s: 2, calls: [], at: t }] }])); });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const marks = id => p.evaluate(i => JSON.parse(localStorage.getItem('wa.sight')).find(c => c.id === i)?.marks.map(m => m.d + '=' + m.s).join(' ') ?? 'GONE', id);
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(500);
  await p.locator('.tile:has-text("Sight marks")').click(); await p.waitForTimeout(200);
  const heads = await p.locator('.page h3').allTextContents(); console.log('groups', heads); if (heads.join() !== 'Recurve,Compound') errs.push('grouping ' + heads);
  const first = await p.locator('.schart-item', { hasText: 'Mathews' }).innerText(); console.log('tile:', first.replace(/\n/g, ' | ')); if (!/Mathews Title · outdoor/.test(first) || !/Sighted .*2026/.test(first)) errs.push('tile text');
  const comp = await p.locator('.list').nth(1).innerText(); if (!/Mathews/.test(comp) || !/X10 Hero/.test(comp)) errs.push('compounds not grouped together');
  await p.screenshot({ path: '/tmp/s2-list.png', fullPage: true }); await over('list');
  await p.locator('.schart-item', { hasText: 'Mathews' }).click(); await p.waitForTimeout(200);
  // tap a shot row -> edit
  await p.locator('.stable tr.tap', { hasText: '30 m' }).click(); await p.waitForTimeout(150); await p.screenshot({ path: '/tmp/s2-sheet.png' });
  await p.locator('#smEdit').fill('4.8'); await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(150);
  if (!(await marks('b')).includes('30=4.8')) errs.push('edit via row failed ' + await marks('b'));
  // tap a curve row -> save as mark
  await p.locator('.stable tr.tap', { hasText: '25 m' }).click(); await p.waitForTimeout(150); await p.getByRole('button', { name: 'Save as mark' }).click(); await p.waitForTimeout(150);
  if (!(await marks('b')).includes('25=')) errs.push('curve row not saved as mark');
  // delete via row sheet
  await p.locator('.stable tr.tap', { hasText: '40 m' }).click(); await p.waitForTimeout(150); await p.getByRole('button', { name: 'Delete mark' }).click(); await p.waitForTimeout(150);
  if ((await marks('b')).includes('40=')) errs.push('delete via row failed');
  // delete via Marks list button
  await p.getByRole('button', { name: 'Delete 20 m' }).click(); await p.waitForTimeout(150); if ((await marks('b')).includes('20=')) errs.push('delete via list failed');
  // edit via Marks list button
  await p.getByRole('button', { name: 'Edit 30 m' }).click(); await p.locator('#smEdit').fill('5'); await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(150);
  if (!(await marks('b')).includes('30=5')) errs.push('edit via list failed');
  console.log('marks now', await marks('b'));
  await p.screenshot({ path: '/tmp/s2-chart.png', fullPage: true }); await over('chart');
  // chart details: rename + change type
  await p.locator('#scEdit').click(); await p.locator('#scBow').fill('Mathews Title 70lb'); await p.locator('.sheet select').selectOption('recurve'); await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(150);
  const c = await p.evaluate(() => JSON.parse(localStorage.getItem('wa.sight')).find(c => c.id === 'b')); if (c.bow !== 'Mathews Title 70lb' || c.type !== 'recurve') errs.push('chart edit failed');
  // extra arrow during sighting
  await p.getByRole('button', { name: 'Shoot a session' }).click(); await p.locator('#sStart').click(); await p.waitForTimeout(150);
  for (let i = 0; i < 3; i++) await p.getByRole('button', { name: '● On' }).click();
  await p.locator('#sExtra').click(); await p.waitForTimeout(100); await p.getByRole('button', { name: '↑ High' }).click();
  const dots = await p.locator('.scalls .sc').count(), called = await p.locator('.scalls .sc.high, .scalls .sc.on').count(); console.log('arrows', dots, 'called', called); if (dots !== 4 || called !== 4) errs.push('extra arrow');
  await p.screenshot({ path: '/tmp/s2-extra.png', fullPage: true }); await over('shooting');
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(150);
  // delete whole chart from Edit sheet
  await p.locator('#scEdit').click(); await p.getByRole('dialog').getByRole('button', { name: 'Delete this chart' }).click(); await p.waitForTimeout(200);
  if ((await marks('b')) !== 'GONE') errs.push('chart delete failed');
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS sight2'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
