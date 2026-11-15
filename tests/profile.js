// Profile: read-only details under the photo once set up; Edit details unlocks them; Cancel discards.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian Madigan', club: 'Wicklow Archers', ai: '12345', bows: ['recurve', 'compound'] })); } });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  await p.locator('.avatar').click(); await p.waitForTimeout(200);
  if (await p.locator('#pf-name').count()) errs.push('fields editable before Edit');
  const info = await p.locator('.pinfo').textContent(); if (!/12345/.test(info) || !/Recurve, Compound/.test(info) || !/Not set/.test(info)) errs.push('read-only info: ' + info);
  await p.screenshot({ path: '/tmp/prof-view.png', fullPage: true }); await over('profile view');
  await p.locator('#pfEdit').click(); await p.waitForTimeout(150);
  await p.locator('#pf-club').fill('Changed'); await p.getByRole('button', { name: 'Cancel' }).click(); await p.waitForTimeout(150);
  if (!/Wicklow Archers/.test(await p.locator('.pinfo').textContent())) errs.push('Cancel did not discard');
  await p.locator('#pfEdit').click(); await p.locator('#pf-clubNo').fill('42'); await p.locator('#pfSave').click(); await p.waitForTimeout(200);
  if (await p.locator('#pf-name').count()) errs.push('still editing after save');
  if (!/42/.test(await p.locator('.pinfo').textContent())) errs.push('saved value not shown');
  await p.screenshot({ path: '/tmp/prof-saved.png', fullPage: true });
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS profile'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
