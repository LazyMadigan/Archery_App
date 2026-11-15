// Club colours in the app: preview while editing, Cancel reverts, Save keeps (also after reload), dark mode readable.
const BASE = process.env.BASE || 'http://localhost:8111';
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ ...devices[process.env.DEV || 'Pixel 7'] }); const p = await ctx.newPage();
  await p.addInitScript(() => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem('wa.onboarded', 'true'); localStorage.setItem('wa.profile', JSON.stringify({ name: 'Cian', club: 'Wicklow Archers' })); } });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const brand = () => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim());
  const over = async n => { if (await p.evaluate(() => document.documentElement.scrollWidth > screen.width)) errs.push('OVERFLOW ' + n); };
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  const start = await brand(); console.log('default brand', start);
  await p.locator('.avatar').click(); await p.locator('#pfEdit').click(); await p.waitForTimeout(150);
  await p.locator('#pfColours').click(); await p.locator('.sw:has-text("Green & gold")').click(); await p.waitForTimeout(150);
  const preview = await brand(); console.log('preview', preview); if (preview === start) errs.push('no live preview');
  await p.screenshot({ path: '/tmp/col-picker.png' }); await over('picker'); await p.locator('#colDone').click(); await p.waitForTimeout(100);
  if (!/Green & gold/.test(await p.locator('#pfColours').innerText())) errs.push('tile not showing choice');
  await p.getByRole('button', { name: 'Cancel' }).click(); await p.waitForTimeout(150);
  if (await brand() !== start) errs.push('Cancel did not revert colours');
  await p.locator('#pfEdit').click(); await p.locator('#pfColours').click(); await p.locator('.sw:has-text("Red & black")').click(); await p.locator('#colDone').click(); await p.locator('#pfSave').click(); await p.waitForTimeout(200);
  const saved = await brand(); console.log('saved', saved); if (saved === start) errs.push('save did not apply');
  if (!/Red & black/.test(await p.locator('.pinfo').textContent())) errs.push('read-only row missing colours');
  await p.reload(); await p.waitForTimeout(500); if (await brand() !== saved) errs.push('colours lost on reload');
  await p.locator('.topbar button').first().click(); await p.waitForTimeout(200); await p.screenshot({ path: '/tmp/col-home-light.png' });
  const meta = await p.evaluate(() => document.querySelector('meta[name=theme-color]').content); if (meta !== saved) errs.push('theme-color ' + meta);
  await p.emulateMedia({ colorScheme: 'dark' }); await p.waitForTimeout(200); const dk = await brand(); console.log('dark', dk);
  await p.screenshot({ path: '/tmp/col-home-dark.png' });
  // black main colour in dark mode must not vanish
  await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('wa.profile')); pr.colours = { c1: '#111111', c2: '#f5a300' }; localStorage.setItem('wa.profile', JSON.stringify(pr)); }); await p.reload(); await p.waitForTimeout(500);
  console.log('black&amber dark brand', await brand()); await p.screenshot({ path: '/tmp/col-black-dark.png' });
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'PASS colours'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
