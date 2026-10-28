import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const pages = JSON.parse(fs.readFileSync('dist/site-manifest.json', 'utf8')) as {path:string; title:string; educational?:boolean; indexable?:boolean; series?:string}[];
const published = pages.filter(p => p.indexable !== false);
const samples = [published.find(p => p.path === '/')!, ...Array.from(new Set(published.filter(p => p.educational).map(p => p.series))).map(series => published.find(p => p.series === series && p.educational)!)];

test('every canonical URL serves real HTML without a SPA fallback', async ({ request }) => {
  for (const page of published) {
    const response = await request.get(page.path);
    expect(response.status(), page.path).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text(), page.path).toContain('<h1');
  }
  expect((await request.get('/this-page-does-not-exist/')).status()).toBe(404);
});

for (const sample of samples) {
  test(`themes and static reading: ${sample.path}`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(sample.path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const contrast = async () => page.evaluate(() => {
      const rgb = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = (color: number[]) => color.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const style = getComputedStyle(document.body);
      const foreground = luminance(rgb(style.color)), background = luminance(rgb(style.backgroundColor));
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    });
    expect(await contrast(), 'body text light contrast').toBeGreaterThanOrEqual(4.5);
    const toggle = page.locator('[data-theme-toggle],#theme-toggle').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await contrast(), 'body text dark contrast').toBeGreaterThanOrEqual(4.5);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto('/about/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto(sample.path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('[data-theme-toggle],#theme-toggle').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
    await context.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const reading = await nojs.newPage();
    await reading.goto(sample.path);
    await expect(reading.locator('h1').first()).toBeVisible();
    expect(await reading.title()).toBe(sample.title);
    if (sample.path === '/') {
      expect(await reading.locator('.role-line').evaluate(el => {
        for (let node: Element | null = el; node; node = node.parentElement) if (getComputedStyle(node).opacity === '0') return false;
        return true;
      }), 'hero prose readable without JavaScript').toBe(true);
      await expect(reading.locator('.reveal').first()).toHaveCSS('opacity', '1');
    }
    if (sample.educational) await expect(reading.locator('a[href*="/downloads/"]').first()).toBeVisible();
    await nojs.close();
  });
}

test('mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.locator('h1').first()).toBeVisible();
});
