// Game rules pop-up: appears when a game is picked, Skip/Got it close it, "Don't show again" sticks.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' })); } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const sheet = () => p.locator('.sheet').count();
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  await p.getByRole('button', { name: /Indoor/ }).first().click(); await p.waitForTimeout(200);
  await p.locator('.gamecard:has-text("Set play")').click(); await p.waitForTimeout(200);
  if (await sheet() !== 1) errs.push('no sheet for Set play');
  await p.screenshot({ path: '/tmp/rules-sets.png' });
  await p.getByRole('button', { name: 'Skip' }).click(); if (await sheet()) errs.push('Skip did not close');
  await p.locator('.gamecard:has-text("Set play")').click(); await p.waitForTimeout(100); if (await sheet()) errs.push('reshown for already-picked game');
  await p.locator('.gamecard:has-text("King of the Castle")').click(); await p.waitForTimeout(150);
  await p.locator('.sheet input[type=checkbox]').check(); await p.getByRole('button', { name: 'Got it' }).click();
  await p.locator('.gamecard:has-text("Total points")').click(); if (await sheet()) errs.push('sheet for Total points');
  await p.locator('.gamecard:has-text("King of the Castle")').click(); await p.waitForTimeout(150); if (await sheet()) errs.push('Don’t show again ignored');
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /3D Course/ }).first().click(); await p.waitForTimeout(300);
  for (const g of ['Skins', 'Guess the distance']) { await p.locator(`.gamecard:has-text("${g}")`).click(); await p.waitForTimeout(150); if (await sheet() !== 1) errs.push('no sheet for 3D ' + g); await p.screenshot({ path: `/tmp/rules-${g[0]}.png` }); await p.getByRole('button', { name: 'Got it' }).click(); }
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS rules'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
