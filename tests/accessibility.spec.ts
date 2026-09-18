import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedSample } from './helpers';

test.beforeEach(async ({ page }) => { await seedSample(page); });
const routes = ['dashboard', 'profile', 'universities', 'university/nust', 'university/mit', 'planner', 'essays', 'applications', 'guide', 'privacy', 'terms', 'contact'];

test('mobile navigation traps focus and restores it after closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Your data', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Your data', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Your data settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

for (const theme of ['light', 'dark']) {
  test(`workspace views meet automated accessibility checks in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion: 'reduce' });
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      if (route === 'essays') await page.getByRole('button', { name: 'Start your first draft' }).click();
      if (route.startsWith('university/')) await page.getByRole('button', { name: 'Check my chances' }).click();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations, `${route} ${theme}`).toEqual([]);
      if (['dashboard', 'profile', 'university/mit'].includes(route)) {
        await page.screenshot({ path: `docs/rasta-${route.replace('/', '-')}-${theme}.png`, fullPage: true });
      }
    }
  });
}

test('all routes fit mobile and university detail uses profile data', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    await page.goto(`/#${route}`);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), route).toBe(false);
    if (route === 'dashboard' || route === 'university/mit') await page.screenshot({ path: `docs/rasta-${route.replace('/', '-')}-mobile.png`, fullPage: true });
  }
  await page.goto('/#universities');
  await page.getByLabel('Search universities').fill('NUST');
  await page.getByRole('link', { name: 'NUST', exact: true }).click();
  await expect(page).toHaveURL(/#university\/nust$/);
  await page.getByRole('button', { name: 'Check my chances' }).click();
  await expect(page.locator('.chance-results')).toContainText('74.60%');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Score planner', exact: true }).click();
  await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});
