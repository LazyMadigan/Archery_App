const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(); await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); } catch {} }); p.on('dialog', d => d.accept()); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(800);
  await p.locator('.tile', { hasText: '3D Courses' }).click(); await p.getByRole('button',{name:'Edit',exact:true}).first().click(); await p.waitForTimeout(300);
  await p.locator('.rowtap').nth(4).click(); await p.waitForTimeout(200);            // polar bear row
  const ins = p.locator('.pegrow input'); await ins.nth(2).fill('36'); await ins.nth(2).press('Tab'); await ins.nth(3).fill('-6'); await ins.nth(3).press('Tab');
  await p.screenshot({ path: '/tmp/dg1.png' });
  await p.getByRole('button',{name:'Save course'}).click(); await p.waitForTimeout(300);
  // reload: edits must survive the built-in refresh
  await p.reload(); await p.waitForTimeout(900);
  await p.locator('.tile', { hasText: '3D Courses' }).click(); await p.waitForTimeout(300);
  console.log('courses:', await p.locator('.item .t div').allInnerTexts());
  await p.getByRole('button',{name:'Edit',exact:true}).first().click(); await p.waitForTimeout(300);
  console.log('row 5 after reload:', await p.locator('.item').nth(4).locator('.pegsum').innerText());
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
