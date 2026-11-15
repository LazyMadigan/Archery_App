// New games: King battles of N ends, Last archer standing, Climb the ladder, Bingo (indoor), plus 3D King battles.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] }); const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); localStorage.setItem('wa.rulesOff', JSON.stringify(['3d_king','3d_last','3d_ladder','3d_bingo','t_king','t_last','t_ladder','t_bingo'])); } catch {} });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width || innerWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  const indoor = async (game, ends, setup) => {
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(500);
    await p.locator('button.disc', { hasText: 'Indoor' }).click(); await p.waitForTimeout(200);
    await p.locator('input[placeholder="Player 1"]').fill('Cian'); await p.getByRole('button', { name: '+ Add player' }).click(); await p.locator('input[placeholder="Player 2"]').fill('James');
    await p.locator('.gamecard', { hasText: game }).click(); await p.waitForTimeout(150);
    if (setup) await setup();
    const st = p.locator('.optblock .stepper').first(); for (let i = 0; i < 20; i++) await st.locator('button').first().click(); for (let i = 1; i < ends; i++) await st.locator('button').last().click();
    await over('tsetup ' + game); await p.screenshot({ path: `/tmp/g-setup-${game.split(' ')[0]}.png`, fullPage: true });
    await p.getByRole('button', { name: 'Start shooting' }).click(); await p.waitForTimeout(200);
  };
  const end = async (a, b) => { for (const v of a) await p.locator('.vbtns button', { hasText: new RegExp('^' + v + '$') }).click(); for (const v of b) await p.locator('.vbtns button', { hasText: new RegExp('^' + v + '$') }).click(); };
  const next = async () => { await p.locator('.bottombar button.primary').click(); await p.waitForTimeout(150); };
  // King, battles of 2 ends: Cian wins battle 1 (end totals 30+20 vs 27+27), James wins battle 2
  await indoor('King of the Castle', 4, async () => { await p.locator('.boutpick button', { hasText: /^2$/ }).click(); });
  await end(['10','10','10'], ['9','9','9']); await next(); console.log('king bar after end 1:', await p.locator('.gamebar').innerText());
  await end(['7','7','6'], ['9','9','9']); await next(); console.log('king bar after battle 1:', await p.locator('.gamebar').innerText());
  await p.screenshot({ path: '/tmp/g-king-play.png', fullPage: true }); await over('tplay king');
  await end(['5','5','5'], ['10','10','10']); await next(); await end(['5','5','5'], ['10','10','10']); await next(); await p.waitForTimeout(300);
  console.log('king summary:', (await p.locator('.card .pill').allInnerTexts()).filter(t => /battle|crown/.test(t)).join(' | '));
  // Last archer standing over 4 ends: James loses every end
  await indoor('Last archer standing', 4);
  for (let i = 0; i < 3; i++) { await end(['10','10','10'], ['5','5','5']); await next(); }
  await p.locator('.bottombar button', { hasText: 'Board' }).click(); await p.waitForTimeout(150); console.log('last bar:', await p.locator('.gamebar').innerText(), '| cells:', (await p.locator('table td.num:last-child').allInnerTexts()).join(','));
  await p.screenshot({ path: '/tmp/g-last-board.png', fullPage: true }); await over('tboard last');
  // Bingo: Cian fills 10,9,8,7,6 in 6 arrows
  await indoor('Bingo', 3);
  await end(['10','9','9'], ['10','10','10']); await next(); await end(['8','7','6'], ['10','10','10']); await next();
  await p.locator('.bottombar button', { hasText: 'Board' }).click(); await p.waitForTimeout(150); console.log('bingo bar:', await p.locator('.gamebar').innerText());
  // Ladder
  await indoor('Climb the ladder', 3);
  await end(['5','5','5'], ['9','9','9']); await next(); await end(['8','8','8'], ['8','8','8']); await next(); await end(['9','9','9'], ['7','7','7']); await next(); await p.waitForTimeout(300);
  console.log('ladder summary:', (await p.locator('.card .pill').allInnerTexts()).filter(t => /rung/.test(t)).join(' | '));
  // 3D King setup shows the battle picker
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(400); await p.locator('button.disc', { hasText: '3D Course' }).click(); await p.waitForTimeout(250);
  await p.locator('.gamecard', { hasText: 'King of the Castle' }).click(); await p.waitForTimeout(150);
  await p.locator('.boutpick button', { hasText: /^4$/ }).click(); console.log('3D bout:', await p.locator('.boutpick .stepper b').innerText());
  for (const g of ['Last archer standing', 'Climb the ladder', '3D Bingo']) if (!(await p.locator('.gamecard', { hasText: g }).count())) errs.push('missing 3D game ' + g);
  await p.locator('.boutpick').screenshot({ path: '/tmp/g-3d-bout.png' }); await over('3d setup');
  console.log(errs.length ? errs : 'no errors'); await b.close(); })();
