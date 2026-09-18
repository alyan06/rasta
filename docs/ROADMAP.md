# Rasta roadmap

Rasta’s next step is to help a student answer three connected questions: **Where can I apply, what should I work on next, and can I afford to attend?** Keep the core student experience free. The current application is a local MVP; the items below are proposed work, not available features.

## 1. Make the university data dependable

- Model **university, campus, programme, admission year, test route, and seat category** explicitly. Add required subjects, exam completion years, and the applicable IBCC rules to the profile.
- Store each rule with an original source, effective cycle, date checked, and reviewer. Mark stale or disputed information visibly, and offer a correction workflow.
- Build a provenance-backed closing-merit history. Distinguish official published lists from student-reported outcomes, and keep the original supporting documents where permitted.
- Show aggregate comparisons and historical ranges only when records are comparable. Introduce calibrated admission bands only after representative outcomes support them, with validation on a later intake and checks across curricula and applicant groups. Show uncertainty and data gaps; avoid invented precision.

**First useful release:** a small, maintained set of programme-specific Pakistani admissions routes with clearly sourced historical context.

## 2. Turn scores into a practical study plan

- Add subject-level NET, NU-test, and SAT diagnostics using original or licensed questions aligned to verified test blueprints.
- Let students plan around an exam date, available weekly study time, and weak topics. Use spaced practice, timed sections, and recent performance to update the plan.
- Link free official resources and show how a realistic score improvement affects a supported aggregate calculation.
- Preserve the distinction between a planning target and a university’s actual selection threshold.

**First useful release:** a weekly revision plan and a practice-test progress log tied to one supported admission route.

## 3. Put affordability beside academic fit

- Build a scholarship and aid directory with nationality, curriculum, income, merit, and programme eligibility; link the actual application and verified deadline.
- Compare total annual and degree costs in **PKR**, including tuition, accommodation, food, transport, tests, application fees, and, where relevant, travel and visa costs.
- Record fee years and exchange-rate dates. Separate grants, tuition waivers, repayable loans, and uncertain awards. Let families adjust assumptions and compare a funded and unfunded scenario.

**First useful release:** a transparent cost worksheet and a short list of scholarships the student can actually apply for.

## 4. Make the journey accessible and supported

- Offer full **Urdu and English**, including right-to-left layouts, clear explanations of admissions terms, and bilingual guidance for families. Test with students from both FSc and A Level backgrounds.
- Optimise for inexpensive phones, limited connectivity, keyboard use, and screen readers. Keep draft work resilient during connection failures.
- Add verified admission and financial-aid deadline records, including time zones. Introduce opt-in notifications with clear update and cancellation controls.
- Add opt-in counsellor or teacher review through revocable, scoped sharing. Let students choose the exact profile sections or essays to share, see access history, and revoke access.

**First useful release:** bilingual admissions guidance and a verified deadline calendar with student-controlled reminders.

## 5. Add a secure service when it earns its place

- Introduce authentication and a backend for cross-device sync, with access controls, encrypted transport, backups, deletion, export, and migration from existing local backups.
- For any generative essay assistance, keep provider keys **server-only**. Require authentication, enforce per-user and global rate limits, cap input/output size and spending, and monitor usage without logging personal drafts by default.
- Let students opt into sending a draft for help. Explain what is transmitted and retained. Focus assistance on questions, structure, clarity, and feedback that preserve the student’s experience and authorship.
- Test recovery, unauthorised access, abuse controls, and service failure before public launch. Keep the local writing tools usable when AI or network services are unavailable.

**First useful release:** reliable opt-in sync and secure review, followed by a measured pilot of optional writing assistance.

## How to choose what ships next

Work with a small group of Pakistani students and counsellors. Measure whether students can identify an eligible programme, set a realistic test target, find affordable options, and complete the next application step without paid help. Prioritise reduced confusion and completed applications over time spent in the app. A “chance” label is useful only when the evidence behind it is trustworthy.
