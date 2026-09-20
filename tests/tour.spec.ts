import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STUB_ACCOUNT_KEY, seedSample, stubSignedIn } from './helpers';

const accountFlag = (page: Page) => page.evaluate(key => (JSON.parse(localStorage.getItem(key) ?? '{}') as { tourCompleted?: boolean }).tourCompleted, STUB_ACCOUNT_KEY);

test('a new account is shown around once: every section, in place, then straight to the grades', async ({ page }) => {
  await stubSignedIn(page);
  await seedSample(page, { profile: { isDemo: false, name: 'Hamza Khan' } });
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Welcome to Rasta, Hamza.' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('saves to your Google account');
  await expect(dialog).toContainText('Step 1 of 12');
  // The page underneath is dimmed and inert while the tour is open.
  await expect(page.locator('.app-shell')).toHaveAttribute('inert', '');
  await dialog.getByRole('button', { name: 'Show me around' }).click();

  const visits: [string, string, string][] = [
    ['Everything lives in the menu.', '#dashboard', 'menu'],
    ['Dashboard: your progress at a glance.', '#dashboard', 'journey'],
    ['My profile: grades, tests and activities.', '#profile', 'grades'],
    ['to explore.', '#universities', 'explore'],
    ['Check my chances, with the working shown.', '#university/nust', 'chances'],
    ['Score planner: work backwards from a target.', '#planner', 'planner'],
    ['Essay studio: your story, your voice.', '#essays', 'essays'],
    ['My applications: deadlines and checklists.', '#applications', 'applications'],
    ['How to apply, step by step.', '#guide', 'guide'],
    ['Your account and your data.', '#guide', 'account'],
  ];
  for (const [index, [title, hash, target]] of visits.entries()) {
    await expect(page.locator('#tour-title')).toContainText(title);
    await expect(page.locator('.tour-count')).toHaveText(`Step ${index + 2} of 12`);
    // A fresh load has no hash yet, so the dashboard is either "/" or "#dashboard".
    await expect(page).toHaveURL(hash === '#dashboard' ? /(\/|#dashboard)$/ : new RegExp(`${hash.replace('/', '\\/')}$`));
    // The spotlight sits over the real element on the real page.
    const element = page.locator(`[data-tour="${target}"]`);
    await expect(element).toBeVisible();
    await expect.poll(async () => {
      const hole = await page.locator('.tour-hole').boundingBox();
      const box = await element.boundingBox();
      return hole && box ? Math.abs(hole.x + 8 - box.x) < 2 && Math.abs(hole.y + 8 - box.y) < 2 : false;
    }).toBe(true);
    if (target === 'menu') {
      await page.screenshot({ path: 'docs/rasta-tour.png', fullPage: false });
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    if (target === 'account') await expect(page.locator('#tour-title').locator('..').locator('..')).toContainText('student@example.com');
    // Focus lands on the step's heading so screen readers announce it; the arrow keys work as well as Next.
    await expect(page.locator('#tour-title')).toBeFocused();
    if (index % 2) await page.keyboard.press('ArrowRight');
    else await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.locator('#tour-title')).toHaveText('That is the tour.');
  await page.getByRole('button', { name: 'Add my grades' }).click();
  await expect(page.locator('.tour-root')).toHaveCount(0);
  await expect(page).toHaveURL(/#profile$/);
  await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '');
  expect(await accountFlag(page)).toBe(true);
  // Seen once: a fresh load of the same account does not show it again, but the account dialog can replay it.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
  await expect(page.locator('.tour-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'My account' }).click();
  await page.getByRole('button', { name: 'Show me around again' }).click();
  await expect(page.getByRole('dialog', { name: 'Welcome to Rasta, Hamza.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour-root')).toHaveCount(0);
});

test('on a phone the tour is a bottom sheet that lists the menu sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubSignedIn(page);
  await seedSample(page, { profile: { isDemo: false, name: 'Ayesha' } });
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Welcome to Rasta, Ayesha.' });
  await expect(dialog).toBeVisible();
  const card = await dialog.boundingBox();
  expect(card && card.y + card.height).toBeGreaterThan(844 - 40);
  expect(card && card.width).toBeGreaterThan(300);
  await dialog.getByRole('button', { name: 'Show me around' }).click();
  await expect(page.locator('#tour-title')).toHaveText('Everything lives in the menu.');
  await expect(page.locator('.tour-sections li')).toHaveText(['Dashboard', 'My profile', 'Universities', 'Score planner', 'Essay studio', 'My applications', 'How to apply']);
  // The spotlight is on the ☰ button, which is the only way into the menu on a phone.
  await expect.poll(async () => {
    const hole = await page.locator('.tour-hole').boundingBox();
    const button = await page.getByRole('button', { name: 'Open navigation' }).boundingBox();
    return hole && button ? Math.abs(hole.x + 8 - button.x) < 2 && Math.abs(hole.y + 8 - button.y) < 2 : false;
  }).toBe(true);
  await page.screenshot({ path: 'docs/rasta-tour-phone.png', fullPage: false });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('.tour-actions .button').last().click();
  await page.locator('.tour-actions .button').last().click();
  await expect(page.locator('#tour-title')).toContainText('My profile');
  await expect(page.locator('.tour-where')).toContainText('☰ Menu → My profile');
  // The highlighted element is scrolled into the top half, clear of the sheet.
  const grades = await page.locator('[data-tour="grades"]').boundingBox();
  expect(grades && grades.y).toBeLessThan(200);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour-root')).toHaveCount(0);
  expect(await accountFlag(page)).toBe(true);
});

test('guests are not interrupted, but can take the tour from How to apply', async ({ page }) => {
  await seedSample(page, { profile: { isDemo: false, name: 'Bilal' } });
  await page.goto('/#guide');
  await expect(page.getByRole('heading', { name: 'How to apply' })).toBeVisible();
  await expect(page.locator('.tour-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'Take the tour' }).click();
  const dialog = page.getByRole('dialog', { name: 'Welcome to Rasta, Bilal.' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Sign in with Google whenever you want');
  await dialog.getByRole('button', { name: 'Skip the tour' }).click();
  await expect(page.locator('.tour-root')).toHaveCount(0);
  await expect(page).toHaveURL(/#guide$/);
});
