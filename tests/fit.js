const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const dev of ['Pixel 7', 'iPhone SE']) {
    const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage(); await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded','true'); localStorage.setItem('wa.rulesOff', JSON.stringify(['3d_king','3d_skins','3d_guess','t_king','t_sets']));  } catch {} }); p.on('dialog', d => d.accept());
    const check = async (name) => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, Math.min(window.innerWidth, screen.width), [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && e.offsetWidth).slice(0,3).map(e => e.tagName + '.' + e.className)]); console.log(dev, name, r[0] > r[1] ? 'OVERFLOW ' + r[0] + '>' + r[1] + ' ' + JSON.stringify(r[2]) : 'ok'); };
    await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(500); await check('home');
    await p.locator('button.disc', { hasText: '3D Course' }).click(); await p.waitForTimeout(200); await check('setup');
    await p.locator('.gamecard:has-text("Laser practice")').click(); await p.waitForTimeout(200); await check('setup-laser');
    await p.locator('.gamecard:has-text("Fun round")').click(); await p.locator('input[placeholder="Player 1"]').fill('Cian'); await p.getByText('+ Add player').click(); await p.locator('input[placeholder="Player 2"]').fill('Stephen'); await p.getByText('+ Add player').click(); await p.locator('input[placeholder="Player 3"]').fill('Mark'); await p.getByText('+ Add player').click(); await p.locator('input[placeholder="Player 4"]').fill('James');
    await p.locator('.gamecard:has-text("King of the Castle")').click(); await p.locator('.gamecard:has-text("Skins")').click(); await p.locator('.gamecard:has-text("Guess the distance")').click(); await p.locator('label:has-text("Handicap") input').check(); await p.waitForTimeout(200); await check('setup-full');
    await p.getByRole('button',{name:'Build'}).click(); await p.waitForTimeout(200); await check('course');
    await p.getByText('+ Add target').click(); await p.waitForTimeout(200); await check('picker');
    await p.getByRole('button',{name:/Big cats/}).click(); await p.waitForTimeout(200); await check('picker-cats');
    await p.getByRole('button',{name:/Black panther, walking/}).click(); await p.waitForTimeout(200); await check('course-1');
    await p.locator('.bottombar').getByRole('button',{name:'Done'}).click(); await p.getByText('Start shooting').click(); await p.waitForTimeout(300); await check('draw');
    await p.getByRole('button',{name:'Draw the order'}).click(); await p.waitForTimeout(300); await check('guess-gate');
    const gi = p.locator('.card input[type=number]'); for (let i=0;i<4;i++){ await gi.nth(i).fill(String(25+i)); await gi.nth(i).press('Tab'); } await p.waitForTimeout(200); await p.getByText('Lock calls').click(); await p.waitForTimeout(200); await check('play');
    for (const z of ['centre','vital','body','inner']) { await p.locator('.zones button.'+z).click(); await p.waitForTimeout(100); }
    await p.locator('.card input[type=number]').last().fill('27'); await p.locator('.card input[type=number]').last().press('Tab'); await p.waitForTimeout(200); await check('play-scored');
    await p.getByRole('button',{name:'Board'}).click(); await p.waitForTimeout(200); await check('board');
    await p.getByText('Finish & save').click(); await p.waitForTimeout(500); await check('summary');
    await p.screenshot({ path: `/tmp/fit-summary-${dev.replace(/ /g,'')}.png`, fullPage: true });
    await p.getByText('See my progress').click(); await p.waitForTimeout(300); await check('progress');
    await p.locator('.topbar button').first().click(); await p.waitForTimeout(200); await p.locator('.topbar .avatar').click(); await p.waitForTimeout(150); await p.locator('button[aria-label=Settings]').click(); await p.waitForTimeout(200); await check('settings');
    await p.getByText('About, privacy').click(); await p.waitForTimeout(200); await check('about');
    await p.goto((process.env.BASE || 'http://localhost:8111') + '/index.html'); await p.waitForTimeout(300); await p.getByRole('button',{name:/History/}).first().click(); await p.waitForTimeout(200); await check('history');
    await ctx.close();
  }
  await b.close();
})();
