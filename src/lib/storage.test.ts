import { strict as assert } from "node:assert";
import { test, type TestContext } from "node:test";
import type { AppData } from "../types";
import { universities } from "./admissions";
import { newActivity } from './academics';
import {
  demoProfile,
  initialData,
  isAppData,
  loadData,
  migrateAppData,
  STORAGE_KEY,
} from "./storage";

function backup(): AppData {
  return {
    ...structuredClone(initialData),
    applications: [
      {
        universityId: "nust",
        status: "Preparing",
        deadline: "2028-02-29",
        completedSteps: [
          universities.find((university) => university.id === "nust")!
            .applicationSteps[0],
        ],
        notes: "Confirm the portal deadline and fee-waiver options.",
      },
    ],
    essays: [
      {
        id: "draft-one",
        title: "The old radio",
        prompt: "Describe a moment of discovery.",
        content: "I repaired a radio with my grandfather.",
        updatedAt: "2026-09-15T14:30:00.000Z",
        wordLimit: 650,
        story: {
          moment: "An old radio",
          action: "Repaired its circuit",
          learning: "Ask better questions",
          future: "Study engineering",
        },
      },
    ],
  };
}

test("complete exports and legacy drafts without optional planning fields are accepted", () => {
  const value = backup();
  assert.equal(isAppData(JSON.parse(JSON.stringify(value))), true);
  delete value.essays[0].wordLimit;
  delete value.essays[0].story;
  assert.equal(isAppData(value), true);
  assert.equal(isAppData(initialData), true);
});

test("missing sections, arrays in place of objects, and partial nested records are rejected safely", () => {
  const badValues: unknown[] = [
    null,
    [],
    "",
    1,
    {},
    { version: 1 },
    { ...backup(), profile: null },
    { ...backup(), profile: [] },
    { ...backup(), saved: null },
    { ...backup(), applications: [{}] },
    { ...backup(), essays: [{ id: "draft" }] },
    {
      ...backup(),
      essays: [{ ...backup().essays[0], story: { moment: "Only one field" } }],
    },
    { ...backup(), essays: [{ ...backup().essays[0], story: [] }] },
    { ...backup(), essays: [{ ...backup().essays[0], story: null }] },
    { ...backup(), essays: [null] },
    { ...backup(), saved: new Array(1) },
  ];
  for (const value of badValues)
    assert.equal(isAppData(value), false, JSON.stringify(value));
  const missingScore = backup();
  Reflect.deleteProperty(missingScore.profile, "ssc");
  assert.equal(isAppData(missingScore), false);
});

test("enum values and flags are checked by type without coercing imported objects", () => {
  let coerced = false;
  const curriculum = {
    toString() {
      coerced = true;
      return "fsc";
    },
  };
  assert.equal(
    isAppData({ ...backup(), profile: { ...demoProfile, curriculum } }),
    false,
  );
  assert.equal(coerced, false);
  for (const patch of [
    { curriculum: "gpa" },
    { stage: "predicted" },
    { major: "medicine" },
    { mathematics: "true" },
    { isDemo: 0 },
  ]) {
    assert.equal(
      isAppData({ ...backup(), profile: { ...demoProfile, ...patch } }),
      false,
    );
  }
});

test("profile text and application notes match the actual form limits", () => {
  const boundaries = {
    name: "n".repeat(60),
    city: "c".repeat(80),
    activities: "a".repeat(5000),
  };
  assert.equal(
    isAppData({ ...backup(), profile: { ...demoProfile, ...boundaries } }),
    true,
  );
  for (const key of ["name", "city", "activities"] as const) {
    assert.equal(
      isAppData({
        ...backup(),
        profile: {
          ...demoProfile,
          ...boundaries,
          [key]: `${boundaries[key]}x`,
        },
      }),
      false,
      key,
    );
  }
  const value = backup();
  value.applications[0].notes = "n".repeat(3000);
  assert.equal(isAppData(value), true);
  value.applications[0].notes += "x";
  assert.equal(isAppData(value), false);
});

test("nonfinite, out-of-range, fractional NET, and invalid SAT score steps are rejected", () => {
  for (const key of ["ssc", "hssc", "net", "nu", "sat", "budget"]) {
    for (const invalid of [NaN, Infinity, -Infinity, null, "90", -1]) {
      assert.equal(
        isAppData({ ...backup(), profile: { ...demoProfile, [key]: invalid } }),
        false,
        `${key}: ${invalid}`,
      );
    }
  }
  for (const patch of [
    { ssc: 100.01 },
    { hssc: 101 },
    { net: 201 },
    { net: 150.5 },
    { nu: 101 },
    { sat: 390 },
    { sat: 1601 },
    { sat: 1355 },
    { budget: 100_000_001 },
  ]) {
    assert.equal(
      isAppData({ ...backup(), profile: { ...demoProfile, ...patch } }),
      false,
      JSON.stringify(patch),
    );
  }
  assert.equal(
    isAppData({
      ...backup(),
      profile: {
        ...demoProfile,
        ssc: "",
        hssc: "",
        net: "",
        nu: "",
        sat: "",
        budget: "",
      },
    }),
    true,
  );
  assert.equal(
    isAppData({
      ...backup(),
      profile: {
        ...demoProfile,
        ssc: 0,
        hssc: 100,
        net: 200,
        nu: 87.5,
        sat: 400,
        budget: 0,
      },
    }),
    true,
  );
});

test("deadline validation catches impossible dates and honors the date input range", () => {
  for (const deadline of [
    "2026-02-31",
    "2026-02-29",
    "2100-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-01-00",
    "2026-01-32",
    "2026-2-03",
    "2026-01-01T00:00:00Z",
    "1999-12-31",
    "2101-01-01",
  ]) {
    const value = backup();
    value.applications[0].deadline = deadline;
    assert.equal(isAppData(value), false, deadline);
  }
  for (const deadline of [
    "",
    "2000-02-29",
    "2028-02-29",
    "2026-04-30",
    "2100-12-31",
  ]) {
    const value = backup();
    value.applications[0].deadline = deadline;
    assert.equal(isAppData(value), true, deadline);
  }
});

test("saved colleges and tracked applications must use unique known university IDs", () => {
  for (const saved of [["nust", "nust"], ["not-a-real-college"], [""], [42]]) {
    assert.equal(isAppData({ ...backup(), saved }), false);
  }
  const duplicate = backup();
  duplicate.applications.push({ ...duplicate.applications[0] });
  assert.equal(isAppData(duplicate), false);
  const unknown = backup();
  unknown.applications[0].universityId = "unlisted";
  assert.equal(isAppData(unknown), false);
  assert.equal(
    isAppData({
      ...backup(),
      saved: universities.map((university) => university.id),
    }),
    true,
  );
});

test("application statuses and checklist keys must match their own university", () => {
  const application = backup().applications[0];
  for (const patch of [
    { status: "Accepted" },
    {
      completedSteps: [
        application.completedSteps[0],
        application.completedSteps[0],
      ],
    },
    { completedSteps: ["invented task"] },
    { completedSteps: [5] },
    { completedSteps: {} },
  ]) {
    assert.equal(
      isAppData({ ...backup(), applications: [{ ...application, ...patch }] }),
      false,
    );
  }
});

test("essay IDs are nonblank and unique and titles respect the editor limit", () => {
  const duplicate = backup();
  duplicate.essays.push({ ...duplicate.essays[0] });
  assert.equal(isAppData(duplicate), false);
  for (const id of ["", "   ", "x".repeat(101)]) {
    assert.equal(
      isAppData({ ...backup(), essays: [{ ...backup().essays[0], id }] }),
      false,
    );
  }
  const value = backup();
  value.essays[0].title = "t".repeat(120);
  assert.equal(isAppData(value), true);
  value.essays[0].title += "x";
  assert.equal(isAppData(value), false);
});

test("essay word targets match the select options, and malformed timestamps are rejected", () => {
  for (const wordLimit of [250, 500, 650]) {
    assert.equal(
      isAppData({
        ...backup(),
        essays: [{ ...backup().essays[0], wordLimit }],
      }),
      true,
    );
  }
  for (const wordLimit of [0, 300, 649.5, NaN, Infinity, "650", null]) {
    assert.equal(
      isAppData({
        ...backup(),
        essays: [{ ...backup().essays[0], wordLimit }],
      }),
      false,
    );
  }
  for (const updatedAt of ["", "not a date", "2026-02-31T00:00:00.000Z"]) {
    assert.equal(
      isAppData({
        ...backup(),
        essays: [{ ...backup().essays[0], updatedAt }],
      }),
      false,
    );
  }
});

test("long drafts, prompts, and story notes can be backed up without dropping typed work", () => {
  const value = backup();
  value.essays[0].prompt = "p".repeat(5000);
  value.essays[0].content = "c".repeat(150_000);
  value.essays[0].story!.moment = "m".repeat(20_000);
  assert.equal(isAppData(value), true);
  // The UI does not limit how many drafts a student can create.
  value.essays = Array.from({ length: 101 }, (_, index) => ({
    ...backup().essays[0],
    id: `draft-${index}`,
  }));
  assert.equal(isAppData(value), true);
  for (const patch of [
    { prompt: null },
    { content: 4 },
    { story: { ...backup().essays[0].story, learning: false } },
  ]) {
    assert.equal(
      isAppData({ ...backup(), essays: [{ ...backup().essays[0], ...patch }] }),
      false,
    );
  }
});

function mockStorage(context: TestContext, raw: string | null, throws = false, expectedKey = STORAGE_KEY) {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  let writes = 0;
  const storage = {
    getItem(key: string) {
      assert.equal(key, expectedKey);
      if (throws) throw new Error("Access denied");
      return raw;
    },
    setItem() {
      writes++;
    },
    removeItem() {
      writes++;
    },
    clear() {
      writes++;
    },
    key() {
      return null;
    },
    length: raw === null ? 0 : 1,
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  context.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return { stored: () => storage.getItem(expectedKey), writes: () => writes };
}

test("valid stored work is restored without rewriting it", (context) => {
  const value = backup();
  const raw = JSON.stringify(value);
  const storage = mockStorage(context, raw);
  const loaded = loadData();
  assert.deepEqual(loaded.data, migrateAppData(value));
  assert.equal(loaded.error, "");
  assert.equal(loaded.recoveryRaw, null);
  assert.equal(storage.stored(), raw);
  assert.equal(storage.writes(), 0);
});

test("malformed JSON remains intact and is exposed for a recovery export", (context) => {
  const raw = '{"version":1,"profile":';
  const storage = mockStorage(context, raw);
  const loaded = loadData();
  assert.match(loaded.error, /could not be read/);
  assert.equal(loaded.recoveryRaw, raw);
  assert.equal(storage.stored(), raw);
  assert.equal(storage.writes(), 0);
});

test("well-formed JSON with an unsafe partial shape is preserved instead of replaced", (context) => {
  const raw = JSON.stringify({
    version: 1,
    profile: { name: "My only copy" },
    essays: [],
  });
  const storage = mockStorage(context, raw);
  const loaded = loadData();
  assert.notEqual(loaded.error, "");
  assert.equal(loaded.recoveryRaw, raw);
  assert.equal(storage.stored(), raw);
  assert.equal(storage.writes(), 0);
});

test("an empty stored value is corruption, while missing storage is a new workspace", (context) => {
  const storage = mockStorage(context, "");
  const loaded = loadData();
  assert.notEqual(loaded.error, "");
  assert.equal(loaded.recoveryRaw, "");
  assert.equal(storage.stored(), "");
  assert.equal(storage.writes(), 0);
});

test("new workspaces receive independent demo values without any storage writes", (context) => {
  const storage = mockStorage(context, null);
  const loaded = loadData();
  assert.equal(loaded.error, "");
  assert.equal(loaded.recoveryRaw, null);
  loaded.data.profile.name = "Changed only in memory";
  loaded.data.saved.pop();
  assert.equal(initialData.profile.name, "Ayesha");
  assert.equal(initialData.saved.length, 3);
  assert.equal(storage.writes(), 0);
});

test("unavailable browser storage produces a clear error and does not attempt a write", (context) => {
  const storage = mockStorage(context, null, true);
  const loaded = loadData();
  assert.match(loaded.error, /storage is unavailable/);
  assert.equal(loaded.recoveryRaw, null);
  assert.equal(storage.writes(), 0);
});

test('account storage loads only the requested key and applies the same lossless migration', context => {
  const key = `${STORAGE_KEY}.account.student-123`;
  const raw = JSON.stringify(backup());
  const storage = mockStorage(context, raw, false, key);
  const loaded = loadData(key);
  assert.equal(loaded.error, '');
  assert.deepEqual(loaded.data, migrateAppData(backup()));
  assert.equal(storage.stored(), raw); assert.equal(storage.writes(), 0);
});

test('new education fields are optional for legacy exports but strictly validated when present', () => {
  const complete = { ...backup(), onboardingCompleted: true, profile: { ...demoProfile, secondary: 'olevel', higherSecondary: 'fsc', programme: 'medicine', familyIncome: 50000, predictedHssc: 92, examYear: 2026, onboardingCompleted: true, oLevels: [], aLevels: [], activityEntries: [] } };
  assert.equal(isAppData(complete), true);
  assert.equal(isAppData(backup()), true);
  for (const patch of [{ secondary: 'gpa' }, { higherSecondary: 'ib' }, { familyIncome: -1 }, { familyIncome: Infinity }, { familyIncome: '50000' }, { predictedHssc: 101 }, { predictedHssc: NaN }, { examYear: 2026.5 }, { examYear: 1999 }, { examYear: 2101 }, { programme: 'unlisted-degree' }, { onboardingCompleted: 1 }]) {
    assert.equal(isAppData({ ...complete, profile: { ...complete.profile, ...patch } }), false, JSON.stringify(patch));
  }
  assert.equal(isAppData({ ...complete, onboardingCompleted: 'true' }), false);
  assert.equal(isAppData({ ...complete, profile: { ...complete.profile, familyIncome: '', predictedHssc: '' } }), true);
});

test('subject records support incomplete work while rejecting duplicate names, IDs and malformed grades', () => {
  const subject = { id: 's1', subject: 'Mathematics', grade: 'A', predicted: false };
  const profile = { ...demoProfile, oLevels: [subject], aLevels: [{ ...subject, predicted: true }] };
  assert.equal(isAppData({ ...backup(), profile }), true);
  assert.equal(isAppData({ ...backup(), profile: { ...profile, oLevels: [{ ...subject, subject: '', grade: '' }] } }), true);
  for (const oLevels of [[null], [{ id: 'partial' }], [{ ...subject, grade: 'A+' }], [{ ...subject, predicted: 'false' }], [subject, subject], [subject, { ...subject, id: 's2', subject: ' maths ' }], Array.from({ length: 13 }, (_, index) => ({ ...subject, id: `s${index}`, subject: `Subject ${index}` }))]) {
    assert.equal(isAppData({ ...backup(), profile: { ...profile, oLevels } }), false);
  }
  const twelve = Array.from({ length: 12 }, (_, index) => ({ ...subject, id: `s${index}`, subject: `Subject ${index}` }));
  assert.equal(isAppData({ ...backup(), profile: { ...profile, oLevels: twelve } }), true);
});

test('structured activities enforce ten-entry limit, dates, hours and complete safe fields', () => {
  const activity = { ...newActivity('activity-one'), title: 'Tutoring', type: 'Community service', startDate: '2025-01-01', endDate: '2026-01-01', hoursPerWeek: 2.5, weeksPerYear: 30 };
  assert.equal(isAppData({ ...backup(), profile: { ...demoProfile, activityEntries: [activity] } }), true);
  for (const patch of [{ title: 'x'.repeat(121) }, { role: 'x'.repeat(101) }, { organization: 'x'.repeat(141) }, { description: 'x'.repeat(5001) }, { type: 'Unlisted' }, { startDate: '2025-02-31' }, { endDate: '2024-01-01' }, { hoursPerWeek: 169 }, { hoursPerWeek: Infinity }, { weeksPerYear: 53 }, { weeksPerYear: 1.5 }, { ongoing: 'yes' }]) {
    assert.equal(isAppData({ ...backup(), profile: { ...demoProfile, activityEntries: [{ ...activity, ...patch }] } }), false, JSON.stringify(patch));
  }
  assert.equal(isAppData({ ...backup(), profile: { ...demoProfile, activityEntries: [activity, activity] } }), false);
  assert.equal(isAppData({ ...backup(), profile: { ...demoProfile, activityEntries: [{ id: 'partial' }] } }), false);
  for (const [count, expected] of [[10, true], [11, false]] as const) {
    const activityEntries = Array.from({ length: count }, (_, index) => ({ ...activity, id: `activity-${index}` }));
    assert.equal(isAppData({ ...backup(), profile: { ...demoProfile, activityEntries } }), expected);
  }
});

test('migration preserves all previous data and does not merge annual budget into monthly income', () => {
  const original = backup();
  original.profile.activities = 'x'.repeat(5000);
  const migrated = migrateAppData(original);
  assert.equal(migrated.version, 1);
  assert.equal(migrated.profile.activities, original.profile.activities);
  assert.equal(migrated.profile.activityEntries?.[0].description, original.profile.activities);
  assert.equal(migrated.profile.budget, original.profile.budget);
  assert.equal(migrated.profile.familyIncome, undefined);
  assert.deepEqual(migrated.applications, original.applications);
  assert.deepEqual(migrated.essays, original.essays);
  assert.deepEqual(migrateAppData(migrated), migrated);
  assert.equal(isAppData(migrated), true);
  assert.equal(original.profile.activityEntries, undefined);
});
