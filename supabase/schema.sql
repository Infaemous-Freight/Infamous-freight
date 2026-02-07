-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type if not exists membership_role as enum ('owner','admin','dispatcher','driver','viewer');
create type if not exists billing_status as enum ('trial','active','past_due','suspended','canceled');

-- Companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Memberships
create table if not exists company_memberships (
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role membership_role default 'viewer',
  primary key (company_id, user_id)
);

-- Feature flags / kill switches
create table if not exists company_features (
  company_id uuid primary key references companies(id) on delete cascade,
  enable_ai boolean default true,
  enable_ai_automation boolean default true,
  enable_marketplace boolean default false,
  enable_checkout boolean default true
);

-- Billing (company-level)
create table if not exists company_billing (
  company_id uuid primary key references companies(id) on delete cascade,
  status billing_status default 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_key text default 'fleet',
  seats int default 1,
  ai_included int default 500,
  ai_hard_cap_multiplier int default 2,
  ai_hard_capped boolean default false,
  created_at timestamptz default now()
);

-- AI Usage (monthly)
create table if not exists ai_usage_aggregates (
  company_id uuid references companies(id) on delete cascade,
  month_key text,
  actions_used int default 0,
  primary key (company_id, month_key)
);

-- Audit Logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  actor_user_id uuid,
  action text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes on frequently queried / foreign key columns
create index if not exists idx_company_memberships_user_id on company_memberships(user_id);
create index if not exists idx_company_billing_stripe_customer_id on company_billing(stripe_customer_id);
create index if not exists idx_ai_usage_aggregates_company_id on ai_usage_aggregates(company_id);
create index if not exists idx_audit_logs_company_id on audit_logs(company_id);
-- Enable RLS
alter table companies enable row level security;
alter table company_memberships enable row level security;
alter table company_features enable row level security;
alter table company_billing enable row level security;
alter table ai_usage_aggregates enable row level security;
alter table audit_logs enable row level security;

-- Helpers
create or replace function is_member(cid uuid)
returns boolean language sql stable as $$
  select
    case
      when auth.uid() is null then false
      else exists(
        select 1
        from company_memberships
        where company_id = cid
          and user_id = auth.uid()
      )
    end;
$$;

create or replace function is_adminish(cid uuid)
returns boolean language sql stable as $$
  select
    case
      when auth.uid() is null then false
      else exists(
        select 1
        from company_memberships
        where company_id = cid
          and user_id = auth.uid()
          and role in ('owner','admin')
      )
    end;
$$;

-- Policies
create policy if not exists companies_read on companies for select using (is_member(id));
create policy if not exists memberships_rw on company_memberships for all using (is_adminish(company_id)) with check (is_adminish(company_id));
create policy if not exists features_admin on company_features for all using (is_adminish(company_id)) with check (is_adminish(company_id));
create policy if not exists billing_admin on company_billing for all using (is_adminish(company_id)) with check (is_adminish(company_id));
create policy if not exists usage_admin on ai_usage_aggregates for select using (is_adminish(company_id));
create policy if not exists audit_admin on audit_logs for select using (is_adminish(company_id));
