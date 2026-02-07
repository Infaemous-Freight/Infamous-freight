-- ============================================
-- Infæmous Freight Enterprise Core (100%)
-- Company-level billing + RBAC + feature flags + AI usage + audit logs
-- ============================================

create extension if not exists "pgcrypto";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('owner','admin','dispatcher','driver','viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_status') then
    create type public.billing_status as enum ('trial','active','past_due','suspended','canceled');
  end if;
end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.company_features (
  company_id uuid primary key references public.companies(id) on delete cascade,
  enable_ai boolean not null default true,
  enable_ai_automation boolean not null default true,
  enable_marketplace boolean not null default false,
  enable_checkout boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_billing (
  company_id uuid primary key references public.companies(id) on delete cascade,
  status public.billing_status not null default 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_key text not null default 'fleet',
  seats int not null default 1,
  ai_included int not null default 500,
  ai_overage numeric not null default 0.008,
  ai_hard_cap_multiplier int not null default 2,
  ai_hard_capped boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_aggregates (
  company_id uuid not null references public.companies(id) on delete cascade,
  month_key text not null,
  actions_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, month_key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_company_features_updated on public.company_features;
create trigger trg_company_features_updated
before update on public.company_features
for each row execute function public.set_updated_at();

drop trigger if exists trg_company_billing_updated on public.company_billing;
create trigger trg_company_billing_updated
before update on public.company_billing
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_usage_updated on public.ai_usage_aggregates;
create trigger trg_ai_usage_updated
before update on public.ai_usage_aggregates
for each row execute function public.set_updated_at();

-- RBAC helpers
-- Treat Supabase service-role JWTs as fully privileged for RBAC helpers.
-- This prevents auth.uid() = NULL from causing RLS helpers to deny admin operations
-- when called under a service-role context.
create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  current_setting('request.jwt.claim.role', true) = 'service_role'
$$;

create or replace function public.is_member(cid uuid)
returns boolean
language sql
stable
as $$
  public.is_service_role()
  or exists(
    select 1
    from public.company_memberships
    where company_id = cid
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_adminish(cid uuid)
returns boolean
language sql
stable
as $$
  public.is_service_role()
  or exists(
    select 1
    from public.company_memberships
    where company_id = cid
      and user_id = auth.uid()
      and role in ('owner','admin')
  )
$$;

-- RLS
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_features enable row level security;
alter table public.company_billing enable row level security;
alter table public.ai_usage_aggregates enable row level security;
alter table public.audit_logs enable row level security;

-- Policies (minimal, enterprise-correct)
drop policy if exists companies_member_read on public.companies;
create policy companies_member_read
on public.companies for select
using (public.is_member(id));

drop policy if exists memberships_admin_manage on public.company_memberships;
create policy memberships_admin_manage
on public.company_memberships for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

drop policy if exists features_admin_manage on public.company_features;
create policy features_admin_manage
on public.company_features for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

drop policy if exists billing_admin_manage on public.company_billing;
create policy billing_admin_manage
on public.company_billing for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

drop policy if exists usage_admin_read on public.ai_usage_aggregates;
create policy usage_admin_read
on public.ai_usage_aggregates for select
using (public.is_adminish(company_id));

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read
on public.audit_logs for select
using (public.is_adminish(company_id));

drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert
on public.audit_logs for insert
with check (public.is_adminish(company_id));
