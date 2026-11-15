const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] })).newPage(); await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); } catch {} }); p.on('dialog', d => d.accept()); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width || window.innerWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(700);
  await p.locator('.avatar').click(); await p.locator('#pf-name').fill('Cian'); await p.getByRole('button',{name:'Compound',exact:true}).click(); await over('profile'); await p.locator('#pfSave').click(); await p.waitForTimeout(150); await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
  await p.locator('button.disc', { hasText: 'Indoor' }).click(); await p.waitForTimeout(200);
  console.log('autofill bow:', await p.locator('.bowsel').first().inputValue());
  await p.getByRole('button',{name:'+ Add player'}).click(); await p.locator('input[placeholder="Player 2"]').fill('James'); await p.waitForTimeout(100); await over('tsetup');
  for (let i=0;i<9;i++) await p.locator('.stepper button').first().click();   // 1 end
  await p.screenshot({ path: '/tmp/b1.png', fullPage: true });
  await p.getByRole('button',{name:'Start shooting'}).click(); await p.waitForTimeout(300); await over('tplay');
  const f = p.locator('.facewrap .face'); const bb = await f.boundingBox();
  const tapR = async r => { await p.mouse.click(bb.x + bb.width*(0.5 + r*100/220), bb.y + bb.height*0.5); await p.waitForTimeout(80); };
  for (let i=0;i<3;i++) await tapR(0.08);          // Cian (compound): outer 10 ring -> 9 each
  await p.screenshot({ path: '/tmp/b2.png', fullPage: true });
  for (let i=0;i<3;i++) await tapR(0.08);          // James (recurve): -> 10 each
  const rows = await p.locator('.player').allInnerTexts(); console.log(rows.map(s => s.replace(/\n/g,' ')).join(' || '));
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
