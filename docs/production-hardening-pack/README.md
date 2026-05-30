# Supabase + Fly Production Hardening Pack

This pack adds a safe-first security hardening baseline for production rollout:

- `supabase/sql/001_supabase_security_hardening_safe.sql`  
  Locks down Stripe ingestion tables/views for internal-only access.
- `supabase/sql/002_supabase_audit_queries.sql`  
  Audits missing RLS policies and SECURITY DEFINER exposures.
- `scripts/run-recommended-production.sh`  
  Wrapper around existing deployment and verification scripts.
- `docs/production-hardening-pack/RUN_ORDER.md`  
  Ordered execution guide.

## Notes

- Keep `PORT=3000` and Fly `internal_port=3000` aligned.
- Do not expose server-side credentials to browser variables.
- Apply SQL scripts manually in authenticated Supabase SQL editor.
