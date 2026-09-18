import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('new student completes one question at a time and keeps predicted-result setup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your university journey starts here.' })).toBeVisible();
  await page.screenshot({ path: 'docs/rasta-welcome.png', fullPage: true });
  await page.getByRole('button', { name: 'Set up my profile' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Please enter your name');
  await page.getByLabel('Your name', { exact: true }).fill('Hamza');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Did you study Matric or O Levels?' })).toBeVisible();
  await page.getByRole('button', { name: 'Matric SSC · Board exams' }).click();
  await page.getByRole('button', { name: 'FSc / Intermediate FSc, ICS, FA or ICom' }).click();
  await expect(page.getByRole('heading', { name: 'Have you received your FSc result?' })).toBeVisible();
  await page.getByRole('button', { name: 'Not yet Use my predicted grades' }).click();
  await page.getByRole('button', { name: 'Add my grades' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Hamza');
  await expect(page.getByLabel('Predicted final FSc percentage')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Hamza');
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('rasta.workspace.v1')!).profile);
  expect(profile.stage).toBe('awaiting');
  expect(profile.isDemo).toBe(false);
  expect(profile.net).toBe('');
});

test('theme follows system by default and persists an explicit choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Appearance').filter({ visible: true }).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Appearance').filter({ visible: true }).selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('Google login never invents a signed-in session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Your account' });
  await expect(dialog).toBeVisible();
  // Disconnected installs explain the setup; connected installs offer the real Google flow. Neither claims an account.
  await expect(dialog).toContainText(/not connected|not configured|not set up|Continue with Google/i);
  await expect(dialog.locator('.account-identity')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Set up my profile' })).toBeVisible();
});

test('welcome and animated questions are accessible in both themes with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Appearance').filter({ visible: true }).selectOption(theme);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations, theme).toEqual([]);
  }
  await page.getByRole('button', { name: 'Set up my profile' }).click();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});
