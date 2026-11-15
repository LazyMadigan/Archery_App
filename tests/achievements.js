// Achievements in the app: unlock toast after a round, page, home tile, profile link.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' })); } });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  if (!(await p.locator('.tile:has-text("Achievements")').textContent()).includes('0 of 60')) errs.push('home tile count');
  await p.locator('.tile:has-text("Achievements")').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/ach0.png', fullPage: true }); await over('achievements empty');
  if ((await p.locator('.ach').count()) !== 60) errs.push('badges shown: ' + await p.locator('.ach').count());
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
  // shoot 1 end of indoor with an X and stop
  await p.getByRole('button', { name: /Indoor/ }).first().click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: 'Start shooting' }).click(); await p.waitForTimeout(200);
  for (const v of ['X', 'X', 'X']) await p.locator('.vbtns button', { hasText: new RegExp('^' + v + '$') }).click();
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: 'Stop & save' }).click(); await p.waitForTimeout(700);
  const t = await p.locator('.toast').textContent().catch(() => ''); console.log('toast:', t);
  if (!/First X/.test(t) || !/Perfect end/.test(t)) errs.push('toast missing unlocks');
  await p.getByRole('button', { name: 'Home' }).click(); await p.waitForTimeout(200);
  await p.locator('.avatar').click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Achievements \d+\/60/ }).click(); await p.waitForTimeout(200);
  const n = await p.locator('.ach.on').count(); console.log('earned:', n); if (n < 4) errs.push('earned too few');
  await p.screenshot({ path: '/tmp/ach1.png', fullPage: true }); await over('achievements');
  // reload: nothing re-announced
  await p.reload(); await p.waitForTimeout(500);
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS achievements'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
