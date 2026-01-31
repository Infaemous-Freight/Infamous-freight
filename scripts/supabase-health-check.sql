-- Supabase health check RPC and optional indexes
-- Usage: psql $DATABASE_URL < scripts/supabase-health-check.sql

-- 1) Health check RPC (call via POST /rest/v1/rpc/health_check or supabase.rpc('health_check'))
create or replace function public.health_check()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'ok', true,
    'time', now(),
    'db', current_database(),
    'role', current_user
  );
$$;

-- 2) Allow anon/authenticated to call it (recommended for uptime checks)
grant execute on function public.health_check() to anon, authenticated;

-- 3) Create recommended indexes only if the tables exist
do $$
begin
  -- auth tables (exist in Supabase projects with Auth)
  if to_regclass('auth.oauth_authorizations') is not null then
    execute 'create index if not exists idx_oauth_authorizations_client_id on auth.oauth_authorizations (client_id);';
    execute 'create index if not exists idx_oauth_authorizations_user_id on auth.oauth_authorizations (user_id);';
  end if;

  if to_regclass('auth.mfa_challenges') is not null then
    execute 'create index if not exists idx_mfa_challenges_factor_id on auth.mfa_challenges (factor_id);';
  end if;

  if to_regclass('auth.saml_relay_states') is not null then
    execute 'create index if not exists idx_saml_relay_states_flow_state_id on auth.saml_relay_states (flow_state_id);';
  end if;

  -- storage tables (exist in Supabase projects with Storage)
  if to_regclass('storage.s3_multipart_uploads_parts') is not null then
    execute 'create index if not exists idx_s3_parts_upload_id on storage.s3_multipart_uploads_parts (upload_id);';
    execute 'create index if not exists idx_s3_parts_bucket_id on storage.s3_multipart_uploads_parts (bucket_id);';
  end if;
end
$$;
