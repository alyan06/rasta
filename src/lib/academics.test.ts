import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { Profile, SubjectGrade } from '../types';
import { PROGRAMMES, academicSummary, migrateProfile, newActivity, programmeCategory } from './academics';

const base: Profile = { name: 'Student', city: 'Lahore', curriculum: 'fsc', stage: 'completed', major: 'computing', ssc: 90, hssc: 82, net: '', nu: '', sat: '', mathematics: true, budget: 600000, activities: 'Tutored younger pupils.\nOrganized a school exhibition.', isDemo: false };
function subjects(names: string[], grade: SubjectGrade['grade'] = 'A', predicted = false): SubjectGrade[] { return names.map((subject, index) => ({ id: `subject-${index}`, subject, grade, predicted })); }
function british(patch: Partial<Profile> = {}): Profile {
  return { ...base, curriculum: 'alevel', secondary: 'olevel', higherSecondary: 'alevel', programme: 'computer-science', examYear: 2025,
    oLevels: subjects(['English', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Computer Science']),
    aLevels: subjects(['Physics', 'Mathematics', 'Computer Science'], 'B'), ...patch };
}

test('programme catalogue has real distinct choices and does not map unsupported courses to a merit model', () => {
  assert.ok(PROGRAMMES.length >= 20);
  assert.equal(new Set(PROGRAMMES.map(programme => programme.id)).size, PROGRAMMES.length);
  assert.equal(programmeCategory('computer-science'), 'computing');
  assert.equal(programmeCategory('mechanical-engineering'), 'engineering');
  assert.equal(programmeCategory('accounting-finance'), 'business');
  for (const id of ['medicine', 'law', 'psychology', 'architecture', undefined, 'unknown']) assert.equal(programmeCategory(id), null);
});

test('migration preserves original marks, budget and complete notes without inventing household earnings', () => {
  const migrated = migrateProfile(base);
  assert.equal(migrated.secondary, 'matric'); assert.equal(migrated.higherSecondary, 'fsc');
  assert.equal(migrated.ssc, base.ssc); assert.equal(migrated.hssc, base.hssc);
  assert.equal(migrated.budget, base.budget); assert.equal(migrated.familyIncome, undefined);
  assert.equal(migrated.activities, base.activities);
  assert.equal(migrated.activityEntries?.[0].description, base.activities);
  assert.equal(base.activityEntries, undefined);
  assert.deepEqual(migrateProfile(migrated), migrated);
  assert.deepEqual(migrateProfile({ ...base, activityEntries: [] }).activityEntries, []);
});

test('new structured activities have all editable fields and a caller-supplied stable ID', () => {
  const activity = newActivity('my-id');
  assert.equal(activity.id, 'my-id'); assert.equal(activity.ongoing, false);
  assert.equal(activity.hoursPerWeek, ''); assert.equal(activity.weeksPerYear, '');
  assert.equal(activity.description, ''); assert.equal(activity.type, 'Other');
});

test('actual and predicted FSc marks stay distinct and completing the result disables predictions', () => {
  const awaiting = { ...base, stage: 'awaiting' as const, predictedHssc: 95 };
  const projected = academicSummary(awaiting);
  assert.equal(projected.hssc, 95); assert.equal(projected.isEstimate, true);
  assert.equal(awaiting.hssc, 82);
  assert.equal(academicSummary({ ...awaiting, predictedHssc: '' }).hssc, 82);
  assert.equal(academicSummary({ ...awaiting, stage: 'completed' }).hssc, 82);
  assert.equal(academicSummary({ ...awaiting, stage: 'completed' }).isEstimate, false);
  assert.equal(academicSummary({ ...base, ssc: 0 }).ssc, 0);
  assert.equal(academicSummary({ ...base, hssc: NaN }).hssc, null);
});

test('legacy certificate percentages remain valid after migration without being replaced by grade estimates', () => {
  const legacy = migrateProfile({ ...base, curriculum: 'alevel' });
  const result = academicSummary(legacy);
  assert.equal(result.ssc, 90); assert.equal(result.hssc, 82); assert.equal(result.isEstimate, false);
  const modern = academicSummary({ ...legacy, oLevels: [], aLevels: [] });
  assert.equal(modern.ssc, null); assert.equal(modern.hssc, null);
  assert.equal(academicSummary({ ...legacy, stage: 'awaiting' }).hssc, null);
});

test('O Level grade planning requires compulsory subjects and the relevant science electives', () => {
  const value = british();
  assert.equal(academicSummary(value).ssc, 85);
  assert.equal(academicSummary({ ...value, oLevels: value.oLevels!.filter(subject => subject.subject !== 'Urdu') }).ssc, null);
  assert.equal(academicSummary({ ...value, oLevels: value.oLevels!.map(subject => subject.subject === 'Physics' ? { ...subject, grade: 'U' } : subject) }).ssc, null);
  assert.equal(academicSummary({ ...value, oLevels: value.oLevels!.map(subject => subject.subject === 'English' ? { ...subject, predicted: true } : subject) }).ssc, null);
  const duplicate = [...value.oLevels!, { id: 'duplicate', subject: ' Math ', grade: 'A' as const, predicted: false }];
  assert.equal(academicSummary({ ...value, oLevels: duplicate }).ssc, null);
});

test('A* is a disclosed conservative estimate and F/G/U never receive passing marks', () => {
  const starred = british({ oLevels: subjects(['English', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Computer Science'], 'A*') });
  const result = academicSummary(starred);
  assert.equal(result.ssc, 90); assert.equal(result.isEstimate, true);
  assert.ok(result.notes.some(note => note.includes('conservatively') && note.includes('session')));
  for (const grade of ['F', 'G', 'U'] as const) {
    const value = british(); value.oLevels![0].grade = grade;
    assert.equal(academicSummary(value).ssc, null);
  }
});

test('HSSC science cohort rule is selected using O Level completion year, not current or A Level year', () => {
  const old = british();
  old.oLevels = old.oLevels!.map((subject, index) => ({ ...subject, grade: index < 5 ? 'B' : 'A' }));
  const before = academicSummary(old);
  const after = academicSummary({ ...old, examYear: 2026 });
  assert.equal(before.hssc, (5 * 75 + 3 * 85 + 3 * 75) / 11);
  assert.equal(after.hssc, 75);
  assert.ok(after.notes.some(note => note.includes('five compulsory')));
  assert.equal(academicSummary({ ...old, examYear: undefined }).hssc, null);
});

test('computing accepts Chemistry or Computer Science as the third A Level science route', () => {
  for (const third of ['Chemistry', 'Computer Science']) {
    const result = academicSummary(british({ aLevels: subjects(['Physics', 'Mathematics', third], 'B') }));
    assert.equal(result.hssc, (8 * 85 + 3 * 75) / 11, third);
    assert.equal(result.math, true);
  }
  const incomplete = academicSummary(british({ aLevels: subjects(['Mathematics', 'Economics', 'Business'], 'A') }));
  assert.equal(incomplete.hssc, null);
  assert.ok(incomplete.notes.some(note => note.includes('may be eligible')));
});

test('A Level predictions are included only while awaiting results and remain labelled', () => {
  const predicted = british({ stage: 'awaiting', aLevels: subjects(['Physics', 'Mathematics', 'Chemistry'], 'A', true) });
  const result = academicSummary(predicted);
  assert.equal(result.hssc, 85); assert.equal(result.isEstimate, true);
  assert.ok(result.notes.some(note => note.includes('Predicted A Level')));
  assert.equal(academicSummary({ ...predicted, stage: 'completed' }).hssc, null);
  assert.equal(academicSummary({ ...predicted, stage: 'completed' }).math, false);
});

test('mixed Matric and A Level records do not invent a combined equivalence', () => {
  const result = academicSummary(british({ secondary: 'matric', oLevels: [] }));
  assert.equal(result.ssc, 90); assert.equal(result.hssc, null);
  assert.ok(result.notes.some(note => note.includes('Mixed Matric')));
});

test('medicine requires Biology and does not turn a computing subject group into pre-medical equivalence', () => {
  const missingBiology = academicSummary(british({ programme: 'medicine', aLevels: subjects(['Physics', 'Chemistry', 'Biology']) }));
  assert.equal(missingBiology.hssc, null);
  const medical = british({ programme: 'medicine', aLevels: subjects(['Physics', 'Chemistry', 'Biology']) });
  medical.oLevels = medical.oLevels!.map(subject => subject.subject === 'Computer Science' ? { ...subject, subject: 'Biology' } : subject);
  assert.equal(academicSummary(medical).hssc, 85);
});
