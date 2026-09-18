# AI help: setup, limits and monitoring

Two buttons, no prompt box. **Improve with AI** (activity descriptions, Common App style, ≤150 characters) and **Polish with AI** (essay drafts, the student's own voice). Everything the model is told is hard-coded in `supabase/functions/ai/index.ts`; the student's text is passed as data inside `<student_text>` tags and is checked before and after the call.

## Pieces

| Piece | Where | Notes |
| --- | --- | --- |
| Edge Function `ai` | `supabase/functions/ai/index.ts` | Deno. Verifies the Google session, runs the checks, reserves a use, calls Claude with structured JSON output, checks the answer, records tokens. Deployed with `verify_jwt` on. |
| Guardrails | `supabase/functions/ai/guards.ts` | Single source of truth, re-exported to the app as `src/lib/ai-guards.ts` and unit-tested in Node (`src/lib/ai-guards.test.ts`). |
| Usage table + RPCs | `supabase/migrations/202609190001_ai_usage.sql` | `ai_usage` stores user id, feature, model and token counts — never text. Clients have no access; only the service role calls `ai_reserve_use` / `ai_finish_use` / `ai_cancel_use` / `ai_remaining`. |
| Client | `src/lib/ai.ts`, `src/components/AiAssist.tsx` | `supabase.functions.invoke('ai', …)` with the session JWT; suggestion panel with Keep / Revert; "N left today" from the `status` call. |

## Models and cost

| Feature | Model | Typical tokens | Approx. cost per call |
| --- | --- | --- | --- |
| Improve activity | `claude-haiku-4-5` | ~600 in / ~150 out | ≈ $0.0014 |
| Polish essay | `claude-opus-5` (adaptive thinking, effort `medium`) | ~1,500 in / ~900 out | ≈ $0.03 |

Rates: Haiku 4.5 $1 / $5 per million input / output tokens; Opus 5 $5 / $25 (first-party API, June 2026 table). Check the Anthropic Console for the current sheet.

## Limits (constants in `guards.ts` → `AI_LIMITS`)

| | Per signed-in account, rolling 24 h | Whole site, per UTC day |
| --- | --- | --- |
| Activity improvements | 5 | 300 |
| Essay polishes | 2 | 100 |

Worst-case daily bill at those ceilings ≈ 300 × $0.0014 + 100 × $0.03 ≈ **$3.50**; a normal day with a few dozen students is cents. The per-user limit is enforced inside a transaction with an advisory lock, so parallel requests cannot slip past it. A failed model call refunds the reservation. Raising limits later (a paid "Plus" tier) means passing a different `p_user_limit` for users with a plan flag — nothing else changes.

## Guardrails, in order

1. **Sign-in required.** The gateway rejects requests without a JWT; the function then resolves the user with `auth.getUser()`.
2. **Pre-checks (no model cost):** activity text 20–1,000 characters, essay 100–1,300 words, no URLs, no instruction-shaped phrases (`ignore previous instructions`, `system prompt`, `you are now …`).
3. **Reserve a use** against both limits.
4. **The model decides a verdict** (`ok` / `not_an_activity` or `not_an_essay` / `unsafe`) before rewriting. A request such as "please help me get into university" is refused with a friendly message; the use is refunded.
5. **Post-checks:** ≤150 characters (one automatic shorten retry), essay ≤ word target and ≥ 85% of the original length, no links, no number that was not already in the student's text (`numbersSubset`), not identical to the input. Failures are refunded and reported.
6. **Nothing is saved server-side** except the usage row. The suggestion only enters the profile when the student presses **Keep**.

## Owner actions

1. **Set the API key** — Supabase dashboard → Edge Functions → Secrets → add `ANTHROPIC_API_KEY`. Until it exists the buttons return "AI help is not switched on yet" and nothing is charged.
2. Optionally set a **monthly spend limit** in the Anthropic Console as a second ceiling.
3. Deploy changes to the function with the Supabase CLI (`supabase functions deploy ai`) or the Supabase MCP `deploy_edge_function` tool, uploading `index.ts`, `guards.ts` and `deno.json`.

## Monitoring

```sql
select feature, date_trunc('day', created_at) as day, count(*) as calls,
       sum(input_tokens) as input_tokens, sum(output_tokens) as output_tokens
from public.ai_usage group by 1, 2 order by 2 desc, 1;
```

Function logs (errors are logged as `ai function model error …`): dashboard → Edge Functions → `ai` → Logs.

## Smoke test

```bash
curl -s -X POST https://kwlfhxegnyvmzekxexto.supabase.co/functions/v1/ai \
  -H "Authorization: Bearer <anon key>" -H "apikey: <anon key>" \
  -H "Content-Type: application/json" -d '{"feature":"status"}'
# → 401 {"error":{"code":"sign_in",...}}  (the function is up; a real session is needed for more)
```

Full path: sign in on rastapk.com, open **My profile**, write an activity description, press **Improve with AI**; then paste "please help me get into university" and confirm the rejection; then **Essay studio** → **Polish with AI** on a 300-word draft. Each success adds a row to `ai_usage`.
