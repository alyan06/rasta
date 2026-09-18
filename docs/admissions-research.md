# Rasta admission data notes

Verified against official university and IBCC sources on **15 September 2026**. Pakistan rules below describe the published 2026 cycle. Amherst explicitly describes the 2026–27 application cycle. A checked date does not imply a future-cycle guarantee.

## Product interpretation

Rasta calculates an **admission aggregate**, not an acceptance probability. A target aggregate is chosen by the student, not a purported current closing merit. No authenticated, comparable campus/programme closing-merit dataset was established in this research. Eligibility, test route, seat category, preferences and final selection still matter. US colleges evaluate original Pakistani credentials; Rasta must not invent a percentage-to-US-GPA conversion.

The current profile stores broad fields and a Mathematics checkbox. It cannot verify Physics, Chemistry, the full subject group, original letter-grade averages or whether an IBCC certificate was actually issued. The assessment therefore names those outstanding checks. Campus programme availability must be checked separately.

## NUST

- [Merit rules](https://nust.edu.pk/admissions/undergraduates/merit-criteria-for-admission-on-net-basis/): `0.75 × NET% + 0.15 × HSSC% + 0.10 × SSC%`. For final-year A Level applicants, use `0.75 × NET% + 0.25 × O Level equivalent%`.
- [Eligibility](https://nust.edu.pk/admissions/undergraduates/eligibility-criteria-for-ug-programmes/): minimum 60% at each secondary level. Pre-medical computing admits must complete six Mathematics credits within one year; pre-medical engineering requires the eight-week condensed Mathematics course before admission. ICS engineering students have remedial Chemistry. Accounting & Finance requires Mathematics, Accountancy, or Accounting & Finance.
- [NET paper](https://nust.edu.pk/admissions/undergraduates/subjects-included-in-net-with-weightings/): engineering/computing uses Mathematics 50%, Physics 30%, English 20%; business/social sciences uses quantitative Mathematics 50% and English 50%.
- [NET duration](https://nust.edu.pk/faqs/what-is-the-duration-of-test-and-the-number-of-mcqs-to-be-attempted/): 200 questions, 180 minutes. Calculator input uses NET marks out of 200.
- [ACT/SAT route](https://nust.edu.pk/admissions/undergraduates/applying-on-the-basis-of-scholastic-aptitude-test-sat/): a separate application and merit lists apply. SAT applies to business/social sciences/law, with 550 minimum in each section; computing/engineering use ACT under programme-specific requirements. National-seat test weighting replaces NET; international seats use 100% test weighting. This route is outside the current calculator.

## FAST–NUCES

[Official eligibility and selection criteria](https://www.nu.edu.pk/Admissions/EligibilityCriteria), updated 10 August 2026, is the authoritative formula source. The implementation separates computing/business from engineering. When results are incomplete, the applicable Part-I or O Level equivalent may be used. Minimum grades are eligibility conditions, not campus cutoffs. Test-route-specific SAT/NAT conversion is not implemented; do not feed SAT/1600 into the NU percentage field.

[Test pattern](https://www.nu.edu.pk/Admissions/TestPattern) and [scholarships](https://nu.edu.pk/Admissions/Scholarship) are linked in the app. The latter distinguishes tuition scholarships from repayable interest-free study loans.

## LUMS

- [CS school criteria](https://lums.edu.pk/programmes/bs-computer-science) and [business criteria](https://sdsb.lums.edu.pk/programmes/bsc-honours-management-science) distinguish completed from pending qualifications. AS grades and General Paper cannot replace full-credit A Level subjects. SBASSE has its own allowed subject list; engineering requires Pre-Engineering equivalence. Improvement/retake timing also matters.
- [Admissions FAQ](https://admission.lums.edu.pk/admission-faqs): no SAT/ACT minimum; best single attempt is considered. SAT, ACT or LCAT is required. Teacher evaluations and application review matter, so do not manufacture an aggregate or probability.
- [Published incoming-class profile](https://admission.lums.edu.pk/undergraduate-programmes) lists the class of 2029/30 averages: SAT 1380, FSc/ICS 88%, Matric 93%. These are cohort averages, not applicant requirements, score targets or admission thresholds.

## IBCC: do not use a timeless grade converter

[British qualification requirements](https://ibcc.edu.pk/equivalence-intro/british-system/) distinguish Pakistan and overseas examination routes. Pakistan O Level equivalence normally requires eight subjects including English, Mathematics, Urdu, Islamiyat and Pakistan Studies. Science groups require the relevant electives; A Level group requirements also differ.

[Grade conversion](https://ibcc.edu.pk/conversion-for-equivalence/) lists A=85, B=75, C=65, D=55 and E=45. A* is subject- and examination-session-specific, so a universal “A*=90” rule is wrong.

The [notice posted 18 February 2026](https://ibcc.edu.pk/notification-for-calculation-of-a-level-equivalent-qualification-based-on-compulsory-subjects-of-o-level/) contains a signed notification dated 17 February. It was inspected directly in the [official scanned notice](https://ibcc.edu.pk/wp-content/uploads/2026/02/Notification-for-calculation-of-A-level-Equivalent-Qual-based-on-compulsory-subjects-of-O-Lvl_page-0001-724x1024.jpg).

For HSSC science equivalence, it removes O Level electives from the calculation, using the five compulsory O Level subjects and relevant A Level science subjects. **It applies to students completing O Levels in session 2026 and A Levels thereafter**, rather than every student completing A Levels in 2026. Existing foreign/dual-national exemptions remain. This cohort distinction is easily lost in secondary summaries. The MVP therefore requests official IBCC equivalent percentages, rather than claiming to issue or reproduce equivalence.

## USA

- **MIT:** [international guidance](https://mitadmissions.org/apply/firstyear/international/), [testing](https://mitadmissions.org/apply/firstyear/tests-scores/), [application checklist](https://mitadmissions.org/apply/firstyear/deadlines-requirements/) and [aid policy](https://mitadmissions.org/afford/cost-aid-basics/access-affordability/). Original grades and predicted results are evaluated in context. SAT/ACT is required, without a published cutoff. MIT considers section highs and requires self-reporting actual sittings. International applicants can receive need-based aid.
- **Amherst:** [international guidance](https://www.amherst.edu/admission/apply/international), [first-year checklist](https://www.amherst.edu/admission/apply/firstyear) and [CS department](https://www.amherst.edu/academiclife/departments/computer_science). For 2026–27, SAT/ACT is optional. The English-test waiver depends on the most recent two school years being taught in English. Computing is the supported programme category in this catalogue.
- **ASU:** [international requirements](https://admission.asu.edu/apply/international/first-year) and [cost/aid](https://admission.asu.edu/cost-aid/international). Academic and course-competency evaluation remains institution-owned. A general test-optional policy does not override higher requirements for specific degrees. International merit awards are limited and do not imply that all need is met.

## Implementation checks

`src/lib/admissions.test.ts` checks official formula branches, pending results, invalid/empty marks, bounds, inverse target rounding, impossible targets and the separation of eligibility from admission outcomes. Returning `null` means missing/invalid data or an unreachable target; zero is retained as a legitimate entered score or an already-met target.

Before extending the model: add programme/campus identifiers, explicit curriculum subjects, exam completion years, test route and seat category. Keep official formulas versioned by cycle, and add a source and provenance label to every historical cutoff. Only consider calibrated probabilities after collecting a suitably representative outcome dataset and evaluating error across curricula and applicant groups.
