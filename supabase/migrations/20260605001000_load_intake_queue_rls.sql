-- Sprint 1 load intake RLS hardening for Supabase Data API exposure.
-- These policies are additive defense-in-depth for the Prisma-managed load intake tables.
-- Direct server-side Prisma access should continue to use DATABASE_URL with a server-only role.

DO $$
DECLARE
  has_auth_jwt boolean := to_regprocedure('auth.jwt()') IS NOT NULL;
BEGIN
  IF has_auth_jwt AND to_regclass('public."LoadIntakeNotificationQueue"') IS NOT NULL THEN
    ALTER TABLE public."LoadIntakeNotificationQueue" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS load_intake_notification_select_carrier ON public."LoadIntakeNotificationQueue";
    EXECUTE $policy$
      CREATE POLICY load_intake_notification_select_carrier ON public."LoadIntakeNotificationQueue"
        FOR SELECT TO authenticated
        USING (
          "carrierId" = COALESCE(
            (SELECT auth.jwt() -> 'app_metadata' ->> 'carrier_id'),
            (SELECT auth.jwt() -> 'app_metadata' ->> 'carrierId'),
            (SELECT auth.jwt() ->> 'carrier_id'),
            (SELECT auth.jwt() ->> 'carrierId')
          )
        )
    $policy$;
  END IF;

  IF has_auth_jwt AND to_regclass('public."LoadIntakeRetryQueue"') IS NOT NULL THEN
    ALTER TABLE public."LoadIntakeRetryQueue" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS load_intake_retry_select_carrier ON public."LoadIntakeRetryQueue";
    EXECUTE $policy$
      CREATE POLICY load_intake_retry_select_carrier ON public."LoadIntakeRetryQueue"
        FOR SELECT TO authenticated
        USING (
          "carrierId" = COALESCE(
            (SELECT auth.jwt() -> 'app_metadata' ->> 'carrier_id'),
            (SELECT auth.jwt() -> 'app_metadata' ->> 'carrierId'),
            (SELECT auth.jwt() ->> 'carrier_id'),
            (SELECT auth.jwt() ->> 'carrierId')
          )
        )
    $policy$;
  END IF;
END
$$;
