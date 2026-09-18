import { test, expect } from '@playwright/test';
import { seedSample } from './helpers';

const student = {
  name: 'Hamza', isDemo: false, secondary: 'olevel' as const, higherSecondary: 'alevel' as const, curriculum: 'alevel' as const, stage: 'awaiting' as const, programme: 'computer-science', major: 'computing' as const, sat: 1480, examYear: 2025, ssc: '' as const, hssc: '' as const, net: 160, nu: '' as const,
  oLevels: [['English', 'A'], ['Mathematics', 'A*'], ['Urdu', 'B'], ['Islamiyat', 'A'], ['Pakistan Studies', 'A'], ['Physics', 'A*'], ['Chemistry', 'A'], ['Computer Science', 'A*']].map(([subject, grade], i) => ({ id: `o${i}`, subject, grade: grade as 'A', predicted: false })),
  aLevels: [['Mathematics', 'A*'], ['Physics', 'A'], ['Computer Science', 'A']].map(([subject, grade], i) => ({ id: `a${i}`, subject, grade: grade as 'A', predicted: true })),
};

test('a student sees a chance percentage, its factors and what would move it', async ({ page }) => {
  await seedSample(page, { profile: student, saved: ['mit', 'nust', 'us-166027'] });
  await page.goto('/#university/us-166027');
  await expect(page.locator('main h1')).toHaveText('Harvard University');
  await expect(page.locator('.university-stats')).toContainText(/Acceptance rate/);
  await expect(page.locator('.university-stats')).toContainText(/SAT middle 50%/);
  await page.getByRole('button', { name: 'Check my chances' }).click();
  const results = page.locator('.chance-results');
  await expect(results.locator('.chance-number strong')).toHaveText(/^\d+(\.\d)?%$/);
  await expect(results).toContainText('How this number was reached');
  await expect(results).toContainText(/Overall admit rate/);
  await expect(results).toContainText(/SAT 1480 vs\. middle 50%/);
  await expect(results).toContainText(/International applicant/);
  await expect(results.locator('.chance-improvements')).toContainText(/With an SAT of/);
  await expect(results).not.toContainText(/Amherst/);
  await expect(results).not.toContainText(/IBCC/);
});

test('merit-route chances follow the editable closing aggregate', async ({ page }) => {
  await seedSample(page, { profile: student, saved: ['nust'] });
  await page.goto('/#university/nust');
  await page.getByRole('button', { name: 'Check my chances' }).click();
  const number = page.locator('.chance-number strong');
  const before = await number.textContent();
  const reference = page.getByLabel('Closing aggregate to compare with (%)');
  await expect(reference).toHaveValue('73');
  await reference.fill('90');
  const after = await number.textContent();
  expect(parseFloat(after!)).toBeLessThan(parseFloat(before!));
  await page.getByRole('button', { name: 'Use the reported figure' }).click();
  await expect(reference).toHaveValue('73');
});

test('chances stay on the university page; the explorer shows test policy and scholarships and filters by admit rate', async ({ page }) => {
  await seedSample(page, { profile: student, saved: ['mit', 'nust', 'us-166027', 'asu'] });
  await page.goto('/#dashboard');
  await expect(page.locator('.chance-badge')).toHaveCount(0);
  await page.goto('/#universities');
  await expect(page.locator('.chance-badge')).toHaveCount(0);
  const first = page.locator('.university-card').first();
  await expect(first.locator('.uni-chips .badge')).toHaveCount(2);
  await expect(first).not.toContainText(/my chances/i);
  await page.getByRole('button', { name: /Filters/ }).click();
  await page.getByLabel('Admit rate').selectOption('under10');
  await expect(page.locator('.results-heading')).toContainText(/\d+ universities/);
  const cards = page.locator('.university-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  for (let index = 0; index < Math.min(count, 6); index += 1) await expect(cards.nth(index).locator('.uni-chips')).toContainText(/SAT|test/i);
  await page.getByLabel('Scholarships').selectOption('yes');
  await expect(cards.first().locator('.uni-chips')).toContainText(/Scholarships/);
  await page.getByLabel('Scholarships').selectOption('all');
  await page.getByLabel('Admit rate').selectOption('all');
  await page.getByLabel('Search universities').fill('Aga Khan');
  await expect(cards.first()).toContainText('Aga Khan University');
  await expect(cards.first().locator('.uni-chips')).toContainText(/check/i);
  // The whole card is the link: clicking its body opens the university page.
  await cards.first().click({ position: { x: 40, y: 160 } });
  await expect(page).toHaveURL(/#university\/pk-aga-khan-university$/);
});
