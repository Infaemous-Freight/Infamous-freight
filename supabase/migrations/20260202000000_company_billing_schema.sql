create extension if not exists "pgcrypto";

-- enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('owner','admin','dispatcher','driver','viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'billing_status') then
    create type public.billing_status as enum ('trial','active','past_due','suspended','canceled');
  end if;
end $$;

-- base tables
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

-- extend existing audit_logs table with company-specific fields
alter table if exists public.audit_logs
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists meta jsonb not null default '{}'::jsonb;
-- updated_at helper
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

-- tenant helpers
create or replace function public.is_member(cid uuid)
returns boolean language sql security definer volatile as $$
  exists(select 1 from public.company_memberships where company_id = cid and user_id = auth.uid())
$$;

create or replace function public.is_adminish(cid uuid)
returns boolean language sql security definer volatile as $$
  exists(select 1 from public.company_memberships where company_id = cid and user_id = auth.uid() and role in ('owner','admin'))
$$;

-- profiles (active company)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- webhook idempotency
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- subscription item mapping (for metered usage)
create table if not exists public.stripe_subscription_items (
  company_id uuid not null references public.companies(id) on delete cascade,
  price_id text not null,
  subscription_item_id text not null,
  updated_at timestamptz not null default now(),
  primary key (company_id, price_id)
);

-- ops
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  reference text,
  pickup_location text,
  dropoff_location text,
  status text not null default 'posted',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_loads_updated on public.loads;
create trigger trg_loads_updated
before update on public.loads
for each row execute function public.set_updated_at();

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid not null references public.loads(id) on delete cascade,
  driver_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments
  add constraint assignments_driver_company_fk
  foreign key (company_id, driver_user_id)
  references public.memberships(company_id, user_id);
drop trigger if exists trg_assignments_updated on public.assignments;
create trigger trg_assignments_updated
before update on public.assignments
for each row execute function public.set_updated_at();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid references public.loads(id) on delete cascade,
  storage_path text not null,
  doc_type text not null default 'pod',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint documents_storage_path_company_prefix_chk
    check (storage_path like company_id::text || '/%')
);

create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid not null references public.loads(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid references public.loads(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_features enable row level security;
alter table public.company_billing enable row level security;
alter table public.ai_usage_aggregates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.profiles enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_subscription_items enable row level security;
alter table public.loads enable row level security;
alter table public.assignments enable row level security;
alter table public.documents enable row level security;
alter table public.status_events enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;

-- policies
drop policy if exists companies_member_read on public.companies;
create policy companies_member_read on public.companies for select using (public.is_member(id));

drop policy if exists memberships_admin_manage on public.company_memberships;
create policy memberships_admin_manage on public.company_memberships for all using (public.is_adminish(company_id)) with check (public.is_adminish(company_id));

drop policy if exists features_admin_manage on public.company_features;
create policy features_admin_manage on public.company_features for all using (public.is_adminish(company_id)) with check (public.is_adminish(company_id));

drop policy if exists billing_admin_manage on public.company_billing;
create policy billing_admin_manage on public.company_billing for all using (public.is_adminish(company_id)) with check (public.is_adminish(company_id));

drop policy if exists usage_admin_read on public.ai_usage_aggregates;
create policy usage_admin_read on public.ai_usage_aggregates for select using (public.is_adminish(company_id));

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select using (public.is_adminish(company_id));

drop policy if exists profiles_self_rw on public.profiles;
create policy profiles_self_rw on public.profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- no client access to stripe webhook event store
drop policy if exists stripe_events_none on public.stripe_webhook_events;
create policy stripe_events_none on public.stripe_webhook_events for select using (false);

drop policy if exists subitems_admin_read on public.stripe_subscription_items;
create policy subitems_admin_read on public.stripe_subscription_items for select using (public.is_adminish(company_id));

-- ops member/admin policies
drop policy if exists loads_member_rw on public.loads;
create policy loads_member_read on public.loads
  for select
  using (public.is_member(company_id));
create policy loads_admin_insert on public.loads
  for insert
  with check (public.is_adminish(company_id));
create policy loads_admin_update on public.loads
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy loads_admin_delete on public.loads
  for delete
  using (public.is_adminish(company_id));

drop policy if exists assignments_member_rw on public.assignments;
create policy assignments_member_read on public.assignments
  for select
  using (public.is_member(company_id));
create policy assignments_admin_insert on public.assignments
  for insert
  with check (public.is_adminish(company_id));
create policy assignments_admin_update on public.assignments
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy assignments_admin_delete on public.assignments
  for delete
  using (public.is_adminish(company_id));

drop policy if exists documents_member_rw on public.documents;
create policy documents_member_read on public.documents
  for select
  using (public.is_member(company_id));
create policy documents_admin_insert on public.documents
  for insert
  with check (public.is_adminish(company_id));
create policy documents_admin_update on public.documents
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy documents_admin_delete on public.documents
  for delete
  using (public.is_adminish(company_id));

drop policy if exists status_events_member_rw on public.status_events;
create policy status_events_member_read on public.status_events
  for select
  using (public.is_member(company_id));
create policy status_events_admin_insert on public.status_events
  for insert
  with check (public.is_adminish(company_id));
create policy status_events_admin_update on public.status_events
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy status_events_admin_delete on public.status_events
  for delete
  using (public.is_adminish(company_id));

drop policy if exists threads_member_rw on public.threads;
create policy threads_member_read on public.threads
  for select
  using (public.is_member(company_id));
create policy threads_admin_insert on public.threads
  for insert
  with check (public.is_adminish(company_id));
create policy threads_admin_update on public.threads
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy threads_admin_delete on public.threads
  for delete
  using (public.is_adminish(company_id));

drop policy if exists messages_member_rw on public.messages;
create policy messages_member_read on public.messages
  for select
  using (public.is_member(company_id));
create policy messages_admin_insert on public.messages
  for insert
  with check (public.is_adminish(company_id));
create policy messages_admin_update on public.messages
  for update
  using (public.is_adminish(company_id))
  with check (public.is_adminish(company_id));
create policy messages_admin_delete on public.messages
  for delete
  using (public.is_adminish(company_id));

-- storage policies (requires bucket named 'documents')
drop policy if exists "documents_read_company" on storage.objects;
create policy "documents_read_company" on storage.objects for select
using (bucket_id='documents' and public.is_member((split_part(name,'/',1))::uuid));

drop policy if exists "documents_insert_company" on storage.objects;
create policy "documents_insert_company" on storage.objects for insert
with check (bucket_id='documents' and public.is_member((split_part(name,'/',1))::uuid));

drop policy if exists "documents_delete_admin" on storage.objects;
create policy "documents_delete_admin" on storage.objects for delete
using (bucket_id='documents' and public.is_adminish((split_part(name,'/',1))::uuid));
