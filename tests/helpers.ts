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
