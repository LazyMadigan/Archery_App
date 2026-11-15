const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] }); const p = await ctx.newPage(); await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); localStorage.setItem('wa.rulesOff', JSON.stringify(['3d_king','3d_skins','3d_guess','t_king','t_sets']));  } catch {} }); p.on('dialog', d => d.accept()); const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  const over = async n => { const r = await p.evaluate(() => document.documentElement.scrollWidth > screen.width || window.innerWidth > screen.width); if (r) errs.push('OVERFLOW ' + n); };
  await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(700); await p.screenshot({ path: '/tmp/i0.png', fullPage: true }); await over('home');
  // profile
  await p.locator('.avatar').click(); await p.waitForTimeout(200);
  await p.locator('#pf-name').fill('Cian Madigan'); await p.locator('#pf-ai').fill('12345'); await p.locator('#pf-clubsel').selectOption('Wicklow Archers'); await p.locator('#pf-clubNo').fill('42');
  await p.screenshot({ path: '/tmp/i1.png', fullPage: true }); await over('profile');
  await p.locator('#pfSave').click(); await p.waitForTimeout(150); await p.locator('.topbar button').first().click(); await p.waitForTimeout(300);
  // indoor vegas, 2 players, set play
  await p.getByRole('button',{name:/Indoor/}).click(); await p.waitForTimeout(200); await over('tsetup');
  console.log('player1 autofill:', await p.locator('input[placeholder="Player 1"]').inputValue());
  await p.selectOption('.card select:not(.bowsel)', 'vegas'); await p.waitForTimeout(150);
  await p.getByRole('button',{name:'+ Add player'}).click(); await p.locator('input[placeholder="Player 2"]').fill('James');
  await p.locator('.gamecard:has-text("Set play")').click(); await p.waitForTimeout(150);
  await p.locator('.stepper button').first().click(); await p.locator('.stepper button').first().click(); for (let i=0;i<5;i++) await p.locator('.stepper button').first().click(); // 10 -> 3 ends
  await p.screenshot({ path: '/tmp/i2.png', fullPage: true });
  await p.getByRole('button',{name:'Start shooting'}).click(); await p.waitForTimeout(300); await over('tplay');
  // shoot 3 ends: tap the face for player 1, buttons for player 2
  for (let e=0;e<3;e++) {
    const f = p.locator('.facewrap .face'); const bb = await f.boundingBox();
    for (const [dx,dy] of [[0.5,0.5],[0.56,0.52],[0.62,0.45]]) { await p.mouse.click(bb.x+bb.width*dx, bb.y+bb.height*dy); await p.waitForTimeout(60); }
    for (const v of ['10','9','X']) { await p.locator('.vbtns button', { hasText: new RegExp('^'+v+'$') }).click(); await p.waitForTimeout(60); }
    if (e===1) await p.screenshot({ path: '/tmp/i3.png', fullPage: true });
    await p.locator('.bottombar button.primary').click(); await p.waitForTimeout(250);
  }
  await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/i4.png', fullPage: true }); await over('tsummary');
  // field round quick
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(300);
  await p.getByRole('button',{name:/^.*Field/}).last().click(); await p.waitForTimeout(200); await over('field-setup');
  await p.getByRole('button',{name:'60 m'}).click(); await p.getByRole('button',{name:'80 cm'}).click(); await p.waitForTimeout(100);
  await p.screenshot({ path: '/tmp/i5.png', fullPage: true });
  await p.getByRole('button',{name:'Start shooting'}).click(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/i6.png', fullPage: true }); await over('field-play');
  await p.locator('.bottombar button').nth(1).click(); await p.waitForTimeout(200); await p.getByRole('button',{name:'Delete'}).click(); await p.waitForTimeout(300);
  await p.getByRole('button',{name:/Progress/}).click(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/i7.png', fullPage: true }); await over('progress');
  await p.locator('.topbar button').first().click(); await p.locator('.avatar').click(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/i8.png', fullPage: true });
  await p.locator('.topbar button').first().click(); await p.getByRole('button',{name:/History/}).click(); await p.waitForTimeout(200); await over('history');
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
