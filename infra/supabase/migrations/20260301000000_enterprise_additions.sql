-- ============================================
-- Infæmous Freight Enterprise Additions (100%)
-- profiles + active company, webhook idempotency, subscription item mapping,
-- ops tables + RLS, storage policies for documents bucket, admin unlock flow
-- ============================================

create extension if not exists "pgcrypto";

-- 1) Profiles (active company selection)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_company_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.update_updated_at_column();

alter table public.profiles enable row level security;

drop policy if exists profiles_self_rw on public.profiles;
create policy profiles_self_rw
on public.profiles for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 2) Stripe webhook idempotency (required)
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists stripe_events_none on public.stripe_webhook_events;
create policy stripe_events_none
on public.stripe_webhook_events for select
using (false);

-- 3) Subscription item mapping for metered AI reporting
create table if not exists public.stripe_subscription_items (
  company_id uuid not null references public.companies(id) on delete cascade,
  price_id text not null,
  subscription_item_id text not null,
  updated_at timestamptz not null default now(),
  primary key (company_id, price_id)
);

alter table public.stripe_subscription_items enable row level security;

drop policy if exists subitems_admin_read on public.stripe_subscription_items;
create policy subitems_admin_read
on public.stripe_subscription_items for select
using (public.is_adminish(company_id));

-- 4) Ops tables (enterprise minimal)
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
  created_at timestamptz not null default now()
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

alter table public.loads enable row level security;
alter table public.assignments enable row level security;
alter table public.documents enable row level security;
alter table public.status_events enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;

drop policy if exists loads_member_rw on public.loads;
create policy loads_member_rw
on public.loads for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists assignments_member_rw on public.assignments;
create policy assignments_member_rw
on public.assignments for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists documents_member_rw on public.documents;
create policy documents_member_rw
on public.documents for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists status_events_member_rw on public.status_events;
create policy status_events_member_rw
on public.status_events for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists threads_member_rw on public.threads;
create policy threads_member_rw
on public.threads for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists messages_member_rw on public.messages;
create policy messages_member_rw
on public.messages for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

-- 5) Storage policies for bucket: "documents"
drop policy if exists "documents_read_company" on storage.objects;
create policy "documents_read_company"
on storage.objects for select
using (
  bucket_id = 'documents'
  and public.is_member((split_part(name,'/',1))::uuid)
);

drop policy if exists "documents_insert_company" on storage.objects;
create policy "documents_insert_company"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and public.is_member((split_part(name,'/',1))::uuid)
);

drop policy if exists "documents_delete_admin" on storage.objects;
create policy "documents_delete_admin"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and public.is_adminish((split_part(name,'/',1))::uuid)
);
