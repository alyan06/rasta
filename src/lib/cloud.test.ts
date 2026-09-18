import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initialData, migrateAppData } from "./storage";
import {
  CloudConflictError,
  parseCloudWorkspace,
  readCloudWorkspace,
  sendFeedback,
  validCloudConfig,
  validateFeedback,
  writeCloudWorkspace,
  type FeedbackDraft,
} from "./cloud";

const workspace = {
  payload: initialData,
  revision: 3,
  updated_at: "2026-09-15T10:00:00.000Z",
};
const feedback: FeedbackDraft = {
  category: "idea",
  name: "",
  email: "",
  message: "Please add more universities.",
  consent: true,
};

test("cloud configuration requires both public settings and a secure or local URL", () => {
  assert.equal(validCloudConfig(undefined, undefined), false);
  assert.equal(validCloudConfig("https://project.supabase.co", ""), false);
  assert.equal(
    validCloudConfig("https://project.supabase.co", "your-anon-key"),
    false,
  );
  assert.equal(
    validCloudConfig("http://public.example.com", "sb_publishable_test"),
    false,
  );
  assert.equal(
    validCloudConfig("https://project.supabase.co", "sb_publishable_test"),
    true,
  );
  assert.equal(
    validCloudConfig("http://127.0.0.1:54321", "sb_publishable_test"),
    true,
  );
});

test("cloud rows must pass the app import schema and revision validation", () => {
  assert.equal(parseCloudWorkspace(workspace).revision, 3);
  for (const row of [
    null,
    { ...workspace, revision: 0 },
    { ...workspace, revision: 1.5 },
    { ...workspace, revision: "3" },
    { ...workspace, updated_at: "invalid" },
    { ...workspace, payload: { version: 1 } },
  ]) {
    assert.throws(() => parseCloudWorkspace(row), /could not be read/);
  }
});

test("legacy cloud data has the same normalized baseline as the root workspace", () => {
  const remote = parseCloudWorkspace(workspace);
  assert.deepEqual(remote.payload, migrateAppData(initialData));
  assert.equal(
    JSON.stringify(remote.payload),
    JSON.stringify(migrateAppData(remote.payload)),
    "applying the root migration must not stall sync awaiting different bytes",
  );
});

test("a malformed remote copy is not returned as usable workspace data", async () => {
  const connection = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { ...workspace, payload: {} },
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
  await assert.rejects(
    readCloudWorkspace(connection, "user-a"),
    /could not be read/,
  );
});

test("cloud writes carry account ownership and the expected revision", async () => {
  let outgoing: unknown;
  const connection = {
    rpc: async (_name: string, args: unknown) => {
      outgoing = args;
      return { data: { ...workspace, revision: 4 }, error: null };
    },
  } as unknown as SupabaseClient;
  const result = await writeCloudWorkspace(
    connection,
    "user-a",
    initialData,
    3,
  );
  assert.equal(result.revision, 4);
  assert.deepEqual(outgoing, {
    p_user_id: "user-a",
    p_payload: initialData,
    p_expected_revision: 3,
  });
});

test("stale server revisions raise a conflict instead of reporting saved", async () => {
  const connection = {
    rpc: async () => ({ data: null, error: { code: "40001" } }),
  } as unknown as SupabaseClient;
  await assert.rejects(
    writeCloudWorkspace(connection, "user-a", initialData, 2),
    CloudConflictError,
  );
});

test("feedback accepts optional contact details but requires consent and a useful message", () => {
  assert.equal(validateFeedback(feedback), null);
  assert.match(validateFeedback({ ...feedback, consent: false })!, /agree/);
  assert.match(validateFeedback({ ...feedback, message: " hi " })!, /10/);
  assert.match(
    validateFeedback({ ...feedback, message: "x".repeat(5001) })!,
    /5,000/,
  );
  assert.match(
    validateFeedback({ ...feedback, email: "invalid@" })!,
    /valid reply/,
  );
  assert.equal(
    validateFeedback({ ...feedback, email: " person@example.com " }),
    null,
  );
});

test("signed-out feedback is not submitted", async () => {
  let submissions = 0;
  const connection = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    rpc: async () => {
      submissions += 1;
    },
  } as unknown as SupabaseClient;
  await assert.rejects(sendFeedback(connection, feedback), /Sign in/);
  assert.equal(submissions, 0);
});

test("feedback submission shares just the consented fields and matching account ID", async () => {
  let outgoing: unknown;
  const connection = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "user-a" } } },
        error: null,
      }),
    },
    rpc: async (_name: string, args: unknown) => {
      outgoing = args;
      return { data: "feedback-id", error: null };
    },
  } as unknown as SupabaseClient;
  await sendFeedback(connection, { ...feedback, name: " Ayesha ", email: " " });
  assert.deepEqual(outgoing, {
    p_user_id: "user-a",
    p_category: "idea",
    p_name: "Ayesha",
    p_reply_email: null,
    p_message: feedback.message,
    p_consent: true,
  });
});

test("feedback server rate limits remain errors so the draft can be kept", async () => {
  const connection = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "user-a" } } },
        error: null,
      }),
    },
    rpc: async () => ({ data: null, error: { code: "P0001" } }),
  } as unknown as SupabaseClient;
  await assert.rejects(sendFeedback(connection, feedback), /several messages/);
});
