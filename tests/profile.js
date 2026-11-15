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
  await p.locator('#pf-clubsel').selectOption('__other'); await p.locator('#pf-club').fill('Changed'); await p.getByRole('button', { name: 'Cancel' }).click(); await p.waitForTimeout(150);
  if (!/Wicklow Archers/.test(await p.locator('.pinfo').textContent())) errs.push('Cancel did not discard');
  await p.locator('#pfEdit').click(); await p.locator('#pf-clubNo').fill('42'); await p.locator('#pfSave').click(); await p.waitForTimeout(200);
  if (await p.locator('#pf-name').count()) errs.push('still editing after save');
  if (!/42/.test(await p.locator('.pinfo').textContent())) errs.push('saved value not shown');
  await p.screenshot({ path: '/tmp/prof-saved.png', fullPage: true });
  // privacy & contact card, stays-on-phone line, no subtitle in top bar
  if (await p.locator('.topbar .sub').count()) errs.push('top bar still has a subtitle');
  if (!/Stored only on this phone/.test(await p.locator('.pview').innerText())) errs.push('stays-on-phone line missing');
  const priv = await p.locator('#privacy').innerText(); if (!/GDPR/.test(priv) || !/Contact us/.test(priv) || !/Delete all my data/.test(priv)) errs.push('privacy card incomplete');
  if (!(await p.locator('#privacy a[href*="github.com"]').count())) errs.push('contact link');
  await p.locator('#privacy').scrollIntoViewIfNeeded(); await p.screenshot({ path: '/tmp/prof-privacy.png' });
  await p.locator('#pfWipe').click(); await p.waitForTimeout(600);
  const left = await p.evaluate(() => ({ name: (JSON.parse(localStorage.getItem('wa.profile') || '{}').name || ''), sight: (JSON.parse(localStorage.getItem('wa.sight') || '[]')).length, hist: (JSON.parse(localStorage.getItem('wa.history') || '[]')).length })); if (left.name || left.sight || left.hist) errs.push('wipe left data ' + JSON.stringify(left));
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS profile'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
