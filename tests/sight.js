// Sight marks: two bows, a session with arrow calls, fitted chart, image + Excel export, saved charts.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'], acceptDownloads: true }); const p = await ctx.newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian' })); } });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/s-home.png', fullPage: true });
  const chart = async (bow, marks) => {
    await p.getByRole('button', { name: '+ New sight chart' }).click(); await p.waitForTimeout(150);
    if (!(await p.locator('#sStart').isDisabled())) errs.push('can start without a bow name');
    await p.locator('#sBow').fill(bow);
    for (const d of [10, 40, 50]) await p.locator('.chips button', { hasText: new RegExp('^' + d + ' m$') }).click(); // 20,30 left on
    await p.locator('#sAddD').fill('35'); await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(100);
    await p.screenshot({ path: `/tmp/s-setup.png`, fullPage: true }); await over('ssetup');
    await p.locator('#sStart').click(); await p.waitForTimeout(150);
    for (let i = 0; i < marks.length; i++) {
      await p.getByRole('button', { name: '↑ High' }).click(); await p.getByRole('button', { name: '● On' }).click(); await p.getByRole('button', { name: '● On' }).click();
      await p.locator('#sSet').fill(String(marks[i])); await p.locator('#sSet').dispatchEvent('input');
      if (i === 1) { await p.screenshot({ path: '/tmp/s-play.png', fullPage: true }); await over('splay'); }
      await p.locator('.bottombar button.primary').click(); await p.waitForTimeout(150);
    }
  };
  await p.locator('.tile:has-text("Sight marks")').click(); await p.waitForTimeout(150);
  await chart('30lb Hoyt', [3.2, 4.6, 5.3]); // 20, 30, 35
  const rows = await p.locator('.stable tr').count(); console.log('chart rows', rows); if (rows < 4) errs.push('chart rows');
  await p.screenshot({ path: '/tmp/s-chart.png', fullPage: true }); await over('schart');
  let dl = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Export to Excel' }).click()]); await dl[0].saveAs('/tmp/s-hoyt.xlsx'); console.log('xlsx', dl[0].suggestedFilename());
  dl = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Save image' }).click()]); await dl[0].saveAs('/tmp/s-card.png'); console.log('png', dl[0].suggestedFilename());
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(150);
  await chart('Compound 50lb', [10, 12, 13]);
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(150);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('wa.sight')).map(c => `${c.bow}:${c.marks.map(m => m.d + '=' + m.s).join(',')}`)); console.log(saved);
  if (saved.length !== 2) errs.push('expected 2 charts');
  dl = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Export all charts to Excel' }).click()]); await dl[0].saveAs('/tmp/s-all.xlsx');
  await p.screenshot({ path: '/tmp/s-list.png', fullPage: true }); await over('sight list');
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS sight'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
