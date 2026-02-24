-- Tenant RLS hardening for core freight entities

-- Ensure immutable SOC2 logs by revoking delete
revoke delete on table public.audit_logs from authenticated;
revoke delete on table public.audit_logs from anon;

-- Enable RLS for target tables when present
alter table if exists public.loads enable row level security;
alter table if exists public.brokers enable row level security;
alter table if exists public.invoices enable row level security;
alter table if exists public.users enable row level security;

-- Tenant-isolation policy based on per-request app.current_tenant setting.
-- App middleware must execute: SET app.current_tenant = '<tenant-uuid>'.
-- If app.current_tenant is not set, current_setting('app.current_tenant', true)
-- returns NULL and these policies will filter out all rows (fail closed).
-- Ensure application monitoring/alerting for repeated queries where the tenant
-- context is missing to detect middleware/configuration issues.

drop policy if exists tenant_isolation_loads on public.loads;
create policy tenant_isolation_loads on public.loads
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Allow trusted service_role full access to loads for administrative tasks,
-- bypassing tenant isolation while keeping strict RLS for other roles.
drop policy if exists tenant_admin_bypass_loads on public.loads;
create policy tenant_admin_bypass_loads on public.loads
for all
  to service_role
using (true)
with check (true);

drop policy if exists tenant_isolation_brokers on public.brokers;
create policy tenant_isolation_brokers on public.brokers
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Admin bypass for brokers table: service_role is not constrained by tenant_id.
drop policy if exists tenant_admin_bypass_brokers on public.brokers;
create policy tenant_admin_bypass_brokers on public.brokers
for all
  to service_role
using (true)
with check (true);

drop policy if exists tenant_isolation_invoices on public.invoices;
create policy tenant_isolation_invoices on public.invoices
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Admin bypass for invoices table: service_role is not constrained by tenant_id.
drop policy if exists tenant_admin_bypass_invoices on public.invoices;
create policy tenant_admin_bypass_invoices on public.invoices
for all
  to service_role
using (true)
with check (true);

drop policy if exists tenant_isolation_users on public.users;
create policy tenant_isolation_users on public.users
for all
using (tenant_id = current_setting('app.current_tenant', true)::uuid)
with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Admin bypass for users table: service_role is not constrained by tenant_id.
drop policy if exists tenant_admin_bypass_users on public.users;
create policy tenant_admin_bypass_users on public.users
for all
  to service_role
using (true)
with check (true);
