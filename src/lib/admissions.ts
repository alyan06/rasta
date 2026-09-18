import type { Assessment, Profile, Source, University } from "../types";
import { academicSummary, programmeCategory } from './academics';
import { coreFacts, directoryUniversities } from './catalogue';

const checked = "2026-09-15";
const source = (label: string, url: string): Source => ({
  label,
  url,
  checked,
});

export const coreUniversities: University[] = [
  {
    id: "nust",
    name: "National University of Sciences & Technology",
    shortName: "NUST",
    city: "Islamabad",
    country: "Pakistan",
    model: "nust",
    majors: ["computing", "engineering", "business"],
    description:
      "Explore computing, engineering and business through a test-led admission route.",
    testLabel: "NET · out of 200",
    color: "#626ea3",
    sources: [
      source(
        "NUST merit formula",
        "https://nust.edu.pk/admissions/undergraduates/merit-criteria-for-admission-on-net-basis/",
      ),
      source(
        "Subject and grade requirements",
        "https://nust.edu.pk/admissions/undergraduates/eligibility-criteria-for-ug-programmes/",
      ),
      source(
        "NET paper by programme",
        "https://nust.edu.pk/admissions/undergraduates/subjects-included-in-net-with-weightings/",
      ),
      source(
        "Financial aid",
        "https://nust.edu.pk/admissions/scholarships/need-based-financial-aid/",
      ),
      source("Apply for NET", "https://ugadmissions.nust.edu.pk/"),
    ],
    requirements: [
      "Minimum 60% in both SSC and HSSC, or official IBCC equivalents; required subject group also applies.",
      "NET merit: 75% test + 15% HSSC + 10% SSC. Final-year A Level applicants use 25% O Level equivalence.",
      "Computing and engineering use NET-Engineering. Business uses its own NET paper.",
      "Pre-medical and ICS applicants must check programme-specific Mathematics or Chemistry requirements.",
    ],
    applicationSteps: [
      "Check programme subjects and IBCC equivalence",
      "Register on the NUST admissions portal",
      "Select the correct NET paper and pay the test fee",
      "Submit financial aid form if needed",
      "Take NET and review programme preferences",
      "Follow selection lists and submit final documents",
    ],
    aid: "Need-based scholarships and interest-free loans are available. Submit NFAAF by the admission application deadline.",
  },
  {
    id: "fast",
    name: "FAST National University of Computer & Emerging Sciences",
    shortName: "FAST–NUCES",
    city: "Islamabad",
    country: "Pakistan",
    model: "fast",
    majors: ["computing", "engineering", "business"],
    description:
      "A focused route into computing, engineering and business, with merit calculated by programme.",
    testLabel: "NU admission test · %",
    color: "#568996",
    sources: [
      source(
        "FAST eligibility and merit criteria",
        "https://www.nu.edu.pk/Admissions/EligibilityCriteria",
      ),
      source("Test pattern", "https://www.nu.edu.pk/Admissions/TestPattern"),
      source(
        "Financial assistance",
        "https://nu.edu.pk/Admissions/Scholarship",
      ),
      source(
        "Application instructions",
        "https://www.nu.edu.pk/Admissions/HowToApply",
      ),
    ],
    requirements: [
      "SSC minimum 60%; HSSC minimum 50% for computing/business, or 60% for engineering.",
      "Computing requires Mathematics; engineering requires Pre-Engineering or ICS subjects.",
      "NU test calculation: computing/business 50% test + 40% HSSC + 10% SSC; engineering 33% + 50% + 17%.",
      "Choose one permitted test route: NU test, SAT or relevant NTS NAT. This calculator supports the NU test route.",
      "Use the applicable HSSC Part-I/final or IBCC equivalent. Cutoffs are set by the university for each admission cycle.",
    ],
    applicationSteps: [
      "Check programme and campus availability",
      "Prepare academic records and IBCC certificates",
      "Complete the online application",
      "Choose one eligible test route and pay the fee",
      "Take the test and check the merit result",
      "Accept an offer and submit required documents",
    ],
    aid: "FAST lists merit scholarships and interest-free study loans. Check conditions and deadlines with your campus.",
  },
  {
    id: "lums",
    name: "Lahore University of Management Sciences",
    shortName: "LUMS",
    city: "Lahore",
    country: "Pakistan",
    model: "holistic",
    majors: ["computing", "engineering", "business"],
    description:
      "A school-based application where academics, experiences and your story are considered together.",
    testLabel: "SAT / ACT / LCAT",
    color: "#879464",
    sources: [
      source(
        "Computer science admission criteria",
        "https://lums.edu.pk/programmes/bs-computer-science",
      ),
      source(
        "Business admission criteria",
        "https://sdsb.lums.edu.pk/programmes/bsc-honours-management-science",
      ),
      source(
        "Tests and application FAQ",
        "https://admission.lums.edu.pk/admission-faqs",
      ),
      source(
        "Programme finder and financial aid",
        "https://admission.lums.edu.pk/undergraduate-programmes",
      ),
    ],
    requirements: [
      "FSc/ICS route: at least 70% in Matric and FSc/ICS (Part-I when eligible to apply with results pending).",
      "O Level route: at least eight subjects with average B; completed A Levels need a best-three average of BBC in eligible full-credit subjects.",
      "Take SAT, ACT or LCAT. LUMS publishes no minimum SAT/ACT score and no numeric acceptance formula.",
      "Science and engineering have specific subject requirements. Review the school page and complete two teacher evaluations.",
    ],
    applicationSteps: [
      "Choose your school and intended major",
      "Check curriculum and subject requirements",
      "Prepare personal statements and activities",
      "Request two teacher evaluations",
      "Submit the application and required test results",
      "Complete financial aid documents if applying for aid",
    ],
    aid: "Need-based financial aid is available. Indicate your intention in the admission application, then complete the separate aid form.",
  },
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    shortName: "MIT",
    city: "Cambridge, MA",
    country: "USA",
    model: "holistic",
    majors: ["computing", "engineering", "business"],
    description:
      "Contextual admission for students who enjoy building, discovering and solving hard problems.",
    testLabel: "SAT or ACT required",
    color: "#9b655f",
    sources: [
      source(
        "International applicants",
        "https://mitadmissions.org/apply/firstyear/international/",
      ),
      source(
        "Tests and scores",
        "https://mitadmissions.org/apply/firstyear/tests-scores/",
      ),
      source(
        "Application checklist",
        "https://mitadmissions.org/apply/firstyear/deadlines-requirements/",
      ),
      source(
        "Financial aid",
        "https://mitadmissions.org/afford/cost-aid-basics/access-affordability/",
      ),
    ],
    requirements: [
      "SAT or ACT is required; MIT has no published SAT/ACT cutoff or recommended score.",
      "Submit original school grades and external examination results; predicted grades can be supplied when available.",
      "Your school sends a Secondary School Report and transcript. Prepare two teacher recommendations and MIT short essays.",
      "Review English proficiency guidance. Students apply to MIT generally and choose a major after the first year.",
    ],
    applicationSteps: [
      "Read MIT international applicant guidance",
      "Create an MIT application account",
      "Arrange SAT or ACT and review English testing",
      "Write MIT essays and record activities",
      "Request school report and teacher recommendations",
      "Submit the application and separate financial aid materials",
    ],
    aid: "Need-blind admission for international students; MIT meets 100% of demonstrated financial need for admitted students who apply for aid.",
  },
  {
    id: "amherst",
    name: "Amherst College",
    shortName: "Amherst",
    city: "Amherst, MA",
    country: "USA",
    model: "holistic",
    majors: ["computing"],
    description:
      "Computer science in a liberal arts setting, with an open curriculum and international financial aid.",
    testLabel: "SAT / ACT optional",
    color: "#837397",
    sources: [
      source(
        "International admission, testing and aid",
        "https://www.amherst.edu/admission/apply/international",
      ),
      source(
        "First-year application",
        "https://www.amherst.edu/admission/apply/firstyear",
      ),
      source(
        "Computer science",
        "https://www.amherst.edu/academiclife/departments/computer_science",
      ),
    ],
    requirements: [
      "SAT and ACT are optional for the 2026–27 admission cycle.",
      "Applications consider school results, predicted exams, essays, recommendations and experiences.",
      "English testing is required for non-native speakers unless the most recent two school years were taught in English.",
      "This listing covers computer science; Amherst does not offer the same professional-degree menu as a technical university.",
    ],
    applicationSteps: [
      "Review the international and first-year checklists",
      "Start Common App or Coalition with Scoir",
      "Prepare application writing and school materials",
      "Confirm English proficiency or waiver eligibility",
      "Choose whether to submit SAT or ACT",
      "Submit admission and financial aid applications",
    ],
    aid: "Need-blind admission for international students; Amherst meets 100% of calculated need for admitted international students who apply for aid.",
  },
  {
    id: "asu",
    name: "Arizona State University",
    shortName: "ASU",
    city: "Tempe, AZ",
    country: "USA",
    model: "holistic",
    majors: ["computing", "engineering", "business"],
    description:
      "A broad range of degree choices, with international academic and English requirements to check.",
    testLabel: "SAT / ACT generally optional",
    color: "#ac8158",
    sources: [
      source(
        "International first-year requirements",
        "https://admission.asu.edu/apply/international/first-year",
      ),
      source(
        "International cost and scholarships",
        "https://admission.asu.edu/cost-aid/international",
      ),
    ],
    requirements: [
      "ASU states a 3.00/B-equivalent secondary academic standard; it evaluates your original international credentials.",
      "Submit secondary transcripts, examination results and the completed school certificate.",
      "Check Mathematics, laboratory science, English proficiency and the selected degree’s additional requirements.",
      "SAT/ACT is generally optional; some degrees have higher requirements. Rasta does not convert FSc percentages to a US GPA.",
    ],
    applicationSteps: [
      "Check international and degree-specific requirements",
      "Apply through ASU or Common App",
      "Arrange official transcripts and examination results",
      "Submit English proficiency evidence",
      "Review costs and international scholarships",
      "Track missing documents and decisions in My ASU",
    ],
    aid: "International merit scholarships may help with costs. Review the current award rules and the full cost of attendance.",
  },
];

const mitCds = 'https://ir.mit.edu/projects/2025-26-common-data-set/';
const lumsClass = 'https://admission.lums.edu.pk/undergraduate-programmes';
const amherstClass = 'https://www.amherst.edu/about/facts/secondary_school_reports/class-of-2029-admission-and-enrollment-profile';
const details: Record<string, Partial<University>> = {
  nust: { logo: '/logos/nust.png', website: 'https://nust.edu.pk/', stats: [{ label: 'NET weighting', value: '75%', source: coreUniversities[0].sources[0].url }, { label: 'SSC & HSSC minimum', value: '60% each', source: coreUniversities[0].sources[1].url }], programmes: ['computer-science', 'data-science', 'artificial-intelligence', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering', 'business-administration', 'accounting-finance'] },
  fast: { logo: '/logos/fast-mark.png', website: 'https://www.nu.edu.pk/', stats: [{ label: 'Computing NU test weighting', value: '50%', source: coreUniversities[1].sources[0].url }, { label: 'Engineering test weighting', value: '33%', source: coreUniversities[1].sources[0].url }], programmes: ['computer-science', 'software-engineering', 'artificial-intelligence', 'data-science', 'cybersecurity', 'electrical-engineering', 'computer-engineering', 'business-administration', 'accounting-finance'] },
  lums: { logo: '/logos/lums-mark.png', website: 'https://lums.edu.pk/', satStats: { average: 1380, label: 'Average SAT', cohort: 'Incoming class of 2029/30', source: lumsClass }, stats: [{ label: 'Average FSc / ICS · class of 2029/30', value: '88%', source: lumsClass }, { label: 'Average Matric · class of 2029/30', value: '93%', source: lumsClass }], programmes: ['computer-science', 'chemical-engineering', 'electrical-engineering', 'accounting-finance', 'management-science', 'economics', 'mathematics', 'biology', 'chemistry', 'physics', 'psychology', 'political-science', 'english', 'law'] },
  mit: { logo: '/logos/mit-mark.svg', website: 'https://mitadmissions.org/', satStats: { low: 1520, high: 1570, label: 'SAT composite middle 50%', cohort: 'Fall 2025 enrolled SAT submitters · CDS 2025–26', source: mitCds }, stats: [{ label: 'Undergraduates · Fall 2025', value: '4,561', source: mitCds }], programmes: ['computer-science', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering', 'chemical-engineering', 'aerospace-engineering', 'management-science'] },
  amherst: { logo: '/logos/amherst.png', website: 'https://www.amherst.edu/', satStats: { average: 1506, label: 'Mean SAT · section means combined', cohort: 'Class of 2029 enrolled SAT submitters · 192 students', source: amherstClass }, stats: [{ label: 'Mean SAT reading & writing · class of 2029', value: '750', source: amherstClass }, { label: 'Mean SAT Mathematics · class of 2029', value: '756', source: amherstClass }], programmes: ['computer-science'] },
  asu: { logo: '/logos/asu.png', website: 'https://admission.asu.edu/', stats: [{ label: 'International academic standard', value: 'B / 3.00', source: coreUniversities[5].sources[0].url }] },
};
for (const university of coreUniversities) {
  Object.assign(university, details[university.id], { coverage: 'verified' });
  const facts = coreFacts[university.id];
  if (facts) {
    university.facts = facts;
    // Hand-checked cohort statistics win; IPEDS fills in where none were recorded.
    if (!university.satStats && facts.sat25 !== undefined && facts.sat75 !== undefined) university.satStats = { low: facts.sat25, high: facts.sat75, label: 'SAT middle 50%', cohort: `Fall ${facts.year.slice(0, 4)} first-year students who submitted SAT · IPEDS`, source: facts.source };
  }
}
export const universities: University[] = [...coreUniversities, ...directoryUniversities];

/** Preserves original grades while adapting new/mixed curricula for the legacy rules. */
function planningProfile(profile: Profile): Profile {
  const academic = academicSummary(profile);
  return { ...profile, curriculum: profile.higherSecondary ?? profile.curriculum,
    secondary: profile.secondary ?? (profile.curriculum === 'alevel' ? 'olevel' : 'matric'),
    major: programmeCategory(profile.programme) ?? profile.major,
    ssc: academic.ssc ?? '', hssc: academic.hssc ?? '', mathematics: academic.math };
}

type Model = "nust" | "fast";

function inRange(
  value: unknown,
  maximum: number,
  minimum = 0,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function academicParts(
  model: Model,
  profile: Profile,
): { base: number; testWeight: number; maximum: number } | null {
  if (profile.programme && programmeCategory(profile.programme) === null) return null;
  profile = planningProfile(profile);
  if (!inRange(profile.ssc, 100)) return null;
  const awaitingALevel =
    profile.curriculum === "alevel" && profile.stage === "awaiting";
  const hssc = awaitingALevel ? profile.ssc : profile.hssc;
  if (!inRange(hssc, 100)) return null;
  if (model === "nust") {
    return {
      base: awaitingALevel
        ? profile.ssc * 0.25
        : profile.ssc * 0.1 + hssc * 0.15,
      testWeight: 0.75,
      maximum: 200,
    };
  }
  if (model !== "fast") return null;
  return profile.major === "engineering"
    ? { base: profile.ssc * 0.17 + hssc * 0.5, testWeight: 0.33, maximum: 100 }
    : { base: profile.ssc * 0.1 + hssc * 0.4, testWeight: 0.5, maximum: 100 };
}

/** Formula output is an aggregate percentage, never an admission probability. */
export function calculateAggregate(
  model: Model,
  profile: Profile,
  testScore: number,
): number | null {
  const parts = academicParts(model, profile);
  if (!parts || !inRange(testScore, parts.maximum)) return null;
  return parts.base + (testScore / parts.maximum) * parts.testWeight * 100;
}

/** Inverts a user-chosen aggregate; null means missing/invalid grades or an unreachable target. */
export function requiredTestScore(
  model: Model,
  profile: Profile,
  targetAggregate: number,
): number | null {
  const parts = academicParts(model, profile);
  if (!parts || !inRange(targetAggregate, 100)) return null;
  const raw =
    ((targetAggregate - parts.base) / (parts.testWeight * 100)) * parts.maximum;
  if (raw > parts.maximum + 1e-9) return null;
  if (raw <= 0) return 0;
  // Round upward so the returned test score actually reaches the requested target.
  const precision = model === "nust" ? 1 : 100;
  return Math.min(parts.maximum, Math.ceil(raw * precision - 1e-9) / precision);
}

function gradeMissing(profile: Profile): string[] {
  const missing: string[] = [];
  if (!inRange(profile.ssc, 100))
    missing.push("Enter SSC / O Level equivalent between 0 and 100%.");
  if (
    !(profile.curriculum === "alevel" && profile.stage === "awaiting") &&
    !inRange(profile.hssc, 100)
  ) {
    missing.push(
      profile.stage === "awaiting"
        ? "Enter HSSC Part-I marks as a percentage."
        : "Enter HSSC / A Level equivalent between 0 and 100%.",
    );
  }
  return missing;
}

function assessAcademicRules(
  university: University,
  profile: Profile,
): Assessment {
  if (!profile.programme && !university.majors.includes(profile.major)) {
    return {
      label: "Check eligibility",
      tone: "caution",
      detail: "Your selected field is not covered by this university listing.",
      missing: ["Review the university’s degree catalogue before applying."],
    };
  }

  if (university.model === "holistic") {
    const missing: string[] = [];
    if (profile.sat !== "" && !inRange(profile.sat, 1600, 400))
      missing.push("SAT total must be between 400 and 1600.");
    if (university.id === "lums") {
      const hasOLevels = profile.secondary === 'olevel';
      if (profile.curriculum === "alevel" || hasOLevels) {
        missing.push(
          `${hasOLevels ? 'Check original O Level average B' : 'Check Matric minimum 70%'}${profile.curriculum === 'alevel' ? ' and the best-three A Level BBC condition' : ' and FSc/ICS minimum 70%'}; equivalence percentages cannot confirm letter-grade conditions.`,
        );
        missing.push(
          "Confirm eligible full-credit subjects and required IBCC certificates.",
        );
        const matricMissing = !hasOLevels && !inRange(profile.ssc, 100);
        const fscMissing = profile.curriculum === 'fsc' && !inRange(profile.hssc, 100);
        if (matricMissing || fscMissing) return { label: 'Needs grades', tone: 'neutral', detail: 'Add the Matric or FSc/ICS marks for the corresponding part of your mixed curriculum route.', missing };
        if ((!hasOLevels && typeof profile.ssc === 'number' && profile.ssc < 70) || (profile.curriculum === 'fsc' && typeof profile.hssc === 'number' && profile.hssc < 70)) return { label: 'Check eligibility', tone: 'caution', detail: 'The Matric and FSc/ICS portions of your route must meet their 70% minimum. O/A Level requirements are checked from original letter grades.', missing };
      } else {
        missing.push(...gradeMissing(profile));
        if (
          missing.length > 0 &&
          (!inRange(profile.ssc, 100) || !inRange(profile.hssc, 100))
        ) {
          return {
            label: "Needs grades",
            tone: "neutral",
            detail:
              "Enter Matric and FSc/ICS percentages to check the published grade minimums.",
            missing,
          };
        }
        if (
          (typeof profile.ssc === "number" && profile.ssc < 70) ||
          (typeof profile.hssc === "number" && profile.hssc < 70)
        ) {
          return {
            label: "Check eligibility",
            tone: "caution",
            detail:
              "The FSc/ICS route requires at least 70% in Matric and FSc/ICS. Review improvement and result-timing rules.",
            missing: [
              "Check the exact school and curriculum route with LUMS admissions.",
            ],
          };
        }
      }
      if (!inRange(profile.sat, 1600, 400))
        missing.push(
          "Confirm a valid SAT, ACT or LCAT attempt by the cycle’s deadline.",
        );
      if (profile.major !== "business")
        missing.push(
          "Check SBASSE subjects; engineering needs the relevant Pre-Engineering equivalence.",
        );
      return {
        label: "Holistic review",
        tone: "neutral",
        detail:
          "LUMS weighs your complete application. There is no published SAT cutoff or reliable score-to-acceptance formula.",
        missing,
      };
    }
    if (university.id === "mit") {
      if (!inRange(profile.sat, 1600, 400))
        missing.push(
          "Record your SAT or confirm an ACT attempt; one is required.",
        );
      missing.push(
        "Review English proficiency guidance and arrange school records and recommendations.",
      );
      return {
        label: "Holistic review",
        tone: "neutral",
        detail:
          "MIT reviews your academic and personal context. It publishes no SAT cutoff; a higher score cannot guarantee admission.",
        missing,
      };
    }
    if (university.id === "asu") {
      missing.push(
        "Have ASU evaluate your original school credentials against its B/3.00 academic standard.",
      );
      missing.push(
        "Check degree-specific subjects and English proficiency requirements.",
      );
      return {
        label: "Check eligibility",
        tone: "neutral",
        detail:
          "ASU requires an international credential review. FSc percentages and IBCC equivalents cannot be converted directly to a US GPA here.",
        missing,
      };
    }
    if (university.id === "amherst") {
      missing.push(
        "Check English testing or eligibility for the two-year English-medium waiver.",
      );
      return {
        label: "Holistic review",
        tone: "neutral",
        detail:
          "Amherst considers the complete application. SAT/ACT is optional for the 2026–27 cycle.",
        missing,
      };
    }
    missing.push(
      "Check the current international first-year requirements, English proficiency evidence and any programme-specific prerequisites on the official admissions page.",
    );
    return {
      label: "Holistic review",
      tone: "neutral",
      detail: `${university.shortName} reviews the whole application. The statistics on this page describe a previous class, not a cutoff.`,
      missing,
    };
  }

  const missing = gradeMissing(profile);
  if (missing.length > 0)
    return {
      label: "Needs grades",
      tone: "neutral",
      detail:
        "Add valid academic percentages to calculate your admission aggregate.",
      missing,
    };
  const awaitingALevel =
    profile.curriculum === "alevel" && profile.stage === "awaiting";
  const hsscMinimum =
    university.model === "nust" || profile.major === "engineering" ? 60 : 50;
  const belowMinimum =
    (profile.ssc as number) < 60 ||
    (!awaitingALevel && (profile.hssc as number) < hsscMinimum);
  const score = university.model === "nust" ? profile.net : profile.nu;
  const maximum = university.model === "nust" ? 200 : 100;
  const aggregate = inRange(score, maximum)
    ? calculateAggregate(university.model, profile, score)
    : null;
  if (!inRange(score, maximum))
    missing.push(
      university.model === "nust"
        ? "Add a NET score between 0 and 200."
        : "Add a NU admission test percentage between 0 and 100.",
    );
  if (profile.curriculum === "alevel")
    missing.push(
      "Use the official IBCC equivalence certificate and confirm the required subject group.",
    );
  if (profile.stage === "awaiting")
    missing.push(
      `Final HSSC / A Level results must still meet the ${hsscMinimum}% minimum and subject requirements.`,
    );
  const subjectCheck = profile.major !== "business" && !profile.mathematics;
  if (subjectCheck) {
    missing.push(
      university.model === "fast"
        ? "Computing needs Mathematics (including the additional-Math route); engineering needs Pre-Engineering or ICS subjects."
        : "Check the pre-medical route: computing requires deficient Mathematics courses; engineering requires the condensed Mathematics course before admission.",
    );
  } else if (profile.major === "engineering") {
    missing.push(
      "Confirm Physics and the required third subject/group; Mathematics alone does not establish engineering eligibility.",
    );
  } else if (university.model === "nust" && profile.major === "business") {
    missing.push(
      "Use the Business Studies NET paper; Accounting & Finance has its own subject conditions.",
    );
  }
  if (belowMinimum || subjectCheck) {
    return {
      label: "Check eligibility",
      tone: "caution",
      ...(aggregate === null ? {} : { aggregate }),
      detail: belowMinimum
        ? `Published grade minimums are SSC 60% and HSSC ${hsscMinimum}%. An aggregate does not override eligibility rules.`
        : "Your subject route needs review. The aggregate is a calculation only and does not confirm eligibility.",
      missing,
    };
  }
  return {
    label: "Meets grade minimums",
    tone: "good",
    ...(aggregate === null ? {} : { aggregate }),
    detail: awaitingALevel
      ? "Your O Level percentage meets the initial grade screen. Final A Level eligibility and programme merit still apply."
      : "Your entered grades clear the published minimums. Programme subjects, test route and the university’s merit list determine admission.",
    missing,
  };
}

export function assessUniversity(university: University, profile: Profile): Assessment {
  if (university.coverage === 'directory') return { label: 'Requirements not reviewed', tone: 'neutral', detail: 'This is an institution directory record. Rasta has not verified its current admission requirements or programme availability.', missing: ['Check the official institution or registry page before applying.'] };
  if (university.model !== 'holistic' && profile.programme && programmeCategory(profile.programme) === null) return { label: 'Programme review needed', tone: 'neutral', detail: 'Your chosen programme needs its own eligibility and test rules. The computing/engineering/business calculator does not cover it.', missing: ['Check this programme’s official admissions page.', 'Confirm the required test, subjects and documents.'] };
  const academic = academicSummary(profile);
  const normalized = planningProfile(profile);
  const result = assessAcademicRules(university, normalized);
  if (profile.programme && university.programmes && !university.programmes.includes(profile.programme)) result.missing.push('Your exact programme is not included in this overview. Confirm that the institution and campus offer it.');
  if (academic.isEstimate) {
    result.detail += ' This uses provisional or unofficial academic estimates; final eligibility requires official results.';
    // IBCC equivalence notes only matter where a Pakistani percentage is actually used.
    if (university.country === 'Pakistan') result.missing = [...new Set([...result.missing, ...academic.notes])];
    if (result.label === 'Meets grade minimums') { result.label = 'Estimated grade screen'; result.tone = 'neutral'; }
  }
  return result;
}
