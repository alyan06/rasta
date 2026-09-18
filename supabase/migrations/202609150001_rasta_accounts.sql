-- Rasta account workspace and feedback. Apply using the Supabase SQL editor or CLI.
-- No Google client secret or service-role key belongs in the browser application.

create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint workspace_payload_shape check (
    jsonb_typeof(payload) = 'object'
    and payload->>'version' = '1'
    and jsonb_typeof(payload->'profile') = 'object'
    and jsonb_typeof(payload->'saved') = 'array'
    and jsonb_typeof(payload->'applications') = 'array'
    and jsonb_typeof(payload->'essays') = 'array'
    and octet_length(payload::text) <= 1100000
  )
);

alter table public.user_workspaces enable row level security;
revoke all on public.user_workspaces from anon, authenticated;
grant select on public.user_workspaces to authenticated;
grant all on public.user_workspaces to service_role;

create policy "Read your own workspace" on public.user_workspaces
  for select to authenticated using ((select auth.uid()) = user_id);
-- Table mutation privileges are intentionally withheld. Writes must use the
-- revision-checked RPC below, including clients that bypass the application UI.
create policy "Insert your own workspace" on public.user_workspaces
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update your own workspace" on public.user_workspaces
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.save_workspace(
  p_user_id uuid,
  p_payload jsonb,
  p_expected_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.user_workspaces%rowtype;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'An active matching account is required' using errcode = '42501';
  end if;
  if p_payload is null or pg_catalog.octet_length(p_payload::text) > 1100000
     or pg_catalog.jsonb_typeof(p_payload) is distinct from 'object'
     or p_payload->>'version' is distinct from '1'
     or pg_catalog.jsonb_typeof(p_payload->'profile') is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_payload->'saved') is distinct from 'array'
     or pg_catalog.jsonb_typeof(p_payload->'applications') is distinct from 'array'
     or pg_catalog.jsonb_typeof(p_payload->'essays') is distinct from 'array' then
    raise exception 'Invalid workspace' using errcode = '22023';
  end if;

  if p_expected_revision is null then
    insert into public.user_workspaces(user_id, payload, revision)
      values (auth.uid(), p_payload, 1)
      on conflict (user_id) do nothing
      returning * into saved;
  else
    update public.user_workspaces
      set payload = p_payload, revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and revision = p_expected_revision
      returning * into saved;
  end if;
  if not found then
    raise exception 'Workspace changed. Reload before saving.' using errcode = '40001';
  end if;
  return pg_catalog.jsonb_build_object('payload', saved.payload, 'revision', saved.revision, 'updated_at', saved.updated_at);
end;
$$;
revoke all on function public.save_workspace(uuid, jsonb, bigint) from public, anon;
grant execute on function public.save_workspace(uuid, jsonb, bigint) to authenticated;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('idea', 'problem', 'question', 'other')),
  name text check (char_length(name) <= 80),
  reply_email text check (char_length(reply_email) <= 254),
  message text not null check (char_length(message) between 10 and 5000),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists feedback_user_created_idx on public.feedback(user_id, created_at desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant all on public.feedback to service_role;
-- No client SELECT policy: feedback is only reviewed in the operator's backend.
-- This INSERT policy documents ownership, while the RPC enforces submission limits.
create policy "Submit feedback as yourself" on public.feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.submit_feedback(
  p_user_id uuid,
  p_category text,
  p_name text,
  p_reply_email text,
  p_message text,
  p_consent boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  recent_count integer;
  daily_count integer;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'An active matching account is required' using errcode = '42501';
  end if;
  if p_consent is distinct from true or p_category is null
     or p_category not in ('idea', 'problem', 'question', 'other')
     or p_message is null or pg_catalog.char_length(pg_catalog.btrim(p_message)) not between 10 and 5000
     or pg_catalog.char_length(p_name) > 80 or pg_catalog.char_length(p_reply_email) > 254
     or (p_reply_email is not null and p_reply_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Invalid feedback' using errcode = '22023';
  end if;
  -- Serialize submissions from the same account to close the concurrent-request quota gap.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  select count(*) filter (where created_at > now() - interval '1 hour'), count(*)
    into recent_count, daily_count from public.feedback
    where user_id = auth.uid() and created_at > now() - interval '24 hours';
  if recent_count >= 5 or daily_count >= 20 then
    raise exception 'Feedback rate limit reached' using errcode = 'P0001';
  end if;
  insert into public.feedback(user_id, category, name, reply_email, message)
    values(auth.uid(), p_category, nullif(pg_catalog.btrim(p_name), ''), nullif(pg_catalog.btrim(p_reply_email), ''), pg_catalog.btrim(p_message))
    returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_feedback(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.submit_feedback(uuid, text, text, text, text, boolean) to authenticated;
