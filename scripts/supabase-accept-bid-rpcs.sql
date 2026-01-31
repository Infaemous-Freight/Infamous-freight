-- ==========================================================
-- 100% RECOMMENDED: Atomic accept-bid RPC + status RPC
-- Single-transaction booking flow
-- ==========================================================

-- Safety: ensure gen_random_uuid exists (pgcrypto already enabled in your schema)
create extension if not exists "pgcrypto";

-- Atomic accept-bid function
create or replace function public.accept_bid_atomic(p_bid_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_bid record;
  v_load record;
  v_assignment_id uuid;
  v_thread_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock bid row
  select id, load_id, carrier_id, status
  into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'Bid not found';
  end if;

  if v_bid.status <> 'pending' then
    raise exception 'Bid is not pending (current: %)', v_bid.status;
  end if;

  -- Lock load row
  select id, shipper_id, status
  into v_load
  from public.loads
  where id = v_bid.load_id
  for update;

  if not found then
    raise exception 'Load not found';
  end if;

  -- Only shipper that owns the load can accept
  if v_load.shipper_id <> v_uid then
    raise exception 'Only load owner can accept bids';
  end if;

  if v_load.status <> 'open' then
    raise exception 'Load must be open to accept (current: %)', v_load.status;
  end if;

  -- Accept this bid
  update public.bids
  set status = 'accepted', updated_at = now()
  where id = v_bid.id and status = 'pending';

  if not found then
    raise exception 'Bid accept race condition (already changed)';
  end if;

  -- Reject all other pending bids
  update public.bids
  set status = 'rejected', updated_at = now()
  where load_id = v_bid.load_id
    and id <> v_bid.id
    and status = 'pending';

  -- Create assignment (load_id is unique in assignments)
  insert into public.assignments (load_id, carrier_id, status)
  values (v_bid.load_id, v_bid.carrier_id, 'assigned')
  returning id into v_assignment_id;

  -- Update load status
  update public.loads
  set status = 'booked', updated_at = now()
  where id = v_bid.load_id;

  -- Create coordination thread
  insert into public.threads (load_id, assignment_id, created_by)
  values (v_bid.load_id, v_assignment_id, v_uid)
  returning id into v_thread_id;

  -- Participants (shipper + carrier)
  insert into public.thread_participants (thread_id, user_id)
  values
    (v_thread_id, v_uid),
    (v_thread_id, v_bid.carrier_id)
  on conflict do nothing;

  -- System message
  insert into public.messages (thread_id, sender_id, kind, content)
  values (
    v_thread_id,
    v_uid,
    'system',
    '✅ Bid accepted. Use this thread to coordinate pickup, ETA, and delivery details.'
  );

  return jsonb_build_object(
    'ok', true,
    'bid_id', v_bid.id,
    'load_id', v_bid.load_id,
    'assignment_id', v_assignment_id,
    'thread_id', v_thread_id
  );
end $$;

-- IMPORTANT: Lock down who can execute
revoke all on function public.accept_bid_atomic(uuid) from public;
grant execute on function public.accept_bid_atomic(uuid) to authenticated;

-- ==========================================================
-- Safe assignment status update RPC
-- ==========================================================
create or replace function public.set_assignment_status(p_assignment_id uuid, p_status public.assignment_status)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_a record;
  v_shipper uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select id, load_id, carrier_id, status
  into v_a
  from public.assignments
  where id = p_assignment_id
  for update;

  if not found then
    raise exception 'Assignment not found';
  end if;

  select shipper_id into v_shipper
  from public.loads
  where id = v_a.load_id;

  -- allow carrier OR shipper OR admin to update
  if not (
    v_a.carrier_id = v_uid
    or v_shipper = v_uid
    or public.is_admin()
  ) then
    raise exception 'Not authorized to update assignment';
  end if;

  update public.assignments
  set status = p_status, updated_at = now()
  where id = p_assignment_id;

  return jsonb_build_object('ok', true, 'assignment_id', p_assignment_id, 'status', p_status);
end $$;

revoke all on function public.set_assignment_status(uuid, public.assignment_status) from public;
grant execute on function public.set_assignment_status(uuid, public.assignment_status) to authenticated;
