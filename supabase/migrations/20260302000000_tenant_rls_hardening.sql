-- Tenant RLS hardening for core freight entities

-- Ensure immutable SOC2 logs by revoking delete
revoke delete on table public.audit_logs from authenticated;
revoke delete on table public.audit_logs from anon;

-- Enable RLS for target tables when present
alter table if exists public.loads enable row level security;
alter table if exists public.brokers enable row level security;
alter table if exists public.invoices enable row level security;
alter table if exists public.users enable row level security;

-- Tenant-isolation policy based on per-request app.current_tenant setting
-- App middleware must execute: SET app.current_tenant = '<tenant-uuid>'
drop policy if exists tenant_isolation_loads on public.loads;
create policy tenant_isolation_loads on public.loads
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_brokers on public.brokers;
create policy tenant_isolation_brokers on public.brokers
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_invoices on public.invoices;
create policy tenant_isolation_invoices on public.invoices
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenant_isolation_users on public.users;
create policy tenant_isolation_users on public.users
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);
