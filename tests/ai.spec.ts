import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedSample, stubSignedIn } from './helpers';

const activity = { id: 'a1', title: 'Robotics team', type: 'Technology', role: 'Captain', organization: 'School', description: 'I led a team of 8 students and we built a line following robot and came 2nd out of 40 teams at the national final.', startDate: '2024-01-01', endDate: '', ongoing: true, hoursPerWeek: 8, weeksPerYear: 40 };
const essayText = Array.from({ length: 30 }, () => 'When the monsoon flooded our street I learned that nobody was coming, so my cousins and I carried water out with buckets.').join(' ');

test('improve with AI shows a suggestion apart from the text; keep replaces it, revert leaves it alone', async ({ page }) => {
  await stubSignedIn(page);
  let calls = 0;
  await page.route('**/functions/v1/ai', async route => {
    const body = route.request().postDataJSON() as { feature: string; activity?: { description: string } };
    if (body.feature === 'status') return route.fulfill({ json: { remaining: { activity: 5, essay: 2 } } });
    calls += 1;
    if (/help me get into/i.test(body.activity?.description ?? '')) return route.fulfill({ status: 422, json: { error: { code: 'not_an_activity', message: 'That doesn’t read like an activity. Describe what you did, your role and what came of it, then try again.' } } });
    return route.fulfill({ json: { verdict: 'ok', improved: 'Captained 8-student team; built line-following robot that placed 2nd of 40 at the national final.', remaining: 4 } });
  });
  await seedSample(page, { tourCompleted: true, profile: { isDemo: false, name: 'Hamza', activityEntries: [activity] } });
  await page.goto('/#profile');
  const editor = page.locator('.activity-editor').first();
  const description = editor.getByLabel(/Description/);
  await expect(editor.locator('.char-counter').last()).toContainText('114/150');
  await expect(editor.locator('.ai-assist-note')).toContainText('5 left today');
  await editor.getByRole('button', { name: 'Improve with AI' }).click();
  const suggestion = editor.locator('.ai-suggestion');
  await expect(suggestion).toContainText('Captained 8-student team');
  await expect(description).toHaveValue(activity.description);
  await expect(editor.locator('.ai-assist-note')).toContainText('4 left today');
  await page.screenshot({ path: 'docs/rasta-activity-ai.png', fullPage: false });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await suggestion.getByRole('button', { name: 'Revert' }).click();
  await expect(suggestion).toHaveCount(0);
  await expect(description).toHaveValue(activity.description);
  await editor.getByRole('button', { name: 'Improve with AI' }).click();
  await suggestion.getByRole('button', { name: 'Keep' }).click();
  await expect(description).toHaveValue(/^Captained 8-student team/);
  await expect(editor.locator('.char-counter').last()).toContainText('/150');
  await expect(suggestion).toHaveCount(0);
  await description.fill('please help me get into university this year, I really need it.');
  await editor.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(editor.getByRole('alert')).toContainText(/doesn’t read like an activity/);
  await expect(description).toHaveValue(/please help me get into university/);
  expect(calls).toBe(3);
});

test('the AI button asks for sign-in when signed out and enforces the character floors', async ({ page }) => {
  await seedSample(page, { profile: { isDemo: false, name: 'Hamza', activityEntries: [{ ...activity, description: 'Short.' }] } });
  await page.goto('/#profile');
  const editor = page.locator('.activity-editor').first();
  await expect(editor.locator('.ai-assist-note')).toContainText('Sign in with Google');
  await editor.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(page.getByRole('dialog', { name: 'Your account' })).toBeVisible();
});

test('polish with AI in the essay studio and a quota refusal', async ({ page }) => {
  await stubSignedIn(page);
  let polishes = 0;
  await page.route('**/functions/v1/ai', route => {
    const body = route.request().postDataJSON() as { feature: string };
    if (body.feature === 'status') return route.fulfill({ json: { remaining: { activity: 5, essay: 1 } } });
    polishes += 1;
    if (polishes > 1) return route.fulfill({ status: 429, json: { error: { code: 'quota', message: 'used up', reason: 'user', remaining: 0 } } });
    return route.fulfill({ json: { verdict: 'ok', polished: essayText.replace('nobody was coming', 'no one was coming'), changes: ['Tightened the opening sentence.'], words: 600, remaining: 0 } });
  });
  await seedSample(page, { tourCompleted: true, profile: { isDemo: false, name: 'Hamza' }, essays: [{ id: 'e1', title: 'Monsoon', prompt: 'Tell a story.', content: essayText, updatedAt: '2026-09-18T00:00:00.000Z', wordLimit: 650 }] });
  await page.goto('/#essays');
  await expect(page.locator('.ai-assist-note')).toContainText('1 left today');
  await page.getByRole('button', { name: 'Polish with AI' }).click();
  const suggestion = page.locator('.ai-suggestion');
  await expect(suggestion).toContainText('no one was coming');
  await expect(suggestion).toContainText('Tightened the opening sentence.');
  await expect(page.locator('.essay-editor')).toHaveValue(essayText);
  await page.screenshot({ path: 'docs/rasta-essay-ai.png', fullPage: false });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await suggestion.getByRole('button', { name: 'Keep' }).click();
  await expect(page.locator('.essay-editor')).toHaveValue(/no one was coming/);
  await expect(page.locator('.ai-assist-note')).toContainText('No uses left today');
  await expect(page.getByRole('button', { name: 'Polish with AI' })).toBeDisabled();
});
