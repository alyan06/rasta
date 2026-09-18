import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  buildOutline,
  countWords,
  EMPTY_STORY,
  getWritingChecks,
} from "./essay";

test("word counts handle whitespace, punctuation, contractions, and Urdu text", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("  One\n\ntwo  three. "), 3);
  assert.equal(countWords("I’m a first-generation applicant."), 4);
  assert.equal(countWords("میری کہانی"), 2);
});

test("outlines preserve student details and mark missing details instead of inventing them", () => {
  const outline = buildOutline({
    ...EMPTY_STORY,
    moment: "I repaired our old radio with my grandfather.",
  });
  assert.ok(outline.includes("I repaired our old radio with my grandfather."));
  assert.ok(outline.includes("[Explain your own actions"));
  assert.ok(!outline.includes("award"));
});

test("checks identify actual overage, broad claims, long sentences, and outline notes", () => {
  const content = `I learned a lot ${Array.from({ length: 40 }, () => "today").join(" ")}. [Add reflection]`;
  const checks = getWritingChecks(content, 30);
  assert.equal(
    checks.find((check) => check.id === "length")?.title,
    "16 words over your target",
  );
  assert.ok(checks.some((check) => check.id === "specificity"));
  assert.ok(checks.some((check) => check.id === "sentences"));
  assert.ok(checks.some((check) => check.id === "repetition"));
  assert.ok(checks.some((check) => check.id === "placeholders"));
});

test("empty drafts get a starting cue and no manufactured feedback", () => {
  const checks = getWritingChecks(" \n ", 650);
  assert.equal(checks.length, 1);
  assert.equal(checks[0].id, "start");
});
