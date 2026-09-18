# Rasta · راستہ

A free university planning workspace for students in Pakistan, built around Matric/FSc and O/A Levels. Explore every HEC-recognised Pakistani university and every four-year US university, see real admission statistics, check your chances with a transparent estimate, plan test scores, organise applications, and develop your own essays.

Built with React, TypeScript and Vite. Everything works in the browser without an account; optional Google sign-in (Supabase) syncs your workspace across devices.

## Run locally

Use **Node.js 24** and npm. The installed Vite 7 package declares `^20.19.0 || >=22.12.0`; Node 24 is supported. The project was developed with Node 24.18.1.

```powershell
cd C:\Users\Muham\Documents\rasta
npm ci
npm run dev
```

Open the local address printed by Vite, normally [http://127.0.0.1:5173](http://127.0.0.1:5173). A first visit starts a short one-question-at-a-time setup (name → Matric/O Levels → FSc/A Levels → result received?). You can also explore a labelled sample student first and select **Make it yours** later.

```powershell
npm run build
npm run preview
```

The production build is written to `dist/`. Preview serves that build locally. These commands do not publish the application or push changes to GitHub.

## What works

| Area | Current behaviour |
| --- | --- |
| Profile | Matric percentage or O Level subjects and grades; FSc percentage (actual Part 1 + predicted final) or A Level subjects with per-subject predicted flags; what you want to study (100+ grouped programmes); NET / NU test / SAT scores; up to 10 activities, each with type, role, description, dates and hours; family earnings in PKR. O/A Level grades are converted the IBCC way for planning, so there is no equivalence percentage to type in. |
| University explorer | 2,841 universities: all 284 HEC-recognised institutions in Pakistan and all 2,557 active four-year US institutions. 1,734 carry published admit rates, SAT/ACT ranges, enrolment, test policy and costs from IPEDS. Search, sort (most selective, largest, cheapest…), filter by state/province, admit rate, test policy, type and programme; wishlist; a logo for every entry. |
| University page | Kollegio-style facts grid (acceptance rate, SAT/ACT middle 50%, undergraduates, tuition, test policy, type & setting, campuses), a **Check my chances** panel, requirements, costs & aid, how to apply, official sources. |
| Chances | A percentage plus a band (Far reach / Reach / Target / Likely / Safety) with every factor listed and “what would move it” hints. US and LUMS: starts from the published admit rate and adjusts for grades, SAT vs. the middle 50%, activities, programme and international status. NUST/FAST: compares your calculated aggregate with an editable reported closing aggregate. Entries with no public data say so instead of inventing a number. |
| Score planner | NUST NET and FAST NU-test aggregate calculations, score scenarios, the score required for a target aggregate, and SAT targets for every wishlisted US university with a published range. |
| Essay studio | Multiple drafts, practice/custom prompts, guided story notes, outlines built from those notes, 250/500/650-word targets, text export, and local writing checks. |
| Applications | Per-university steps, preparation status, notes, and manually entered deadlines. |
| Admissions guide | Pakistan, USA, and IBCC application guidance with official links. |

Six entries — **NUST, FAST–NUCES, LUMS, MIT, Amherst College, and Arizona State University** — have hand-reviewed requirements, formulas and application steps. Every other entry is built from public registries by `scripts/build-catalogue.mjs`: the HEC recognised-institution list plus each HEC page’s facts (website, sector, province, campuses, year) for Pakistan, and NCES IPEDS HD2024 / ADM2023 / DRVEF2023 / IC2023_AY for the USA. Programme lists are only verified for the six reviewed entries.

## What the numbers mean

An admission **aggregate is a weighted result** following the supported universities’ published formulas, including programme and pending-result branches.

A **chance** is a transparent estimate, not a prediction of a decision. For holistic universities it starts from the institution’s published first-year admit rate (IPEDS 2023-24, or an assumed 20% for LUMS, which publishes none) and moves it up or down on a logistic scale for: grades (A Level best-three or FSc percentage; LUMS uses its published class averages), SAT against the middle 50% (ignored where the university is test-blind; softened where test-optional), activity depth, competitive programmes, and international-applicant status. For NUST and FAST it compares the calculated aggregate with a reported closing aggregate from a previous merit list (defaults in `src/lib/chancing.ts`, editable on the page). Every factor and its direction is shown. Results are clamped to 0.5–99% and banded: Far reach < 10%, Reach < 25%, Target < 50%, Likely < 75%, Safety ≥ 75%. The weights are judgement, not a fitted model; treat the number as a way to sort a list into safety/target/reach, not as odds.

Essay outlines assemble the student’s own notes and mark missing details. **Writing checks are deterministic local rules**, covering length, long sentences, broad claims, reflection cues, repetition, and unfinished outline notes. They are not generative AI or an assessment of admission chances. The practice prompts are examples; students must verify the prompt and writing rules in their actual application.

## Data and backups

Workspace data is stored in this browser’s `localStorage` under `rasta.workspace.v1`. With Supabase configured, **Sign in with Google** syncs the workspace to your account (see [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md)); otherwise clearing site data or moving to another browser can remove access to your workspace. Nothing is ever submitted to a university.

Open **Your data** in the sidebar to:

- **Export my backup:** download your profile, shortlist, applications, and essays as JSON.
- **Import a backup:** validate a Rasta JSON file, review the replacement, then restore it. Import replaces the workspace; it does not merge records.
- **Start fresh:** clear the workspace after confirmation. Keep a backup if you may need your work later.

If storage is unavailable, the app warns that changes remain in memory. If saved data cannot be read, it preserves the original and offers a recovery download before browser saving is restored. Individual essays can also be exported as `.txt` files. Backups contain personal writing and profile information, so store them somewhere you control.

## Sources and currency

Admissions content is a **bundled snapshot**, not a live admissions feed. Source records in `src/lib/admissions.ts` carry a checked date of **15 September 2026**; details and cycle qualifications are in [the research notes](docs/admissions-research.md). The catalogue (`src/data/catalogue.json`) was generated on 17 September 2026 from the HEC registry and IPEDS 2023-24. Requirements, financial aid, and deadlines must be confirmed for the relevant intake. Deadlines entered in the app do not trigger notifications.

### Rebuilding the catalogue

```powershell
node scripts/scrape-hec.mjs        # refreshes scripts/data/pakistan-hec-details.json from HEC pages (network, ~2 min)
node scripts/build-catalogue.mjs   # merges HEC + IPEDS CSVs into src/data/catalogue.json
```

The IPEDS CSVs (HD, ADM, DRVEF, IC_AY for the latest year) go in `scripts/data/ipeds/`, downloaded from the [IPEDS data centre](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx); they are not committed. University logos are the institution’s own site icon, fetched at view time through Google’s favicon service with a monogram fallback; the six reviewed entries ship bundled logos in `public/logos/`.

Primary starting points: [NUST merit criteria](https://nust.edu.pk/admissions/undergraduates/merit-criteria-for-admission-on-net-basis/), [FAST eligibility](https://www.nu.edu.pk/Admissions/EligibilityCriteria), [LUMS admissions FAQ](https://admission.lums.edu.pk/admission-faqs), [MIT international admissions](https://mitadmissions.org/apply/firstyear/international/), [Amherst international admission](https://www.amherst.edu/admission/apply/international), [ASU international requirements](https://admission.asu.edu/apply/international/first-year), and [IBCC British-system requirements](https://ibcc.edu.pk/equivalence-intro/british-system/).

## Tests

```powershell
npm test
npx playwright install chromium
npm run test:e2e
```

Unit tests cover admissions calculations, writing checks, and storage validation/recovery. Playwright covers core browser workflows, persistence, backups, and mobile layout. Its configuration starts the Vite development server on port 5173 or reuses an existing one. If Chromium is already installed elsewhere, set `RASTA_BROWSER_PATH` to its executable instead of installing Playwright’s browser.

## Project map

- `src/components/` — the workspace views, onboarding, university explorer and detail page.
- `src/lib/admissions.ts` — the six reviewed universities and the aggregate calculators.
- `src/lib/catalogue.ts` + `src/data/catalogue.json` — the full directory with IPEDS/HEC facts.
- `src/lib/chancing.ts` — the chance estimate, bands and wishlist test plans.
- `src/lib/academics.ts` — programmes, subjects, IBCC-style grade conversion.
- `src/lib/essay.ts` — outline and writing helpers.
- `src/lib/storage.ts` — persistence, validation, and backups.
- `src/types.ts` — shared data contracts.
- `tests/` — browser workflows.
- [Roadmap](docs/ROADMAP.md) — priorities for taking Rasta beyond this MVP.
