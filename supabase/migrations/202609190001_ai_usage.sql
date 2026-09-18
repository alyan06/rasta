-- AI usage accounting for the `ai` Edge Function. Stores counts and token numbers only — never
-- the student's text. Clients cannot read or write this table; only the service role (the
-- function) calls the RPCs below.

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('activity', 'essay')),
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_feature_created_idx on public.ai_usage(user_id, feature, created_at desc);
create index if not exists ai_usage_created_idx on public.ai_usage(created_at desc);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant all on public.ai_usage to service_role;
-- No policies: the table is invisible to signed-in clients by design.

-- Reserves one use if both the per-user (rolling 24 h) and global (UTC day) limits allow it.
-- The advisory lock serialises callers per feature so concurrent requests cannot slip past a limit.
create or replace function public.ai_reserve_use(
  p_user_id uuid,
  p_feature text,
  p_user_limit integer,
  p_global_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_count integer;
  global_count integer;
  new_id uuid;
begin
  if p_user_id is null or p_feature not in ('activity', 'essay') or p_user_limit < 1 or p_global_limit < 1 then
    raise exception 'Invalid reservation' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ai_usage:' || p_feature, 0));
  select count(*) into user_count from public.ai_usage
    where user_id = p_user_id and feature = p_feature and created_at > now() - interval '24 hours';
  if user_count >= p_user_limit then
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'user', 'remaining', 0);
  end if;
  select count(*) into global_count from public.ai_usage
    where feature = p_feature and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if global_count >= p_global_limit then
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'global', 'remaining', p_user_limit - user_count);
  end if;
  insert into public.ai_usage(user_id, feature) values (p_user_id, p_feature) returning id into new_id;
  return pg_catalog.jsonb_build_object('allowed', true, 'id', new_id, 'remaining', p_user_limit - user_count - 1);
end;
$$;

create or replace function public.ai_finish_use(p_id uuid, p_model text, p_input_tokens integer, p_output_tokens integer)
returns void language sql security definer set search_path = '' as $$
  update public.ai_usage set model = p_model, input_tokens = p_input_tokens, output_tokens = p_output_tokens where id = p_id;
$$;

-- Refunds a reservation when the model call fails, so a student is not charged for our error.
create or replace function public.ai_cancel_use(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.ai_usage where id = p_id;
$$;

-- Remaining uses for the "N left today" labels.
create or replace function public.ai_remaining(p_user_id uuid, p_feature text, p_user_limit integer)
returns integer language sql security definer set search_path = '' as $$
  select greatest(0, p_user_limit - (select count(*)::integer from public.ai_usage
    where user_id = p_user_id and feature = p_feature and created_at > now() - interval '24 hours'));
$$;

revoke all on function public.ai_reserve_use(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ai_finish_use(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ai_cancel_use(uuid) from public, anon, authenticated;
revoke all on function public.ai_remaining(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.ai_reserve_use(uuid, text, integer, integer) to service_role;
grant execute on function public.ai_finish_use(uuid, text, integer, integer) to service_role;
grant execute on function public.ai_cancel_use(uuid) to service_role;
grant execute on function public.ai_remaining(uuid, text, integer) to service_role;

-- Operator view for cost monitoring (dashboard SQL editor):
--   select feature, date_trunc('day', created_at) as day, count(*) as calls,
--          sum(input_tokens) as input_tokens, sum(output_tokens) as output_tokens
--   from public.ai_usage group by 1, 2 order by 2 desc, 1;
