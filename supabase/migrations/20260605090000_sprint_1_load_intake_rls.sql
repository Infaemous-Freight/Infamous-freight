-- Sprint 1 Supabase schema and RLS for load intake automation.
-- Tables are tenant-scoped by carrier_id and locked to authenticated members of that carrier.

CREATE TABLE IF NOT EXISTS public.load_intakes (
  id TEXT PRIMARY KEY,
  carrier_id TEXT NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  load_id TEXT UNIQUE REFERENCES public.loads(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'api',
  status TEXT NOT NULL DEFAULT 'accepted',
  priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  priority_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispatcher_notification_queue (
  id TEXT PRIMARY KEY,
  carrier_id TEXT NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  load_id TEXT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  intake_id TEXT REFERENCES public.load_intakes(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS load_intakes_carrier_created_at_idx ON public.load_intakes (carrier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS load_intakes_carrier_priority_status_idx ON public.load_intakes (carrier_id, priority_level, status);
CREATE INDEX IF NOT EXISTS load_intakes_load_id_idx ON public.load_intakes (load_id);
CREATE INDEX IF NOT EXISTS dispatcher_notification_queue_carrier_status_available_idx ON public.dispatcher_notification_queue (carrier_id, status, available_at);
CREATE INDEX IF NOT EXISTS dispatcher_notification_queue_carrier_priority_created_idx ON public.dispatcher_notification_queue (carrier_id, priority_level, created_at DESC);
CREATE INDEX IF NOT EXISTS dispatcher_notification_queue_load_id_idx ON public.dispatcher_notification_queue (load_id);
CREATE INDEX IF NOT EXISTS dispatcher_notification_queue_intake_id_idx ON public.dispatcher_notification_queue (intake_id);

ALTER TABLE public.load_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatcher_notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS load_intakes_select_carrier_members ON public.load_intakes;
CREATE POLICY load_intakes_select_carrier_members ON public.load_intakes
  FOR SELECT TO authenticated
  USING (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS load_intakes_insert_dispatch_roles ON public.load_intakes;
CREATE POLICY load_intakes_insert_dispatch_roles ON public.load_intakes
  FOR INSERT TO authenticated
  WITH CHECK (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS dispatcher_notification_queue_select_dispatch_roles ON public.dispatcher_notification_queue;
CREATE POLICY dispatcher_notification_queue_select_dispatch_roles ON public.dispatcher_notification_queue
  FOR SELECT TO authenticated
  USING (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS dispatcher_notification_queue_insert_dispatch_roles ON public.dispatcher_notification_queue;
CREATE POLICY dispatcher_notification_queue_insert_dispatch_roles ON public.dispatcher_notification_queue
  FOR INSERT TO authenticated
  WITH CHECK (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS dispatcher_notification_queue_update_dispatch_roles ON public.dispatcher_notification_queue;
CREATE POLICY dispatcher_notification_queue_update_dispatch_roles ON public.dispatcher_notification_queue
  FOR UPDATE TO authenticated
  USING (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'dispatcher')
    )
  )
  WITH CHECK (
    carrier_id IN (
      SELECT tm.carrier_id
      FROM public.team_members tm
      WHERE lower(tm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'dispatcher')
    )
  );

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS load_intakes_updated_at ON public.load_intakes;
    CREATE TRIGGER load_intakes_updated_at
      BEFORE UPDATE ON public.load_intakes
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

    DROP TRIGGER IF EXISTS dispatcher_notification_queue_updated_at ON public.dispatcher_notification_queue;
    CREATE TRIGGER dispatcher_notification_queue_updated_at
      BEFORE UPDATE ON public.dispatcher_notification_queue
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END
$$;
