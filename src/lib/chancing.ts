import type { Activity, Assessment, Major, Page, Profile, University } from '../types';
import { academicSummary, programmeCategory } from './academics';
import { assessUniversity, calculateAggregate, requiredTestScore } from './admissions';

export type Band = 'far-reach' | 'reach' | 'target' | 'likely' | 'safety';
export interface ChanceFactor { label: string; detail: string; effect: 'up' | 'down' | 'neutral'; weight: number }
export interface ReviewSignal { title: string; detail: string; status: 'ready' | 'action' | 'review'; page?: Page }
export interface Improvement { label: string; from: number; to: number }
export interface ChanceReview {
  /** Estimated admission chance in percent, or null when the public data cannot support an estimate. */
  probability: number | null;
  band: Band | null;
  label: string;
  tone: Assessment['tone'];
  summary: string;
  method: string;
  factors: ChanceFactor[];
  improvements: Improvement[];
  assessment: Assessment;
  signals: ReviewSignal[];
  /** Merit-route universities: the closing aggregate the estimate was compared against. */
  meritReference?: { value: number; label: string; source: string; editable: true };
}

export const BANDS: Record<Band, { label: string; tone: Assessment['tone']; range: string; blurb: string }> = {
  'far-reach': { label: 'Far reach', tone: 'caution', range: 'under 10%', blurb: 'Apply if you love it, but build your list around likelier options.' },
  reach: { label: 'Reach', tone: 'caution', range: '10–25%', blurb: 'Possible with a strong application; do not count on it.' },
  target: { label: 'Target', tone: 'neutral', range: '25–50%', blurb: 'Your profile sits around the typical admitted student.' },
  likely: { label: 'Likely', tone: 'good', range: '50–75%', blurb: 'You compare well with the admitted class.' },
  safety: { label: 'Safety', tone: 'good', range: 'over 75%', blurb: 'A strong chance; keep at least two of these on your list.' },
};
/** Whole percentages, with one decimal kept below 10% so small differences stay visible. */
export const roundChance = (probability: number) => probability < 10 ? Math.round(probability * 10) / 10 : Math.round(probability);
export const bandFor = (probability: number): Band => probability < 10 ? 'far-reach' : probability < 25 ? 'reach' : probability < 50 ? 'target' : probability < 75 ? 'likely' : 'safety';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const validSat = (score: Profile['sat']): score is number => typeof score === 'number' && Number.isFinite(score) && score >= 400 && score <= 1600;
const gradePoints: Record<string, number> = { 'A*': 1, A: 0.85, B: 0.65, C: 0.45, D: 0.25, E: 0.1 };

/** Reported closing aggregates from previous merit lists. Unofficial; students should replace them with the current year's list. */
export const MERIT_REFERENCES: Record<'nust' | 'fast', { source: string; label: string; byMajor: Record<Major, number> }> = {
  nust: { label: 'Reported 2024 closing aggregates (CS 73%, EE 72%, BBA 65%)', source: 'https://blog.maqsad.io/blog/nust-closing-merits', byMajor: { computing: 73, engineering: 72, business: 65 } },
  fast: { label: 'Reported 2025 closing aggregates (CS Lahore/Islamabad ≈ 72%)', source: 'https://blog.maqsad.io/blog/fast-aggregate-calculator', byMajor: { computing: 72, engineering: 62, business: 60 } },
};

/** 0 = nothing recorded, 1 = several deep, sustained commitments including leadership or work. */
export function activityStrength(entries: Activity[] | undefined, legacyNotes: string): number {
  const real = (entries ?? []).filter(item => item.title.trim());
  if (!real.length) return legacyNotes.trim() ? 0.25 : 0;
  let score = 0;
  for (const item of real) {
    const hours = typeof item.hoursPerWeek === 'number' ? item.hoursPerWeek : 0;
    const weeks = typeof item.weeksPerYear === 'number' ? item.weeksPerYear : 0;
    const depth = clamp((hours * Math.max(weeks, hours ? 20 : 0)) / 400, 0, 1);
    const described = item.description.trim().length > 60 ? 0.35 : item.description.trim() ? 0.15 : 0;
    const role = /lead|found|captain|president|head|organi[sz]er|manager|editor/i.test(`${item.role} ${item.title}`) || ['Leadership', 'Research', 'Work'].includes(item.type) ? 0.25 : 0;
    score += 0.25 + depth * 0.4 + described + role;
  }
  return clamp(score / 4.5, 0, 1);
}

/** Grade strength in [-1, 1] relative to a strong applicant (A-level AAA ≈ +0.5, FSc 80% ≈ 0). */
function gradeStrength(profile: Profile, benchmark?: { hssc?: number; ssc?: number }): { score: number; detail: string } | null {
  const higher = profile.higherSecondary ?? profile.curriculum;
  if (higher === 'alevel') {
    const graded = (profile.aLevels ?? []).filter(item => item.subject.trim() && gradePoints[item.grade] !== undefined).sort((a, b) => gradePoints[b.grade] - gradePoints[a.grade]);
    if (graded.length) {
      const best = graded.slice(0, 3);
      const mean = best.reduce((sum, item) => sum + gradePoints[item.grade], 0) / best.length;
      const predicted = best.some(item => item.predicted);
      return { score: clamp((mean - 0.7) / 0.3, -1, 1), detail: `Best ${best.length} A Level grade${best.length > 1 ? 's' : ''}: ${best.map(item => item.grade).join(' ')}${predicted ? ' (includes predicted grades)' : ''}.` };
    }
    const oGraded = (profile.oLevels ?? []).filter(item => item.subject.trim() && gradePoints[item.grade] !== undefined);
    if (oGraded.length) {
      const mean = oGraded.reduce((sum, item) => sum + gradePoints[item.grade], 0) / oGraded.length;
      return { score: clamp((mean - 0.72) / 0.28, -1, 1) * 0.8, detail: `O Level average across ${oGraded.length} subjects, used until A Level grades are added.` };
    }
    return null;
  }
  const academic = academicSummary(profile);
  const hssc = academic.hssc ?? null;
  const ssc = academic.ssc ?? null;
  const value = hssc ?? ssc;
  if (value === null) return null;
  const centre = benchmark?.hssc ?? 80;
  const spread = benchmark ? 8 : 15;
  return { score: clamp((value - centre) / spread, -1, 1), detail: `${hssc !== null ? (profile.stage === 'awaiting' && profile.predictedHssc !== '' && profile.predictedHssc !== undefined ? 'Predicted FSc' : 'FSc / Intermediate') : 'Matric'} ${value.toFixed(0)}%${benchmark?.hssc ? ` against a published class average of ${benchmark.hssc}%` : ' (80% is treated as the midpoint for competitive admission)'}.` };
}

interface Model { logit: number; factors: ChanceFactor[] }
function push(model: Model, label: string, weight: number, detail: string) {
  model.logit += weight;
  model.factors.push({ label, detail, weight: Math.round(weight * 100) / 100, effect: weight > 0.05 ? 'up' : weight < -0.05 ? 'down' : 'neutral' });
}

function holisticEstimate(university: University, profile: Profile, options: { sat?: Profile['sat']; activities?: number } = {}): { probability: number; factors: ChanceFactor[]; method: string } | null {
  const facts = university.facts;
  const stats = university.satStats;
  const isLums = university.id === 'lums';
  const base = facts?.acceptanceRate !== undefined ? facts.acceptanceRate / 100 : isLums ? 0.2 : null;
  if (base === null) return null;
  const model: Model = { logit: logit(clamp(base, 0.01, 0.99)), factors: [] };
  model.factors.push({ label: `Overall admit rate ${roundChance(base * 100)}%`, detail: facts?.acceptanceRate !== undefined ? `${facts.admitted?.toLocaleString()} of ${facts.applicants?.toLocaleString()} first-year applicants were admitted (${facts.year}). This is the starting point.` : 'LUMS does not publish an acceptance rate. Rasta assumes 20% as the starting point for this estimate.', effect: 'neutral', weight: 0 });
  const selective = base < 0.3;
  const veryPositive = base > 0.6;

  const grades = gradeStrength(profile, isLums ? { hssc: 88, ssc: 93 } : undefined);
  if (grades) push(model, 'Academic results', grades.score * (veryPositive ? 0.7 : 1.1), grades.detail);
  else push(model, 'Academic results not added', -0.3, 'Add your grades in your profile; admission decisions start with them.');

  const sat = options.sat === undefined ? profile.sat : options.sat;
  const policy = facts?.testPolicy ?? (stats ? 'optional' : undefined);
  if (policy === 'blind') model.factors.push({ label: 'Test scores not considered', detail: 'This university does not look at SAT or ACT scores.', effect: 'neutral', weight: 0 });
  else if (validSat(sat)) {
    if (stats?.low !== undefined && stats.high !== undefined) {
      const mid = (stats.low + stats.high) / 2;
      const half = Math.max((stats.high - stats.low) / 2, 60);
      const z = clamp((sat - mid) / half, -2, 2);
      let weight = z * 0.8;
      const optionalAndLow = policy === 'optional' && sat < stats.low;
      if (optionalAndLow) weight = Math.max(weight, -0.3);
      push(model, `SAT ${sat} vs. middle 50% ${stats.low}–${stats.high}`, weight, sat < stats.low ? `Below the 25th percentile of enrolled students.${optionalAndLow ? ' Because testing is optional, you could apply without submitting it.' : ''}` : sat > stats.high ? 'Above the 75th percentile of enrolled students.' : 'Within the middle 50% of enrolled students.');
    } else if (stats?.average !== undefined) {
      const z = clamp((sat - stats.average) / 100, -2, 2);
      push(model, `SAT ${sat} vs. class average ${stats.average}`, z * 0.8, `${stats.cohort}.`);
    } else {
      const expected = 1050 + (1 - base) * 450;
      const z = clamp((sat - expected) / 120, -2, 2);
      push(model, `SAT ${sat}`, z * 0.6, `No SAT range is published for this university; a score near ${Math.round(expected / 10) * 10} would be typical for its admit rate.`);
    }
  } else if (policy === 'required') push(model, 'SAT or ACT required — no score yet', -1, 'A required test is missing. Add your SAT total, or an ACT plan, in your profile.');
  else push(model, 'No SAT recorded', selective ? -0.35 : -0.15, policy === 'optional' ? 'Test-optional, so this is not disqualifying, but a strong score would add evidence.' : 'Check the current test policy; a strong score usually helps.');

  const activities = options.activities ?? activityStrength(profile.activityEntries, profile.activities);
  push(model, activities === 0 ? 'No activities recorded' : activities > 0.7 ? 'Deep, sustained activities' : activities > 0.35 ? 'Solid activities' : 'A few activities', (activities - 0.45) * (selective ? 1.2 : 0.8), activities === 0 ? 'Holistic review weighs what you did outside class. Add up to 10 activities with your role and time commitment.' : 'Depth, leadership and sustained commitment count more than the number of entries.');

  const category = programmeCategory(profile.programme) ?? profile.major;
  const competitive = ['computer-science', 'artificial-intelligence', 'software-engineering', 'data-science', 'nursing', 'medicine'].includes(profile.programme ?? '') || (category === 'engineering' && selective);
  if (competitive && base < 0.5) push(model, 'Competitive programme', -0.35, 'Computing, engineering and health programmes usually admit at a lower rate than the university overall.');
  else if (category === 'business' && selective) push(model, 'Business programme', -0.15, 'Selective business schools often run a separate, tighter admission.');

  if (!isLums) push(model, 'International applicant', selective ? -0.45 : -0.25, 'International pools are larger and more competitive, and most US universities are need-aware for international students.');
  const probability = clamp(sigmoid(model.logit) * 100, 0.5, 99);
  return { probability, factors: model.factors, method: facts?.acceptanceRate !== undefined ? `Starts from the published ${facts.year} admit rate and adjusts it for your grades, test score, activities, programme and international status. It is an estimate from public data, not a decision.` : 'Starts from an assumed 20% admit rate (LUMS publishes none) and adjusts it for your results against the published class averages, your SAT, activities and programme.' };
}

function meritEstimate(university: University, profile: Profile, reference: number): { probability: number; factors: ChanceFactor[]; method: string; aggregate: number | null } {
  const model = university.model as 'nust' | 'fast';
  const score = model === 'nust' ? profile.net : profile.nu;
  const maximum = model === 'nust' ? 200 : 100;
  const aggregate = typeof score === 'number' && score >= 0 && score <= maximum ? calculateAggregate(model, profile, score) : null;
  const factors: ChanceFactor[] = [];
  if (aggregate === null) return { probability: NaN, factors, method: '', aggregate };
  const gap = aggregate - reference;
  const probability = clamp(sigmoid(gap / 2) * 100, 0.5, 99);
  factors.push({ label: `Your aggregate ${aggregate.toFixed(2)}%`, detail: `Calculated with the published ${model === 'nust' ? 'NUST' : 'FAST'} formula from your results and test score.`, effect: 'neutral', weight: 0 });
  factors.push({ label: `${gap >= 0 ? '+' : ''}${gap.toFixed(2)} points vs. reference ${reference}%`, detail: gap >= 3 ? 'Comfortably above last year’s reported closing aggregate.' : gap >= 0 ? 'Just above the reported closing aggregate; small changes in the applicant pool matter.' : gap >= -3 ? 'Just below the reported closing aggregate. Later merit lists often close lower than the first.' : 'Well below the reported closing aggregate for this programme group.', effect: gap >= 0 ? 'up' : 'down', weight: Math.round(gap / 2 * 100) / 100 });
  return { probability, factors, aggregate, method: 'Compares your calculated aggregate with a reported closing aggregate from a previous merit list. Change the reference to this year’s list when it is published.' };
}

export interface ChanceOptions { meritReference?: number }
/** An evidence-based estimate of admission chance with every factor shown. */
export function checkChances(university: University, profile: Profile, options: ChanceOptions = {}): ChanceReview {
  const assessment = assessUniversity(university, profile);
  const signals: ReviewSignal[] = [{ title: 'Academic requirements', detail: assessment.detail, status: assessment.tone === 'good' ? 'ready' : 'review', page: 'profile' }];
  const empty = (label: string, summary: string, method: string): ChanceReview => ({ probability: null, band: null, label, tone: 'neutral', summary, method, factors: [], improvements: [], assessment, signals });

  if (university.model === 'nust' || university.model === 'fast') {
    const major = programmeCategory(profile.programme) ?? profile.major;
    const reference = MERIT_REFERENCES[university.model];
    const value = options.meritReference ?? reference.byMajor[major];
    const meritReference = { value, label: reference.label, source: reference.source, editable: true as const };
    if (profile.programme && programmeCategory(profile.programme) === null) return { ...empty('Programme not covered', 'The calculator covers computing, engineering and business routes. Check this programme’s own merit criteria.', ''), meritReference };
    const estimate = meritEstimate(university, profile, value);
    signals.push({ title: estimate.aggregate === null ? 'Add your admission test score' : 'Aggregate calculated', detail: estimate.aggregate === null ? `${university.testLabel}. Add your grades and your ${university.model === 'nust' ? 'NET' : 'NU test'} result, or explore scores in the planner.` : `${estimate.aggregate.toFixed(2)}% with the published formula. Compare scenarios in the planner.`, status: estimate.aggregate === null ? 'action' : 'ready', page: 'planner' });
    if (estimate.aggregate === null) return { ...empty('Add a test score', 'Your calculated aggregate is needed before it can be compared with the reported closing merit.', estimate.method || 'Compares your aggregate with a reported closing aggregate.'), meritReference };
    const band = bandFor(estimate.probability);
    const improvements: Improvement[] = [];
    const needed = requiredTestScore(university.model, profile, value + 3);
    const current = university.model === 'nust' ? profile.net : profile.nu;
    if (needed !== null && typeof current === 'number' && needed > current) improvements.push({ label: `With ${needed}${university.model === 'nust' ? ' / 200 in NET' : '% in the NU test'} (3 points above the reference)`, from: roundChance(estimate.probability), to: roundChance(sigmoid(3 / 2) * 100) });
    return { probability: roundChance(estimate.probability), band, label: BANDS[band].label, tone: BANDS[band].tone, summary: `${BANDS[band].blurb} ${assessment.tone === 'caution' ? assessment.detail : ''}`.trim(), method: estimate.method, factors: estimate.factors, improvements, assessment, signals, meritReference };
  }

  if (university.coverage === 'directory' && !university.facts?.acceptanceRate) {
    signals.push({ title: 'Public admissions data not available', detail: university.country === 'Pakistan' ? 'This institution has no published merit data in Rasta yet. Check its admissions page for the entry test and last year’s merit list.' : 'This institution did not report admissions statistics to IPEDS. Check its admissions page for typical scores.', status: 'review' });
    return empty('Not enough public data', 'Rasta cannot estimate a chance without an admit rate or score range. Use the official admissions page and the requirements below.', 'No estimate: the public datasets Rasta uses have no admissions statistics for this institution.');
  }

  if (!gradeStrength(profile) && !validSat(profile.sat)) {
    signals.push({ title: 'Add your grades', detail: 'An estimate needs at least your school results or an SAT score. Add them in your profile and come back.', status: 'action', page: 'profile' });
    return empty('Add your grades first', 'Rasta needs your results before it can compare you with this university’s admitted students.', 'No estimate yet: the profile has no grades or test score.');
  }
  const estimate = holisticEstimate(university, profile);
  if (!estimate) return empty('Not enough public data', 'No admit rate is available for this institution.', 'No estimate possible.');
  const band = bandFor(estimate.probability);
  const improvements: Improvement[] = [];
  if (university.facts?.testPolicy !== 'blind' && (validSat(profile.sat) ? profile.sat < 1550 : true)) {
    const nextSat = validSat(profile.sat) ? Math.min(1600, Math.ceil((profile.sat + 100) / 10) * 10) : Math.min(1600, Math.max(1200, university.satStats?.low ?? 1300));
    const better = holisticEstimate(university, profile, { sat: nextSat });
    if (better && better.probability > estimate.probability + 0.5) improvements.push({ label: `With an SAT of ${nextSat}`, from: roundChance(estimate.probability), to: roundChance(better.probability) });
  }
  const activities = activityStrength(profile.activityEntries, profile.activities);
  if (activities < 0.75) {
    const better = holisticEstimate(university, profile, { activities: Math.min(1, activities + 0.3) });
    if (better && better.probability > estimate.probability + 0.5) improvements.push({ label: activities === 0 ? 'With three well-described activities' : 'With deeper, sustained activities', from: roundChance(estimate.probability), to: roundChance(better.probability) });
  }
  if (university.facts?.control !== undefined || university.id === 'lums') {
    const needBlind = ['mit', 'amherst'].includes(university.id);
    signals.push({ title: 'Cost and aid', detail: needBlind ? `${university.shortName} is need-blind for international students and meets full demonstrated need. Apply for aid alongside admission.` : university.facts?.tuitionInternational ? `Published tuition and fees are about $${university.facts.tuitionInternational.toLocaleString()} a year${university.facts.roomAndBoard ? ` plus $${university.facts.roomAndBoard.toLocaleString()} room and board` : ''}. Most US universities are need-aware for international students, so check the aid policy before you apply.` : university.aid, status: 'review', page: 'profile' });
  }
  return { probability: roundChance(estimate.probability), band, label: BANDS[band].label, tone: BANDS[band].tone, summary: BANDS[band].blurb, method: estimate.method, factors: estimate.factors, improvements, assessment, signals };
}

export interface TestPlan { universityId: string; name: string; route: 'net' | 'nu' | 'sat' | 'review'; target: number | null; unit: string; reason: string; source?: string }
export function wishlistTestPlan(selected: University[], profile: Profile, aggregateTarget?: number): TestPlan[] {
  return selected.map(university => {
    const base = { universityId: university.id, name: university.shortName };
    if (university.model !== 'holistic') {
      const major = programmeCategory(profile.programme) ?? profile.major;
      const reference = aggregateTarget ?? MERIT_REFERENCES[university.model].byMajor[major];
      const target = requiredTestScore(university.model, profile, reference);
      return { ...base, route: university.model === 'nust' ? 'net' : 'nu', target, unit: university.model === 'nust' ? '/ 200 NET' : '% NU test', reason: target === null ? 'This goal needs valid grades and a reachable aggregate. Review the calculator below.' : aggregateTarget === undefined ? `To reach the reported ${reference}% closing aggregate for ${major}. Reported, not official; replace it with this year’s list.` : `For your chosen ${aggregateTarget}% aggregate. A scenario, not a cutoff.`, source: aggregateTarget === undefined ? MERIT_REFERENCES[university.model].source : university.sources[0]?.url };
    }
    if (university.facts?.testPolicy === 'blind') return { ...base, route: 'review', target: null, unit: '', reason: 'This university does not consider SAT or ACT scores.' };
    const stats = university.satStats;
    const benchmark = stats?.high !== undefined && stats.low !== undefined ? Math.round((stats.low + stats.high) / 2) : stats?.average;
    if (benchmark === undefined) return { ...base, route: 'review', target: null, unit: '', reason: `${university.testLabel}. No SAT range is published for this university.` };
    return { ...base, route: 'sat', target: Math.min(1600, Math.ceil(benchmark / 10) * 10), unit: 'SAT', reason: `${stats?.low !== undefined ? `Middle of the ${stats.low}–${stats.high} range` : 'Class average, rounded up'} for ${stats?.cohort}. A planning target, not a required score.`, source: stats?.source };
  });
}
