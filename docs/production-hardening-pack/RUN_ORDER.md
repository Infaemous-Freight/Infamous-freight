# Production Hardening Run Order

1. Ensure ops package files are present (`scripts`, `supabase/sql`, `docs`).
2. Run deployment automation wrapper:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/run-recommended-production.sh --apply --deploy
   ```
3. Configure frontend public environment values via hosting scripts.
4. Apply Supabase SQL hardening in SQL Editor:
   - `supabase/sql/001_supabase_security_hardening_safe.sql`
   - `supabase/sql/002_supabase_audit_queries.sql`
5. Enable Supabase leaked password protection in dashboard.
6. Verify API liveness endpoint:
   ```bash
   curl -i https://infamous-freight-api.fly.dev/api/health/live
   ```
