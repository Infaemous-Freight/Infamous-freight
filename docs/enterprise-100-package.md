# Enterprise 100% Package (Canonical)

This document captures the canonical enterprise scope, database schema, billing
state machine, feature flag enforcement, AI usage governance, and deployment
parity checklist described in the delivered package. Copy/paste sections as
needed.

## A) Canonical “Enterprise 100%” Definition (Locked)

**Modules (final)**

- Auth & Orgs (companies + memberships)
- RBAC (roles + permissions)
- Billing (company-level subscription + state machine)
- AI Usage (metered actions + alert/hard cap)
- Ops (loads, assignments, docs, status timeline)
- Comms (threads, messages, notifications)
- Admin (revenue + audit logs)
- Marketplace (Get Truck’N) feature-flagged off by default

## B) Supabase SQL (Schema + RLS + Audit Logs)

> Paste into Supabase SQL Editor and run.

```sql
-- ============================================
-- Infæmous Freight Enterprise — Clean Core (100%)
-- Company-level billing, RBAC, Audit Logs, AI usage governance
-- ============================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------
-- 1) Enums
-- ----------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('owner','admin','dispatcher','driver','viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_status') then
    create type public.billing_status as enum ('trial','active','past_due','suspended','canceled');
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum (
      'auth.login',
      'company.user.invite',
      'company.user.role_change',
      'billing.subscription_change',
      'billing.overage_approved',
      'ops.load.create',
      'ops.load.update',
      'ops.assignment.create',
      'ops.assignment.update',
      'ops.document.upload',
      'ai.action.executed',
      'ai.action.blocked'
    );
  end if;
end $$;

-- ----------------------------
-- 2) Companies & Memberships
-- ----------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_companies_updated_at
  before update on public.companies
  for each row
  execute procedure set_updated_at();
create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create index if not exists idx_memberships_company on public.company_memberships(company_id);
create index if not exists idx_memberships_user on public.company_memberships(user_id);

create or replace function public.set_company_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_company_memberships_set_updated_at
before update on public.company_memberships
for each row
execute procedure public.set_company_memberships_updated_at();
-- ----------------------------
-- 3) Feature Flags / Kill Switches (Company-level)
-- ----------------------------
create table if not exists public.company_features (
  company_id uuid primary key references public.companies(id) on delete cascade,
  enable_ai boolean not null default true,
  enable_marketplace boolean not null default false,
  enable_checkout boolean not null default true,
  enable_ai_automation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

-- ----------------------------
-- 4) Billing (Company-level)
-- ----------------------------
create table if not exists public.company_billing (
  company_id uuid primary key references public.companies(id) on delete cascade,
  status public.billing_status not null default 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  seats integer not null default 1,
  plan_key text not null default 'fleet', -- operator|fleet|enterprise (string for flexibility)
  ai_included integer not null default 500,
  ai_overage numeric not null default 0.008,
  ai_hard_cap_multiplier integer not null default 2, -- 200%
  ai_hard_capped boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_company_billing_updated on public.company_billing;
create trigger trg_company_billing_updated
before update on public.company_billing
for each row execute function public.set_updated_at();

-- ----------------------------
-- 5) Usage Aggregates (AI actions)
-- ----------------------------
create table if not exists public.ai_usage_aggregates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_key text not null, -- YYYY-MM
  actions_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, month_key)
);

drop trigger if exists trg_ai_usage_agg_updated on public.ai_usage_aggregates;
create trigger trg_ai_usage_agg_updated
before update on public.ai_usage_aggregates
for each row execute function public.set_updated_at();

create index if not exists idx_ai_usage_company_month on public.ai_usage_aggregates(company_id, month_key);

-- ----------------------------
-- 6) Operations (Loads + Assignments + Documents + Status)
-- ----------------------------
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

create index if not exists idx_loads_company on public.loads(company_id);

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

create index if not exists idx_assignments_company on public.assignments(company_id);
create index if not exists idx_assignments_load on public.assignments(load_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid references public.loads(id) on delete cascade,
  storage_path text not null,
  doc_type text not null default 'pod',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_docs_company on public.documents(company_id);

create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid not null references public.loads(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_company on public.status_events(company_id);

-- ----------------------------
-- 7) Comms (Threads + Messages)
-- ----------------------------
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_id uuid references public.loads(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_threads_company on public.threads(company_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_thread on public.messages(thread_id);

-- ----------------------------
-- 8) Audit Logs (Enterprise required)
-- ----------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  entity_type text,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_company_time on public.audit_logs(company_id, created_at desc);

-- Helper: log audit
create or replace function public.audit_log(
  p_company_id uuid,
  p_action public.audit_action,
  p_entity_type text,
  p_entity_id uuid,
  p_meta jsonb
) returns void language plpgsql as $$
begin
  if not public.is_member(p_company_id) then
    raise exception 'Not authorized';
  end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, meta)
  values (p_company_id, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_meta, '{}'::jsonb));
end $$;

-- ----------------------------
-- 9) RBAC Helper Functions
-- ----------------------------
create or replace function public.my_role(p_company_id uuid)
returns public.membership_role
language sql stable as $$
  select role
  from public.company_memberships
  where company_id = p_company_id and user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_member(p_company_id uuid)
returns boolean
language sql stable as $$
  select exists(select 1 from public.company_memberships where company_id = p_company_id and user_id = auth.uid())
$$;

create or replace function public.is_adminish(p_company_id uuid)
returns boolean
language sql stable as $$
  select exists(
    select 1 from public.company_memberships
    where company_id = p_company_id
      and user_id = auth.uid()
      and role in ('owner','admin')
  )
$$;

-- ----------------------------
-- 10) RLS Enable
-- ----------------------------
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_features enable row level security;
alter table public.company_billing enable row level security;
alter table public.ai_usage_aggregates enable row level security;
alter table public.loads enable row level security;
alter table public.assignments enable row level security;
alter table public.documents enable row level security;
alter table public.status_events enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

-- ----------------------------
-- 11) RLS Policies (Safe / Minimal / Enterprise-correct)
-- ----------------------------

-- Companies: members can read; only owner/admin can update
drop policy if exists "companies_read_member" on public.companies;
create policy "companies_read_member"
on public.companies for select
using (public.is_member(id));

drop policy if exists "companies_update_adminish" on public.companies;
create policy "companies_update_adminish"
on public.companies for update
using (public.is_adminish(id));

-- Memberships: members can read; only adminish can manage
drop policy if exists "memberships_read_member" on public.company_memberships;
create policy "memberships_read_member"
on public.company_memberships for select
using (public.is_member(company_id));

drop policy if exists "memberships_manage_adminish" on public.company_memberships;
create policy "memberships_manage_adminish"
on public.company_memberships for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

-- Features: adminish only
drop policy if exists "features_adminish_only" on public.company_features;
create policy "features_adminish_only"
on public.company_features for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

-- Billing: adminish read/update; members can read status only if you want (we keep adminish only)
drop policy if exists "billing_adminish_only" on public.company_billing;
create policy "billing_adminish_only"
on public.company_billing for all
using (public.is_adminish(company_id))
with check (public.is_adminish(company_id));

-- Usage: adminish read; server writes via service key (RLS bypass)
drop policy if exists "usage_adminish_read" on public.ai_usage_aggregates;
create policy "usage_adminish_read"
on public.ai_usage_aggregates for select
using (public.is_adminish(company_id));

-- Ops tables: members read/write; driver restrictions can be tightened later
drop policy if exists "loads_member_rw" on public.loads;
create policy "loads_member_rw"
on public.loads for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists "assignments_member_rw" on public.assignments;
create policy "assignments_member_rw"
on public.assignments for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists "documents_member_rw" on public.documents;
create policy "documents_member_rw"
on public.documents for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists "status_member_rw" on public.status_events;
create policy "status_member_rw"
on public.status_events for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists "threads_member_rw" on public.threads;
create policy "threads_member_rw"
on public.threads for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

drop policy if exists "messages_member_rw" on public.messages;
create policy "messages_member_rw"
on public.messages for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

-- Audit logs: adminish read only
drop policy if exists "audit_adminish_read" on public.audit_logs;
create policy "audit_adminish_read"
on public.audit_logs for select
using (public.is_adminish(company_id));
```

## C) Stripe Billing State Machine + Webhook Gating

**Webhook requirements (must listen to these)**

- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Server logic (authoritative mapping)**

- subscription active + invoice.paid → `billing_status=active`,
  `enable_ai=true`, `enable_checkout=true`
- invoice.payment_failed → `billing_status=past_due`, disable AI automation
- prolonged non-payment → set `suspended`
- canceled → set `canceled`

**Drop-in Node handler (express-ish)**

```ts
// PSEUDO-API: adapt to your Fly.io API or Next route.
// Needs: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function stripeWebhook(rawBody: string, sig: string) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    // In a real HTTP handler, respond with 400 for invalid signature
    console.error("Stripe webhook signature verification failed", err);
    return;
  }
  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;

    // Find company by stripe_customer_id
    const { data: billing } = await supabase
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", String(sub.customer))
      .maybeSingle();

    if (!billing?.company_id) return;

    const status =
      sub.status === "active"
        ? "active"
        : sub.status === "past_due"
          ? "past_due"
          : sub.status === "canceled"
            ? "canceled"
            : "trial";

    await supabase
      .from("company_billing")
      .update({
        status,
        stripe_subscription_id: sub.id,
        current_period_start:
          typeof sub.current_period_start === "number" &&
          sub.current_period_start > 0
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
        current_period_end:
          typeof sub.current_period_end === "number" &&
          sub.current_period_end > 0
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
      })
      .eq("company_id", billing.company_id);

    // Kill switches based on billing state
    await supabase
      .from("company_features")
      .update({
        enable_ai_automation: status === "active",
        enable_checkout: status !== "canceled",
      })
      .eq("company_id", billing.company_id);

    // Audit
    await supabase.rpc("audit_log", {
      p_company_id: billing.company_id,
      p_action: "billing.subscription_change",
      p_entity_type: "stripe.subscription",
      p_entity_id: null,
      p_meta: { stripe_status: sub.status, mapped_status: status },
    });

    return;
  }

  if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;

    const { data: billing } = await supabase
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", String(inv.customer))
      .maybeSingle();

    if (!billing?.company_id) return;

    await supabase
      .from("company_billing")
      .update({ status: "active" })
      .eq("company_id", billing.company_id);
    await supabase
      .from("company_features")
      .update({ enable_ai: true, enable_ai_automation: true })
      .eq("company_id", billing.company_id);
    return;
  }

  if (event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;

    const { data: billing } = await supabase
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", String(inv.customer))
      .maybeSingle();

    if (!billing?.company_id) return;

    await supabase
      .from("company_billing")
      .update({ status: "past_due" })
      .eq("company_id", billing.company_id);
    // keep read-only access, disable AI automation:
    await supabase
      .from("company_features")
      .update({ enable_ai_automation: false })
      .eq("company_id", billing.company_id);
    return;
  }
}
```

## D) Feature Flags + Kill Switches (Enforced)

**Where to enforce**

- API (authoritative): block actions if disabled
- UI should also hide buttons, but UI isn’t security.

**Enforcement snippet (use everywhere)**

```ts
// Before any AI/marketplace/checkout action:
const { data: features } = await supabase
  .from("company_features")
  .select("*")
  .eq("company_id", companyId)
  .single();

if (!features.enable_ai) throw new Error("AI is disabled for this company.");
if (!features.enable_ai_automation)
  throw new Error("AI automation paused due to billing/governance.");
if (!features.enable_marketplace) throw new Error("Marketplace not enabled.");
if (!features.enable_checkout) throw new Error("Checkout disabled.");
```

## E) AI Usage Governance (80% alert + 200% cap)

**Server-side authoritative function**

```ts
function monthKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function recordAiAction(companyId: string, qty = 1) {
  // load billing
  const billing = await supabase
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();
  if (!billing.data) throw new Error("No billing row.");

  if (billing.data.status !== "active") throw new Error("Billing not active.");
  if (billing.data.ai_hard_capped) throw new Error("Hard cap reached.");

  const mKey = monthKeyUTC();

  const current = await supabase
    .from("ai_usage_aggregates")
    .upsert(
      { company_id: companyId, month_key: mKey, actions_used: 0 },
      { onConflict: "company_id, month_key" },
    )
    .select("*")
    .single();

  const used = (current.data?.actions_used ?? 0) + qty;

  const hardCap =
    billing.data.ai_included * billing.data.ai_hard_cap_multiplier;
  const pct =
    billing.data.ai_included > 0 ? used / billing.data.ai_included : 0;

  // update aggregate
  await supabase
    .from("ai_usage_aggregates")
    .update({ actions_used: used })
    .eq("company_id", companyId)
    .eq("month_key", mKey);

  // 80% alert (log + notify hook)
  if (pct >= 0.8 && pct < 1) {
    await supabase.rpc("audit_log", {
      p_company_id: companyId,
      p_action: "ai.action.executed",
      p_entity_type: "ai.usage",
      p_entity_id: null,
      p_meta: { used, included: billing.data.ai_included, pct },
    });
  }

  // hard cap
  if (used >= hardCap) {
    await supabase
      .from("company_billing")
      .update({ ai_hard_capped: true })
      .eq("company_id", companyId);

    await supabase.rpc("audit_log", {
      p_company_id: companyId,
      p_action: "ai.action.blocked",
      p_entity_type: "ai.usage",
      p_entity_id: null,
      p_meta: { used, included: billing.data.ai_included, hardCap },
    });

    throw new Error("AI hard cap reached. Upgrade/approval required.");
  }

  return { used, included: billing.data.ai_included, pct };
}
```

## F) Deployment Parity & “One Source of Truth”

**Final deployment truth**

- DB/Auth/Storage: Supabase (only)
- API: Fly.io (only)
- Web: Pick ONE as production (Netlify or Vercel)
- The other becomes preview-only.

**Environment parity (required keys everywhere)**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `STRIPE_SECRET_KEY` (server-only)
- `STRIPE_WEBHOOK_SECRET` (server-only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (web)
- `AI_METERED_PRICE_ID`
- `INTELLIGENCE_ADDON_PRICE_ID`
- `NEXT_PUBLIC_APP_URL`
