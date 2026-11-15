const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] }); const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(700);
  console.log('first open shows:', await p.locator('.welcome-card h1').innerText().catch(()=>'NO WELCOME'));
  if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width || innerWidth > screen.width)) errs.push('OVERFLOW');
  await p.screenshot({ path: '/tmp/wel.png' });
  await p.getByRole('button',{name:'Skip for now'}).click(); await p.waitForTimeout(300);
  console.log('after skip:', await p.locator('.topbar .title').innerText());
  await p.reload(); await p.waitForTimeout(600); console.log('after reload:', await p.locator('.welcome').count() ? 'welcome AGAIN' : 'home');
  // fresh phone, set up profile path
  const p2 = await (await b.newContext({ ...devices['Pixel 7'] })).newPage(); await p2.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p2.waitForTimeout(600);
  await p2.getByRole('button',{name:'Set up my profile'}).click(); await p2.waitForTimeout(200); console.log('setup goes to:', await p2.locator('.topbar .title').innerText());
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
