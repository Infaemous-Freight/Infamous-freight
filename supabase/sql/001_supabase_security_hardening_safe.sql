-- Infamous Freight: safe-first Supabase security hardening.
-- Purpose: ensure Stripe ingestion internals are not browser-accessible.

begin;

alter table if exists public.stripe_events enable row level security;
alter table if exists public.stripe_events_dlq enable row level security;

revoke all on table public.stripe_events from anon, authenticated;
revoke all on table public.stripe_events_dlq from anon, authenticated;

-- Remove prior permissive policies if present.
drop policy if exists "deny_all_stripe_events" on public.stripe_events;
drop policy if exists "deny_all_stripe_events_dlq" on public.stripe_events_dlq;

create policy "deny_all_stripe_events"
  on public.stripe_events
  for all
  to public
  using (false)
  with check (false);

create policy "deny_all_stripe_events_dlq"
  on public.stripe_events_dlq
  for all
  to public
  using (false)
  with check (false);

-- Health/internal webhook views should not be public if they exist.
do $$
declare
  r record;
begin
  for r in
    select quote_ident(schemaname) as s, quote_ident(viewname) as v
    from pg_views
    where schemaname = 'public'
      and (viewname ilike 'stripe%health%' or viewname ilike '%webhook%health%')
  loop
    execute format('revoke all on table %s.%s from anon, authenticated', r.s, r.v);
  end loop;
end$$;

commit;
