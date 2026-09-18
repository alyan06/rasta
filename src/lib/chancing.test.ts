import assert from 'node:assert/strict';
import test from 'node:test';
import type { Profile } from '../types';
import { universities } from './admissions';
import { BANDS, activityStrength, bandFor, checkChances, wishlistTestPlan } from './chancing';

const profile: Profile = { name: 'Student', city: 'Lahore', curriculum: 'fsc', stage: 'completed', major: 'computing', ssc: 90, hssc: 80, net: 150, nu: 70, sat: 1400, mathematics: true, budget: '', activities: '', isDemo: false, secondary: 'matric', higherSecondary: 'fsc', activityEntries: [] };
const at = (id: string) => universities.find(item => item.id === id)!;
const activity = (title: string, hours = 6, weeks = 40, description = 'Built and maintained the club website used by two hundred students, and trained the next committee.') => ({ id: title, title, type: 'Technology', role: 'Lead developer', organization: 'School', description, startDate: '2024-01-01', endDate: '', ongoing: true, hoursPerWeek: hours, weeksPerYear: weeks });

test('chances are bounded percentages that move with the evidence', () => {
  const mit = at('mit');
  const low = checkChances(mit, { ...profile, sat: 1200 });
  const mid = checkChances(mit, { ...profile, sat: 1550 });
  const high = checkChances(mit, { ...profile, sat: 1580, hssc: 95, activityEntries: [activity('Robotics'), activity('Olympiad'), activity('Tutoring')] });
  for (const review of [low, mid, high]) {
    assert.ok(review.probability !== null && review.probability >= 0.5 && review.probability <= 99);
    assert.equal(review.band, bandFor(review.probability!));
    assert.equal(review.label, BANDS[review.band!].label);
  }
  assert.ok(low.probability! < mid.probability!);
  assert.ok(mid.probability! < high.probability!);
  assert.ok(low.probability! < 10, `MIT with a 1200 SAT should be a far reach, got ${low.probability}`);
  assert.ok(high.probability! < 40, `even a strong international profile should not look likely at MIT, got ${high.probability}`);
  assert.ok(mid.factors.some(factor => factor.label.startsWith('Overall admit rate')));
  assert.ok(mid.factors.some(factor => factor.label.includes('SAT 1550') && factor.effect !== 'down'));
  assert.ok(low.factors.some(factor => factor.label.includes('SAT 1200') && factor.effect === 'down'));
  assert.ok(mid.improvements.some(item => item.to > item.from));
});

test('a required test that is missing costs more than a missing optional test', () => {
  const required = checkChances(at('mit'), { ...profile, sat: '' });
  const optional = checkChances(at('amherst'), { ...profile, sat: '' });
  assert.ok(required.factors.find(factor => factor.label.startsWith('SAT or ACT required'))!.weight < optional.factors.find(factor => factor.label === 'No SAT recorded')!.weight);
  const blind = universities.find(item => item.facts?.testPolicy === 'blind' && item.facts.acceptanceRate)!;
  const review = checkChances(blind, { ...profile, sat: 1600 });
  assert.ok(review.factors.some(factor => factor.label === 'Test scores not considered'));
  assert.equal(review.probability, checkChances(blind, { ...profile, sat: 800 }).probability);
});

test('data-only US entries get an estimate from IPEDS; identity-only entries do not', () => {
  const data = universities.find(item => item.coverage === 'data' && item.facts?.sat25)!;
  const review = checkChances(data, profile);
  assert.ok(review.probability !== null);
  assert.match(review.method, /admit rate/);
  const directory = universities.find(item => item.coverage === 'directory' && item.country === 'USA')!;
  const none = checkChances(directory, profile);
  assert.equal(none.probability, null);
  assert.equal(none.label, 'Not enough public data');
  const pakistan = universities.find(item => item.coverage === 'directory' && item.country === 'Pakistan')!;
  assert.equal(checkChances(pakistan, profile).probability, null);
});

test('merit-route chances compare the calculated aggregate with an editable reported reference', () => {
  const nust = at('nust');
  const review = checkChances(nust, profile);
  assert.equal(review.meritReference?.value, 73);
  assert.ok(review.probability !== null);
  assert.ok(review.factors.some(factor => factor.label.startsWith('Your aggregate')));
  const stronger = checkChances(nust, { ...profile, net: 170 });
  assert.ok(stronger.probability! > review.probability!);
  const custom = checkChances(nust, profile, { meritReference: 60 });
  assert.ok(custom.probability! > review.probability!);
  assert.equal(custom.meritReference?.value, 60);
  assert.equal(checkChances(nust, { ...profile, net: '' }).probability, null);
  assert.equal(checkChances(nust, { ...profile, net: '' }).label, 'Add a test score');
  assert.equal(checkChances(at('fast'), { ...profile, programme: 'medicine' }).label, 'Programme not covered');
});

test('eligibility problems still surface beside the estimate', () => {
  assert.equal(checkChances(at('lums'), { ...profile, hssc: 60, sat: 1600 }).assessment.label, 'Check eligibility');
  assert.equal(checkChances(at('lums'), { ...profile, hssc: '', sat: 1600 }).assessment.label, 'Needs grades');
  const lums = checkChances(at('lums'), { ...profile, hssc: 92, sat: 1450 });
  assert.ok(lums.probability !== null);
  assert.match(lums.method, /assumed 20%/);
});

test('activity strength rewards depth and description rather than count alone', () => {
  assert.equal(activityStrength([], ''), 0);
  assert.equal(activityStrength(undefined, 'Tutored my sibling.'), 0.25);
  const shallow = activityStrength([activity('Club', 1, 10, 'Member.')], '');
  const deep = activityStrength([activity('Club'), activity('Research'), activity('Work')], '');
  assert.ok(shallow < deep && deep <= 1);
  // Recognition words add a little; a 150-character Common App description counts as fully described.
  const plain = activityStrength([activity('Debate', 4, 30, 'Prepared cases and spoke at weekly inter-school debates for two years.')], '');
  const recognised = activityStrength([activity('Debate', 4, 30, 'Prepared cases and spoke at weekly inter-school debates; won the national final.')], '');
  assert.ok(recognised > plain);
});

test('wishlist plans use reported merit references by default and SAT midpoints for US entries', () => {
  assert.equal(wishlistTestPlan([at('nust')], profile)[0].target, 139);
  assert.equal(wishlistTestPlan([at('nust')], profile, 80)[0].target, 158);
  assert.equal(wishlistTestPlan([at('fast')], profile, 80)[0].target, 78);
  assert.equal(wishlistTestPlan([at('fast')], profile, 100)[0].target, null);
  const plans = wishlistTestPlan([at('mit'), at('lums'), at('amherst'), at('asu')], profile);
  assert.deepEqual(plans.map(plan => plan.target), [1550, 1380, 1510, null]);
  assert.ok(plans.slice(0, 3).every(plan => plan.target! % 10 === 0));
  const directory = universities.find(item => item.coverage === 'directory' && item.country === 'USA')!;
  assert.equal(wishlistTestPlan([directory], profile)[0].route, 'review');
});
