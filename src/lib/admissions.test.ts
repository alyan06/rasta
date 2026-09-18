import assert from "node:assert/strict";
import test from "node:test";
import type { Profile } from "../types";
import {
  assessUniversity,
  calculateAggregate,
  requiredTestScore,
  universities,
} from "./admissions";

const profile: Profile = {
  name: "Test",
  city: "Lahore",
  curriculum: "fsc",
  stage: "completed",
  major: "computing",
  ssc: 90,
  hssc: 80,
  net: 150,
  nu: 70,
  sat: 1400,
  mathematics: true,
  budget: "",
  activities: "",
  isDemo: false,
};
const at = (id: string) =>
  universities.find((university) => university.id === id)!;
const near = (actual: number | null, expected: number) =>
  assert.ok(
    actual !== null && Math.abs(actual - expected) < 1e-8,
    `${actual} differs from ${expected}`,
  );

test("NUST uses official academic weights and NET marks out of 200", () => {
  near(calculateAggregate("nust", profile, 150), 77.25);
  near(calculateAggregate("nust", profile, 160), 81);
});

test("FAST distinguishes engineering from computing and business", () => {
  near(calculateAggregate("fast", profile, 70), 76);
  near(calculateAggregate("fast", { ...profile, major: "business" }, 70), 76);
  near(
    calculateAggregate("fast", { ...profile, major: "engineering" }, 70),
    78.4,
  );
});

test("A Level result-awaiting applicants use O Level equivalence only", () => {
  const awaiting: Profile = {
    ...profile,
    curriculum: "alevel",
    stage: "awaiting",
    hssc: "",
  };
  near(calculateAggregate("nust", awaiting, 150), 78.75);
  near(calculateAggregate("fast", awaiting, 70), 80);
  near(
    calculateAggregate("fast", { ...awaiting, major: "engineering" }, 70),
    83.4,
  );
  near(calculateAggregate("nust", { ...awaiting, hssc: 10 }, 150), 78.75);
  assert.equal(
    calculateAggregate("nust", { ...awaiting, stage: "completed" }, 150),
    null,
  );
});

test("FSc result-awaiting still requires Part-I grades", () => {
  assert.equal(
    calculateAggregate(
      "nust",
      { ...profile, stage: "awaiting", hssc: "" },
      150,
    ),
    null,
  );
  near(
    calculateAggregate("nust", { ...profile, stage: "awaiting" }, 150),
    77.25,
  );
});

test("empty, non-finite and out-of-range inputs never turn into zero grades", () => {
  for (const bad of [
    "",
    -1,
    101,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ] as const) {
    assert.equal(
      calculateAggregate("nust", { ...profile, ssc: bad }, 150),
      null,
    );
    assert.equal(
      calculateAggregate("fast", { ...profile, hssc: bad }, 70),
      null,
    );
  }
  for (const bad of [-1, 201, Number.NaN, Number.POSITIVE_INFINITY])
    assert.equal(calculateAggregate("nust", profile, bad), null);
  for (const bad of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY])
    assert.equal(calculateAggregate("fast", profile, bad), null);
  assert.equal(
    calculateAggregate("nust", profile, "" as unknown as number),
    null,
  );
  near(calculateAggregate("nust", { ...profile, ssc: 0, hssc: 0 }, 0), 0);
  near(
    calculateAggregate("fast", { ...profile, ssc: 100, hssc: 100 }, 100),
    100,
  );
});

test("target solver rounds upward and the resulting score actually reaches the target", () => {
  assert.equal(requiredTestScore("nust", profile, 80), 158);
  assert.equal(requiredTestScore("fast", profile, 80), 78);
  assert.equal(
    requiredTestScore("fast", { ...profile, major: "engineering" }, 80),
    74.85,
  );
  for (const model of ["nust", "fast"] as const) {
    for (const major of ["computing", "engineering", "business"] as const) {
      for (const target of [10, 60, 70, 75.125, 80, 85, 90]) {
        const candidate = { ...profile, major };
        const required = requiredTestScore(model, candidate, target);
        if (required !== null)
          assert.ok(
            calculateAggregate(model, candidate, required)! >= target - 1e-9,
          );
      }
    }
  }
});

test("target solver distinguishes impossible targets from an already reached target", () => {
  assert.equal(requiredTestScore("nust", profile, 100), null);
  assert.equal(requiredTestScore("fast", profile, 100), null);
  assert.equal(requiredTestScore("nust", profile, 20), 0);
  assert.equal(requiredTestScore("nust", { ...profile, ssc: "" }, 80), null);
  for (const invalid of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY])
    assert.equal(requiredTestScore("fast", profile, invalid), null);
  assert.equal(
    requiredTestScore("nust", { ...profile, ssc: 100, hssc: 100 }, 100),
    200,
  );
  assert.equal(
    requiredTestScore("fast", { ...profile, ssc: 100, hssc: 100 }, 100),
    100,
  );
});

test("grade minimums, missing marks and subject routes are separate from aggregate", () => {
  assert.equal(
    assessUniversity(at("nust"), profile).label,
    "Meets grade minimums",
  );
  assert.equal(
    assessUniversity(at("nust"), { ...profile, hssc: 59 }).label,
    "Check eligibility",
  );
  assert.equal(
    assessUniversity(at("fast"), { ...profile, hssc: 50 }).label,
    "Meets grade minimums",
  );
  assert.equal(
    assessUniversity(at("fast"), { ...profile, hssc: 50, major: "engineering" })
      .label,
    "Check eligibility",
  );
  assert.equal(
    assessUniversity(at("nust"), { ...profile, net: "" }).aggregate,
    undefined,
  );
  assert.equal(
    assessUniversity(at("nust"), { ...profile, ssc: "" }).label,
    "Needs grades",
  );
  assert.equal(
    assessUniversity(at("fast"), { ...profile, mathematics: false }).label,
    "Check eligibility",
  );
  assert.match(
    assessUniversity(at("nust"), {
      ...profile,
      curriculum: "alevel",
    }).missing.join(" "),
    /IBCC/,
  );
});

test("holistic reviews never produce an aggregate or an acceptance probability", () => {
  for (const id of ["lums", "mit", "amherst", "asu"]) {
    const assessment = assessUniversity(at(id), profile);
    assert.equal(assessment.aggregate, undefined);
    assert.ok(!Object.hasOwn(assessment, "probability"));
  }
  assert.equal(
    assessUniversity(at("lums"), { ...profile, hssc: 69 }).label,
    "Check eligibility",
  );
  assert.equal(
    assessUniversity(at("lums"), { ...profile, hssc: "" }).label,
    "Needs grades",
  );
  assert.match(
    assessUniversity(at("lums"), {
      ...profile,
      curriculum: "alevel",
    }).missing.join(" "),
    /equivalence percentages cannot confirm/,
  );
  assert.match(
    assessUniversity(at("mit"), { ...profile, sat: "" }).missing.join(" "),
    /ACT/,
  );
  assert.equal(
    assessUniversity(at("amherst"), { ...profile, major: "engineering" }).label,
    "Check eligibility",
  );
});

test('new programme selection chooses FAST engineering weights without stale legacy major', () => {
  near(calculateAggregate('fast', { ...profile, programme: 'electrical-engineering', major: 'computing' }, 70), 78.4);
  assert.equal(calculateAggregate('fast', { ...profile, programme: 'medicine' }, 70), null);
  assert.equal(assessUniversity(at('nust'), { ...profile, programme: 'medicine' }).label, 'Programme review needed');
  assert.equal(assessUniversity(at('mit'), { ...profile, programme: 'economics' }).label, 'Holistic review');
});

test('predicted FSc forecasts use predictions and explicitly keep eligibility provisional', () => {
  const predicted: Profile = { ...profile, stage: 'awaiting', higherSecondary: 'fsc', predictedHssc: 90 };
  near(calculateAggregate('nust', predicted, 150), 78.75);
  assert.equal(predicted.hssc, 80);
  const result = assessUniversity(at('nust'), predicted);
  assert.equal(result.label, 'Estimated grade screen');
  assert.match(result.detail, /provisional or unofficial/);
});

test('mixed curricula retain separate LUMS grade conditions', () => {
  const oToFsc: Profile = { ...profile, secondary: 'olevel', higherSecondary: 'fsc', ssc: 65 };
  assert.equal(assessUniversity(at('lums'), oToFsc).label, 'Holistic review');
  assert.match(assessUniversity(at('lums'), oToFsc).missing.join(' '), /original O Level average B/);
  assert.equal(assessUniversity(at('lums'), { ...oToFsc, hssc: 69 }).label, 'Check eligibility');
  const matricToA: Profile = { ...profile, secondary: 'matric', higherSecondary: 'alevel', ssc: 65 };
  assert.equal(assessUniversity(at('lums'), matricToA).label, 'Check eligibility');
});

test('catalogue records keep stable unique IDs, bounded coverage and parseable source URLs', () => {
  assert.equal(universities.length, 2841);
  assert.equal(new Set(universities.map(item => item.id)).size, universities.length);
  assert.equal(universities.filter(item => item.country === 'Pakistan').length, 284);
  assert.equal(universities.filter(item => item.country === 'USA').length, 2557);
  for (const university of universities) {
    assert.ok(university.id && university.name && university.city && university.country);
    if (university.website) assert.ok(['https:', 'http:'].includes(new URL(university.website).protocol));
    assert.ok(university.sources.length > 0);
    if (university.coverage === 'directory') {
      assert.equal(university.satStats, undefined);
      assert.equal(assessUniversity(university, profile).aggregate, undefined);
      assert.equal(university.programmes, undefined);
    }
  }
});
