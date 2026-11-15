const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(); await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); } catch {} });
  const errs = []; p.on('dialog', d => d.accept()); p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/s1.png' });
  await p.locator('button.disc', { hasText: '3D Course' }).click(); await p.waitForTimeout(200);
  await p.locator('input[placeholder="Player 1"]').fill('Cian'); await p.getByText('+ Add player').click(); await p.locator('input[placeholder="Player 2"]').fill('James');
  await p.locator('.gamecard:has-text("King of the Castle")').click(); await p.locator('.gamecard:has-text("Guess the distance")').click();
  await p.screenshot({ path: '/tmp/s2.png', fullPage: true });
  await p.getByText('Start shooting').click(); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/s3.png' });
  await p.getByRole('button',{name:/Small game/}).click(); await p.waitForTimeout(400); await p.screenshot({path:'/tmp/s3b.png'}); console.log(await p.locator('.page').innerText());
  await p.getByRole('button',{name:/Fox, bedded/}).click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/s4.png' });
  await p.getByRole('button',{name:/Rear/}).click(); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/s4b.png' }); await p.getByRole('button',{name:'Draw the order'}).click(); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/s5.png', fullPage: true }); const gi=p.locator('.card input[type=number]'); await gi.nth(0).fill('28'); await gi.nth(0).press('Tab'); await gi.nth(1).fill('30'); await gi.nth(1).press('Tab'); await p.waitForTimeout(200); await p.getByText('Lock calls').click(); await p.waitForTimeout(300);
  // tap the diagram near centre of hip ring
  const d = p.locator('.diagram'); const bb = await d.boundingBox(); await p.mouse.click(bb.x + bb.width * 0.62, bb.y + bb.height * 0.55); await p.waitForTimeout(200);
  await p.locator('.zones button.vital').click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/s6.png', fullPage: true });
  await p.getByText('Board').click(); await p.waitForTimeout(200); await p.screenshot({ path: '/tmp/s7.png' }); await p.getByText('Finish & save').click(); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/s8.png', fullPage: true }); await p.locator('.topbar button').first().click(); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/s9.png', fullPage: true }); await p.getByText('Progress').click(); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/s10.png', fullPage: true });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
