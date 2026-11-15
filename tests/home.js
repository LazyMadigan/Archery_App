// Home carousel: 3 slides (welcome first, high scores, Archery Ireland news), dots follow swipes.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' }));
    const t = Date.now() - 86400e3; localStorage.setItem('wa.history', JSON.stringify([{ id: 'a', kind: 'indoor', started: t, roundKey: 'wa18', name: 'WA 18', face: '40', scheme: 'wa10', dist: 18, ends: 1, arrows: 3, games: { total: true }, players: [{ id: 'm', name: 'Cian', bow: 'recurve' }], scores: { m: [[{ v: 'X' }, { v: 10 }, { v: 9 }]] }, final: { tally: { m: { total: 29, xs: 1, tens: 2, arrows: 3, avg: 9.67 } }, ended: t } }])); } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(800);
  if (await p.locator('.heroes .slide').count() !== 3) errs.push('slides: ' + await p.locator('.heroes .slide').count());
  if (await p.locator('.dots .dot').count() !== 3) errs.push('dots');
  if (!/Shoot well/.test(await p.locator('.heroes .slide').first().textContent())) errs.push('welcome not first');
  const hs = await p.locator('.hero.alt').textContent(); console.log('best:', hs.replace(/\s+/g, ' ').slice(0, 90)); if (!/29/.test(hs)) errs.push('PB missing on best slide');
  if (await p.locator('.hero.news a[href^="https://archery.ie"]').count() < 1) errs.push('news link');
  const hgt = await p.$$eval('.heroes .slide', s => s.map(x => Math.round(x.getBoundingClientRect().height))); console.log('heights', hgt); if (new Set(hgt).size !== 1) errs.push('slides differ in height');
  await p.screenshot({ path: '/tmp/home1.png' }); await over('home');
  await p.locator('.dots .dot').nth(1).click(); await p.waitForTimeout(700);
  if (!(await p.locator('.dots .dot').nth(1).getAttribute('class')).includes('on')) errs.push('dot 2 not active after tap');
  await p.screenshot({ path: '/tmp/home2.png' });
  await p.locator('.heroes').evaluate(t => t.scrollTo({ left: t.clientWidth * 2 })); await p.waitForTimeout(500);
  if (!(await p.locator('.dots .dot').nth(2).getAttribute('class')).includes('on')) errs.push('dot 3 not active after swipe');
  await p.screenshot({ path: '/tmp/home3.png' }); await over('home news');
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS home'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
