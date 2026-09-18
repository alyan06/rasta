# Validation — 18 September 2026

- Production build and strict TypeScript compilation pass (`npm run build`). Output is split into `index`, `catalogue` (the 2,841-entry directory, 479 kB / ~110 kB gzip), `react` and `supabase` chunks.
- 68 unit tests pass: weighted admission formulas, inverse score targets, the chance engine (bounded percentages that move with evidence, required-vs-optional test handling, test-blind entries, data-only vs identity-only entries, editable merit references, activity depth), writing helpers, backup validation and recovery.
- 11 browser tests pass (Chromium via `RASTA_BROWSER_PATH`): one-question-at-a-time onboarding and predicted-result setup, theme persistence, sign-in dialog never inventing a session, automated WCAG A/AA checks across all views in light and dark mode, mobile layout without horizontal scroll, mobile navigation focus trapping, and the new chances flow (Harvard page facts + factor list, editable NUST closing aggregate, dashboard side-by-side chances, explorer admit-rate filter and search).
- Desktop (1440px) and mobile (390px) captures of the dashboard, profile and MIT page are regenerated into this directory by the browser suite.
- Catalogue build: `node scripts/build-catalogue.mjs` reproduces the previous 2,557-institution US set exactly from the HD2024 filter and adds ADM2023 / DRVEF2023 / IC2023_AY facts (1,734 with admit data, 983 with SAT ranges, 2,325 with published charges); 274 of 281 Pakistani directory entries gained a website from their HEC page, 280 gained sector and province.
- Supabase project `rasta` has the accounts migration applied; the Google provider is not yet enabled, and the account panel reports that state instead of redirecting to an error.

## Release scope

Chance estimates are transparent heuristics over public statistics, not a fitted model; the README explains every factor. No generative AI service is connected. The development preview is local; no public deployment has been performed.
