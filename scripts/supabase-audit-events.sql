-- ==========================================================
-- AUDIT LOGGING (100% recommended)
-- Immutable audit events + RLS + helpers
-- ==========================================================

-- 1) Table: audit_events
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  actor_id uuid references public.profiles(id) on delete set null,     -- who did it
  actor_role public.user_role,                                        -- cached role at time
  company_id uuid references public.companies(id) on delete set null,  -- scope if relevant

  action text not null,                                               -- "accept_bid", "manual_assign", "cancel_assignment", etc.
  entity_type text not null,                                          -- "load", "bid", "assignment", "document", "profile", "thread"
  entity_id uuid,                                                     -- the primary entity id (nullable for system events)

  related_ids jsonb not null default '{}'::jsonb,                      -- { load_id, bid_id, assignment_id, thread_id, ... }
  before jsonb,                                                       -- snapshot before
  after jsonb,                                                        -- snapshot after
  metadata jsonb not null default '{}'::jsonb                          -- extra info (ip, reason, etc.)
);

create index if not exists audit_events_created_at_idx on public.audit_events(created_at desc);
create index if not exists audit_events_company_id_created_at_idx on public.audit_events(company_id, created_at desc);
create index if not exists audit_events_actor_id_created_at_idx on public.audit_events(actor_id, created_at desc);
create index if not exists audit_events_action_idx on public.audit_events(action);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id);

alter table public.audit_events enable row level security;

-- 2) Helper: current actor role (cached in audit)
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'owner_operator'::public.user_role);
$$;

-- 3) Helper: current actor company
create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select (select company_id from public.profiles where id = auth.uid());
$$;

-- 4) Policy: admins can read all audit
select public.drop_policy_if_exists('public.audit_events', 'audit_select_admin');
create policy audit_select_admin
on public.audit_events for select
using (public.is_admin());

-- 5) Policy: dispatcher can read audit for their company
select public.drop_policy_if_exists('public.audit_events', 'audit_select_dispatcher_company');
create policy audit_select_dispatcher_company
on public.audit_events for select
using (
  public.is_dispatcher()
  and public.current_company_id() is not null
  and audit_events.company_id = public.current_company_id()
);

-- 6) Policy: user can read audit events where they are actor OR related to them
-- This is intentionally conservative: actor can always see their own events;
-- and any event referencing their profile_id in related_ids/profile entity.
select public.drop_policy_if_exists('public.audit_events', 'audit_select_self_related');
create policy audit_select_self_related
on public.audit_events for select
using (
  actor_id = auth.uid()
  or (entity_type = 'profile' and entity_id = auth.uid())
  or (related_ids ? 'shipper_id' and (related_ids->>'shipper_id')::uuid = auth.uid())
  or (related_ids ? 'carrier_id' and (related_ids->>'carrier_id')::uuid = auth.uid())
);

-- 7) Block all direct inserts/updates/deletes from clients (immutable)
revoke insert, update, delete on public.audit_events from authenticated, anon;

-- 8) Internal writer function (SECURITY DEFINER)
create or replace function public.write_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_related_ids jsonb default '{}'::jsonb,
  p_before jsonb default null,
  p_after jsonb default null,
  p_company_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.user_role := public.current_user_role();
  v_company uuid := coalesce(p_company_id, public.current_company_id());
begin
  -- if auth.uid() is null (server job), still allow write with null actor
  insert into public.audit_events (
    actor_id, actor_role, company_id,
    action, entity_type, entity_id,
    related_ids, before, after, metadata
  )
  values (
    v_actor, v_role, v_company,
    p_action, p_entity_type, p_entity_id,
    coalesce(p_related_ids, '{}'::jsonb),
    p_before, p_after,
    coalesce(p_metadata, '{}'::jsonb)
  );
end $$;

revoke all on function public.write_audit_event(text, text, uuid, jsonb, jsonb, jsonb, uuid, jsonb) from public;
grant execute on function public.write_audit_event(text, text, uuid, jsonb, jsonb, jsonb, uuid, jsonb) to service_role;
