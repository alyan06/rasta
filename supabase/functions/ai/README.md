# `ai` Edge Function

Button-only AI help for Rasta. See `docs/AI_SETUP.md` for deployment, secrets, quotas and monitoring.
`guards.ts` is the single source of truth for the deterministic checks; the browser re-exports it from `src/lib/ai-guards.ts`.
