/** Deterministic guardrails shared by the browser and the `ai` Edge Function.
 * Pure functions only: this file is imported by Deno as well as by Node tests. */

export const COMMON_APP = { role: 50, organization: 100, description: 150 } as const;
export const AI_LIMITS = {
  activity: { perDay: 5, globalPerDay: 300, minChars: 20, maxChars: 1000 },
  essay: { perDay: 2, globalPerDay: 100, minWords: 100, maxWords: 1300 },
} as const;
export type AiFeature = keyof typeof AI_LIMITS;
export type AiErrorCode = 'sign_in' | 'invalid' | 'unsafe' | 'not_an_activity' | 'not_an_essay' | 'invented_details' | 'too_long' | 'quota' | 'model_error' | 'disconnected';

const urlPattern = /(https?:\/\/|www\.)\S+/i;
/** Phrases that only make sense as instructions to a model, never inside an activity or essay. */
const injectionPattern = /ignore (all|any|the|previous|prior|above|earlier)?\s*(previous |prior |above |earlier )?instructions|system prompt|as an ai\b|you are (now )?(chatgpt|claude|an? (ai|assistant|language model))|disregard (the|your|all) (rules|instructions)/i;

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Numbers as written (digits, with separators stripped) so an output can be checked for invented figures. */
export function numberTokens(text: string): string[] {
  return (text.match(/\d[\d,.]*/g) ?? []).map(token => token.replace(/[,.]+$/, '').replace(/,/g, ''));
}
/** True when every number in `output` already appears in `input`. */
export function numbersSubset(input: string, output: string): boolean {
  const known = new Set(numberTokens(input));
  return numberTokens(output).every(token => known.has(token));
}

export interface PreCheckFailure { code: 'invalid' | 'unsafe'; message: string }
export function precheckActivity(description: string): PreCheckFailure | null {
  const text = description.trim();
  if (text.length < AI_LIMITS.activity.minChars) return { code: 'invalid', message: `Write at least ${AI_LIMITS.activity.minChars} characters about the activity first.` };
  if (text.length > AI_LIMITS.activity.maxChars) return { code: 'invalid', message: `Keep the description under ${AI_LIMITS.activity.maxChars} characters before asking for help.` };
  if (urlPattern.test(text)) return { code: 'invalid', message: 'Remove links from the description first.' };
  if (injectionPattern.test(text)) return { code: 'unsafe', message: 'That text contains instructions rather than a description of an activity.' };
  return null;
}
export function precheckEssay(content: string, wordLimit: number): PreCheckFailure | null {
  const words = wordCount(content);
  if (words < AI_LIMITS.essay.minWords) return { code: 'invalid', message: `Write at least ${AI_LIMITS.essay.minWords} words before polishing; the AI improves what is there, it does not write for you.` };
  if (words > AI_LIMITS.essay.maxWords) return { code: 'invalid', message: `Trim the draft to under ${AI_LIMITS.essay.maxWords} words first.` };
  if (![250, 500, 650].includes(wordLimit)) return { code: 'invalid', message: 'Choose a word target of 250, 500 or 650.' };
  if (injectionPattern.test(content)) return { code: 'unsafe', message: 'That text contains instructions rather than an essay draft.' };
  return null;
}

export interface PostCheckFailure { code: 'invented_details' | 'too_long' | 'invalid'; message: string }
export function postcheckActivity(input: string, improved: string): PostCheckFailure | null {
  const text = improved.trim();
  if (!text || text === input.trim()) return { code: 'invalid', message: 'The suggestion was empty or unchanged.' };
  if (text.length > COMMON_APP.description) return { code: 'too_long', message: 'The suggestion ran past 150 characters.' };
  if (urlPattern.test(text)) return { code: 'invalid', message: 'The suggestion contained a link.' };
  if (!numbersSubset(input, text)) return { code: 'invented_details', message: 'The suggestion added a number that was not in your description, so it was discarded.' };
  return null;
}
export function postcheckEssay(input: string, polished: string, wordLimit: number): PostCheckFailure | null {
  const text = polished.trim();
  const words = wordCount(text);
  if (!text || text === input.trim()) return { code: 'invalid', message: 'The suggestion was empty or unchanged.' };
  if (words > wordLimit) return { code: 'too_long', message: `The polished draft ran past ${wordLimit} words.` };
  if (words < Math.floor(wordCount(input) * 0.85)) return { code: 'invalid', message: 'The polished draft dropped too much of your writing, so it was discarded.' };
  if (!numbersSubset(input, text)) return { code: 'invented_details', message: 'The polished draft added a number that was not in your essay, so it was discarded.' };
  return null;
}
