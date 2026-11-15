// Indoor/Field practice: goal is required, shows while shooting, saved with the round.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] }); const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' })); } catch {} });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  const fail = m => { errs.push(m); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  for (const kind of ['Indoor', 'Field']) {
    await p.getByRole('button', { name: new RegExp(kind) }).first().click(); await p.waitForTimeout(200);
    if (!(await p.locator('h3:has-text("What are we doing")').count())) fail(kind + ': no What are we doing');
    await p.locator('.gamecard:has-text("Practice")').click(); await p.waitForTimeout(200);
    if (await p.locator('h3:has-text("Game")').count()) fail(kind + ': Game still shown in practice');
    const start = p.locator('#tStart');
    if ((await start.textContent()) !== 'Start practice') fail(kind + ': button label');
    if (!(await start.isDisabled())) fail(kind + ': can start without a goal');
    await p.locator('#tGoal').fill('   '); if (!(await start.isDisabled())) fail(kind + ': whitespace goal accepted');
    await p.locator('#tGoal').fill('Strong follow-through on every arrow');
    if (await start.isDisabled()) fail(kind + ': still disabled with goal');
    await p.screenshot({ path: `/tmp/pr-${kind}-setup.png`, fullPage: true }); await over(kind + ' setup');
    await start.click(); await p.waitForTimeout(300);
    if (!(await p.locator('.goalbar:has-text("Strong follow-through")').count())) fail(kind + ': goal not shown in play');
    await p.screenshot({ path: `/tmp/pr-${kind}-play.png` }); await over(kind + ' play');
    await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
    await p.locator('.topbar button').first().click(); await p.waitForTimeout(200);
    if (!(await p.locator('.live-title:has-text("practice in progress")').count())) fail(kind + ': live card title');
    await p.getByRole('button', { name: 'Stop & save' }).click(); await p.waitForTimeout(300);
    await p.locator('textarea').fill('Mostly held it'); await p.waitForTimeout(100);
    await p.screenshot({ path: `/tmp/pr-${kind}-summary.png`, fullPage: true }); await over(kind + ' summary');
    const h = await p.evaluate(() => JSON.parse(localStorage.getItem('wa.history'))[0]);
    if (h.mode !== 'practice' || h.goal !== 'Strong follow-through on every arrow' || h.review !== 'Mostly held it') fail(kind + ': saved ' + JSON.stringify({ m: h.mode, g: h.goal, r: h.review }));
    await p.getByRole('button', { name: 'Home' }).click(); await p.waitForTimeout(200);
  }
  // Fun round still starts without a goal
  await p.getByRole('button', { name: /Indoor/ }).first().click(); await p.waitForTimeout(200);
  if (await p.locator('#tStart').isDisabled()) fail('fun round blocked');
  if (!(await p.locator('h3:has-text("Game")').count())) fail('Game missing in fun round');
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS practice'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
