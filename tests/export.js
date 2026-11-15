const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'], acceptDownloads: true }); const p = await ctx.newPage(); p.on('dialog', d => d.accept()); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); localStorage.setItem('wa.rulesOff', JSON.stringify(['3d_king','3d_skins','3d_guess','t_king','t_sets']));  } catch {} });
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(700);
  await p.locator('.avatar').click(); await p.locator('#pf-name').fill('Cian Madigan'); await p.locator('#pf-clubsel').selectOption('Wicklow Archers'); await p.locator('.bowchip', { hasText: 'Recurve' }).click(); await p.locator('#pfSave').click(); await p.locator('.topbar button').first().click();
  // indoor: 2 ends, tapped arrows
  await p.locator('button.disc', { hasText: 'Indoor' }).click(); for (let i=0;i<18;i++) await p.locator('.stepper button').first().click();
  await p.getByRole('button',{name:'Start shooting'}).click(); await p.waitForTimeout(250);
  for (let e=0;e<2;e++) { const f = p.locator('.facewrap .face'); const bb = await f.boundingBox(); for (const [dx,dy] of [[.5,.5],[.55,.47],[.6,.56]]) { await p.mouse.click(bb.x+bb.width*dx, bb.y+bb.height*dy); await p.waitForTimeout(60); } await p.locator('.bottombar button.primary').click(); await p.waitForTimeout(250); }
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(250);
  // 3D laser practice, 2 targets with sight settings
  await p.locator('button.disc', { hasText: '3D Course' }).click(); await p.locator('.gamecard', { hasText: 'Laser practice' }).click(); await p.getByText('Start practice').click(); await p.waitForTimeout(250);
  for (const [cat, an, dist, sight] of [['Bears','Polar bear','42','27'],['Small game','Fox, bedded','16','7']]) {
    await p.getByRole('button',{name:new RegExp(cat)}).click(); await p.getByRole('button',{name:new RegExp(an)}).click(); await p.waitForTimeout(200);
    const side = p.getByRole('button',{name:/Left side/}); if (await side.count()) await side.first().click(); await p.waitForTimeout(150);
    const ins = p.locator('.card input[type=number]'); await ins.nth(0).fill(dist); await ins.nth(0).press('Tab'); await p.waitForTimeout(100); await p.locator('.card input[placeholder="e.g. 25"]').fill(sight); await p.locator('.card input[placeholder="e.g. 25"]').press('Tab');
    await p.locator('.zones button.vital').click(); await p.waitForTimeout(100); await p.locator('.bottombar button.primary').click(); await p.waitForTimeout(250);
  }
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200); await p.getByText('Finish & save').click(); await p.waitForTimeout(400);
  // export
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(500); await p.locator('.avatar').click(); await p.waitForTimeout(200);
  if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width || innerWidth > screen.width)) errs.push('OVERFLOW');
  await p.locator('.card', { hasText: 'Export my data' }).screenshot({ path: '/tmp/exp-card.png' });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#xlBtn').click()]);
  const out = '/tmp/' + dl.suggestedFilename(); await dl.saveAs(out); console.log('downloaded:', out);
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
