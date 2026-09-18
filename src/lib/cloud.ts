import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "../types";
import { isAppData, migrateAppData } from "./storage";

export interface CloudWorkspace {
  payload: AppData;
  revision: number;
  updatedAt: string;
}

export class CloudConflictError extends Error {
  constructor() {
    super(
      "Your account has newer changes. Choose which version to keep before saving.",
    );
    this.name = "CloudConflictError";
  }
}

export function validCloudConfig(url?: string, key?: string): boolean {
  if (
    !url?.trim() ||
    !key?.trim() ||
    /your[-_ ]|replace[-_ ]|example/i.test(key)
  )
    return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" ||
      (parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))
    );
  } catch {
    return false;
  }
}

const environment = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;
const projectUrl = environment?.VITE_SUPABASE_URL?.trim();
const publicKey = environment?.VITE_SUPABASE_ANON_KEY?.trim();
export const cloudConfigured = validCloudConfig(projectUrl, publicKey);
let client: SupabaseClient | null = null;

/** Whether the Supabase project has the Google provider switched on; null while unknown or unreachable. */
export async function googleProviderEnabled(): Promise<boolean | null> {
  if (!cloudConfigured) return false;
  try {
    const response = await fetch(`${projectUrl!.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: publicKey! } });
    if (!response.ok) return null;
    const settings = (await response.json()) as { external?: Record<string, boolean> };
    return settings.external?.google === true;
  } catch {
    return null;
  }
}

export function getCloudClient(): SupabaseClient | null {
  if (!cloudConfigured) return null;
  client ??= createClient(projectUrl!, publicKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

export function parseCloudWorkspace(value: unknown): CloudWorkspace {
  if (typeof value !== "object" || value === null)
    throw new Error(
      "The saved account data could not be read. Your device copy has been kept.",
    );
  const row = value as Record<string, unknown>;
  if (
    !isAppData(row.payload) ||
    typeof row.revision !== "number" ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    typeof row.updated_at !== "string" ||
    !Number.isFinite(Date.parse(row.updated_at))
  ) {
    throw new Error(
      "The saved account data could not be read. Your device copy has been kept.",
    );
  }
  // Use the same migration as local storage before computing any sync baseline.
  // Otherwise the root's replacement migration could leave sync waiting forever
  // for an obsolete serialized payload that the UI never uses.
  return {
    payload: migrateAppData(row.payload),
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

export async function readCloudWorkspace(
  connection: SupabaseClient,
  userId: string,
): Promise<CloudWorkspace | null> {
  const { data, error } = await connection
    .from("user_workspaces")
    .select("payload,revision,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error(
      "We could not load your account. Your device copy is safe. Check your connection and try again.",
    );
  return data === null ? null : parseCloudWorkspace(data);
}

export async function writeCloudWorkspace(
  connection: SupabaseClient,
  userId: string,
  payload: AppData,
  expectedRevision: number | null,
): Promise<CloudWorkspace> {
  if (!isAppData(payload))
    throw new Error(
      "This profile could not be saved. Export a backup before trying again.",
    );
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 1_000_000) {
    throw new Error(
      "This workspace is too large to sync. Export a backup, then shorten or remove old drafts.",
    );
  }
  // The server checks both the authenticated ID and the revision atomically.
  // A delayed request cannot write one account's profile into a newly signed-in account.
  const { data, error } = await connection.rpc("save_workspace", {
    p_user_id: userId,
    p_payload: payload,
    p_expected_revision: expectedRevision,
  });
  if (error?.code === "40001") throw new CloudConflictError();
  if (error)
    throw new Error(
      "Your latest changes are on this device, but could not sync. Check your connection and try again.",
    );
  return parseCloudWorkspace(data);
}

export type FeedbackCategory = "idea" | "problem" | "question" | "other";
export interface FeedbackDraft {
  category: FeedbackCategory;
  name: string;
  email: string;
  message: string;
  consent: boolean;
}
export function validateFeedback(draft: FeedbackDraft): string | null {
  if (!["idea", "problem", "question", "other"].includes(draft.category))
    return "Choose a feedback topic.";
  if (draft.name.trim().length > 80) return "Keep your name to 80 characters.";
  if (
    draft.email.trim().length > 254 ||
    (draft.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
  )
    return "Enter a valid reply email, or leave it empty.";
  if (draft.message.trim().length < 10 || draft.message.trim().length > 5000)
    return "Write a message between 10 and 5,000 characters.";
  if (!draft.consent)
    return "Please agree to share this message with Rasta before sending.";
  return null;
}

export async function sendFeedback(
  connection: SupabaseClient,
  draft: FeedbackDraft,
): Promise<void> {
  const problem = validateFeedback(draft);
  if (problem) throw new Error(problem);
  const {
    data: { session },
    error: sessionError,
  } = await connection.auth.getSession();
  if (sessionError || !session)
    throw new Error(
      "Sign in with Google before sending feedback, or download your draft for later.",
    );
  const { error } = await connection.rpc("submit_feedback", {
    p_user_id: session.user.id,
    p_category: draft.category,
    p_name: draft.name.trim() || null,
    p_reply_email: draft.email.trim() || null,
    p_message: draft.message.trim(),
    p_consent: draft.consent,
  });
  if (error?.code === "P0001")
    throw new Error(
      "You have sent several messages recently. Please try again tomorrow; your draft is still here.",
    );
  if (error)
    throw new Error(
      "Your message was not sent. Please try again, or download the draft to keep it.",
    );
}
