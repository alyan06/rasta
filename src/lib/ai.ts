import { FunctionsHttpError } from "@supabase/supabase-js";
import type { Activity, EssayDraft } from "../types";
import { cloudConfigured, getCloudClient } from "./cloud";
import { AI_LIMITS, type AiErrorCode } from "./ai-guards";

export { AI_LIMITS, COMMON_APP } from "./ai-guards";

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}
export interface AiRemaining { activity: number; essay: number }

/** Sends a button-triggered request to the `ai` Edge Function; the student never writes a prompt. */
async function call<T>(body: Record<string, unknown>): Promise<T> {
  const connection = getCloudClient();
  if (!cloudConfigured || !connection) throw new AiError("disconnected", "AI help needs the account service, which is not connected on this installation.");
  const { data: { session } } = await connection.auth.getSession();
  if (!session) throw new AiError("sign_in", "Sign in with Google (top right) to use AI help.");
  const { data, error } = await connection.functions.invoke<T>("ai", { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let payload: { error?: { code?: AiErrorCode; message?: string } } | null = null;
      try { payload = await error.context.json(); } catch { /* non-JSON error body */ }
      if (payload?.error?.code) throw new AiError(payload.error.code, payload.error.message ?? "AI help is unavailable right now.");
    }
    throw new AiError("model_error", "AI help could not be reached. Your text is unchanged.");
  }
  return data as T;
}

export const aiStatus = () => call<{ remaining: AiRemaining }>({ feature: "status" }).then(result => result.remaining);

export function aiImproveActivity(activity: Activity): Promise<{ improved: string; remaining: number }> {
  return call({ feature: "activity", activity: { title: activity.title, role: activity.role, organization: activity.organization, type: activity.type, description: activity.description, hoursPerWeek: activity.hoursPerWeek, weeksPerYear: activity.weeksPerYear } });
}

export function aiPolishEssay(draft: EssayDraft): Promise<{ polished: string; changes: string[]; words: number; remaining: number }> {
  return call({ feature: "essay", essay: { prompt: draft.prompt, content: draft.content, wordLimit: draft.wordLimit ?? 650 } });
}

/** Copy for each failure, in the student's language of the rest of the app. */
export function aiErrorMessage(error: unknown, feature: "activity" | "essay"): string {
  if (error instanceof AiError) {
    if (error.code === "quota") return feature === "activity" ? `You've used today's ${AI_LIMITS.activity.perDay} AI improvements. Try again tomorrow.` : `You've used today's ${AI_LIMITS.essay.perDay} AI polishes. Try again tomorrow.`;
    return error.message;
  }
  return "AI help could not be reached. Your text is unchanged.";
}
