-- Infamous Freight: Supabase audit queries for common exposure paths.

-- 1) Tables with RLS enabled but no policies.
select
  n.nspname as schema_name,
  c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
  and c.relrowsecurity = true
  and not exists (
    select 1
    from pg_policy p
    where p.polrelid = c.oid
  )
order by 1, 2;

-- 2) SECURITY DEFINER functions executable by anon/authenticated.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef = true
  and n.nspname = 'public'
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
order by 1, 2;

-- 3) SECURITY DEFINER views in public.
select
  schemaname,
  viewname,
  viewowner,
  definition
from pg_views
where schemaname = 'public'
  and definition ilike '%security definer%'
order by 1, 2;
