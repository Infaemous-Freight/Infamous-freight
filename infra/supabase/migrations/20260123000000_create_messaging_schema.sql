create extension if not exists "pgcrypto";

create or replace function public.ensure_policy(
  policy_name text,
  target_table regclass,
  command text,
  role_name text,
  using_expression text default null,
  check_expression text default null
) returns void
language plpgsql
as $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = case
        when position('.' in target_table::text) > 0
          then split_part(target_table::text, '.', 2)
        else target_table::text
      end
      and policyname = policy_name
  ) then
    execute format('drop policy %I on %s', policy_name, target_table);
  end if;

  execute format(
    'create policy %I on %s for %s to %s %s %s',
    policy_name,
    target_table,
    command,
    role_name,
    case
      when using_expression is null or using_expression = '' then ''
      else format('using (%s)', using_expression)
    end,
    case
      when check_expression is null or check_expression = '' then ''
      else format('with check (%s)', check_expression)
    end
  );
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.thread_summaries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null unique,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_thread_id_created_at_idx on public.messages (thread_id, created_at desc);
create index if not exists messages_user_id_created_at_idx on public.messages (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.thread_summaries enable row level security;

select public.ensure_policy(
  'users_select_self',
  'public.users',
  'select',
  'authenticated',
  'id = auth.uid()',
  null
);

select public.ensure_policy(
  'users_insert_self',
  'public.users',
  'insert',
  'authenticated',
  null,
  'id = auth.uid()'
);

select public.ensure_policy(
  'users_update_self',
  'public.users',
  'update',
  'authenticated',
  'id = auth.uid()',
  'id = auth.uid()'
);

select public.ensure_policy(
  'messages_select_thread_participant',
  'public.messages',
  'select',
  'authenticated',
  'exists (select 1 from public.messages m2 where m2.thread_id = messages.thread_id and m2.user_id = auth.uid())',
  null
);

select public.ensure_policy(
  'messages_insert_self',
  'public.messages',
  'insert',
  'authenticated',
  null,
  'user_id = auth.uid() and (not exists (select 1 from public.messages m_existing where m_existing.thread_id = messages.thread_id) or exists (select 1 from public.messages m_existing where m_existing.thread_id = messages.thread_id and m_existing.user_id = auth.uid()))'
);

select public.ensure_policy(
  'messages_update_self',
  'public.messages',
  'update',
  'authenticated',
  'user_id = auth.uid()',
  'user_id = auth.uid()'
);

select public.ensure_policy(
  'messages_delete_self',
  'public.messages',
  'delete',
  'authenticated',
  'user_id = auth.uid()',
  null
);

select public.ensure_policy(
  'thread_summaries_select_thread_participant',
  'public.thread_summaries',
  'select',
  'authenticated',
  'exists (select 1 from public.messages m2 where m2.thread_id = thread_summaries.thread_id and m2.user_id = auth.uid())',
  null
);
