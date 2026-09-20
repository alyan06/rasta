import type { Page } from '@playwright/test';
import type { AppData, Profile } from '../src/types';
import { initialData, STORAGE_KEY } from '../src/lib/storage';

type SeedPatch = Partial<Omit<AppData, 'profile'>> & { profile?: Partial<Profile> };

/** Seed once per isolated browser context. Never overwrite reloads or recovery data. */
export async function seedSample(page: Page, patch: SeedPatch = {}): Promise<void> {
  const { profile, ...workspace } = patch;
  const data: AppData = {
    ...structuredClone(initialData),
    onboardingCompleted: true,
    ...workspace,
    profile: { ...structuredClone(initialData.profile), ...profile },
  };
  await page.addInitScript(({ key, data }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(data));
  }, { key: STORAGE_KEY, data });
}

export async function readWorkspace(page: Page): Promise<AppData> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!) as AppData, STORAGE_KEY);
}

export const STUB_USER_ID = '11111111-2222-4333-8444-555555555555';
/** Browser-storage key of the stub account's workspace (the app keeps one workspace per account). */
export const STUB_ACCOUNT_KEY = `${STORAGE_KEY}.account.${STUB_USER_ID}`;

/** A fake signed-in Google session plus stubbed Supabase endpoints, so account flows run without a backend.
 * The account starts with no saved workspace: whatever is open becomes its progress, as on a first sign-in. */
export async function stubSignedIn(page: Page): Promise<void> {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: STUB_USER_ID, role: 'authenticated', aud: 'authenticated', exp: expiresAt, email: 'student@example.com' })}.sig`;
  const user = { id: STUB_USER_ID, aud: 'authenticated', role: 'authenticated', email: 'student@example.com', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-09-18T00:00:00Z' };
  await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: 'sb-kwlfhxegnyvmzekxexto-auth-token', session: { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, refresh_token: 'stub', user } });
  await page.route('**/auth/v1/user', route => route.fulfill({ json: user }));
  await page.route('**/rest/v1/user_workspaces*', route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/rpc/save_workspace', async route => {
    const body = route.request().postDataJSON() as { p_payload: unknown };
    await route.fulfill({ json: { payload: body.p_payload, revision: 1, updated_at: new Date().toISOString() } });
  });
}
