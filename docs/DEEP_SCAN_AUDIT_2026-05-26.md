# Deep Scan Audit & Recommendations — Infamous Freight (2026-05-26)

## Operating Loop

### 1) Discover
Audit focused on deployment safety, runtime consistency, Supabase env hygiene, and health-check semantics for `infamous-freight-api`.

Commands used:
- `rg -n "SUPABASE_DATABASE_URL|VITE_SUPABASE_DATABASE_URL|PUBLIC_SUPABASE_DATABASE_URL|NEXT_PUBLIC_SUPABASE_DATABASE_URL|createClient\(|/api/health/live|SUPABASE_JWT_SECRET|JWT_SECRET|internal_port|PORT=3000|apps/api/dist/src/server.js"`
- `sed -n '1,220p' fly.toml`
- `sed -n '1,220p' Dockerfile`

### 2) Build (Findings)

#### A. Fly runtime contract is currently aligned (low risk)
- `fly.toml` uses `app = "infamous-freight-api"` and `http_service.internal_port = 3_000` (numeric equivalent of `3000`).
- Fly health check path is `/api/health/live`.
- Process command is `node apps/api/dist/src/server.js`.
- Dockerfile runtime keeps `ENV PORT=3000`, `EXPOSE 3000`, and `CMD ["node", "apps/api/dist/src/server.js"]`.

**Assessment:** current Fly and Docker contracts match required production constraints.

#### B. Supabase client env safety guard exists (low risk)
- `scripts/check-supabase-client-env.sh` explicitly blocks client-side `*_SUPABASE_DATABASE_URL` variables and advises `SUPABASE_URL` / `VITE_SUPABASE_URL`.

**Assessment:** guardrail is present and aligned with your policy.

#### C. Liveness/readiness semantics are documented and partially enforced (medium risk)
- `/api/health/live` usage is widespread across scripts and docs.
- There are many operational scripts; drift risk grows when endpoint behavior evolves.

**Assessment:** liveness guidance is strong, but breadth of duplicated checks increases long-term maintenance risk.

#### D. Secret model is consistent but dual-key paths remain (medium risk)
- API app enforces `SUPABASE_JWT_SECRET` or `JWT_SECRET` in production trusted mode.
- Multiple scripts/docs still support either key, which is operationally flexible but can create ambiguity during incident response.

**Assessment:** secure baseline exists; standardization toward `SUPABASE_JWT_SECRET` as primary would reduce operator error.

### 3) Verify

Recommended verification commands (run in authenticated terminal where needed):

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
pnpm run test
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

### 4) Optimize (Actionable recommendations)

1. **Normalize fly.toml formatting for operator clarity**
   - Keep value semantic-equivalent but switch `internal_port = 3_000` to `internal_port = 3000` to match policy wording and avoid visual mismatch during audits.
   - **Risk:** none (format-only).
   - **Fallback:** revert single-line change.

2. **Reduce health-check duplication drift**
   - Add one canonical shell include (or script) for health URLs and status assertions, and source it from multiple deploy scripts.
   - **Risk:** medium if refactor is broad.
   - **Fallback:** incremental adoption (one script at a time).

3. **Pin incident-response precedence for JWT secret**
   - In ops docs/runbooks, explicitly state: "Use `SUPABASE_JWT_SECRET` first; `JWT_SECRET` only fallback for legacy modes."
   - **Risk:** low; documentation-only.
   - **Fallback:** keep existing dual-path while adding warning callouts.

4. **Add CI gate for forbidden public Supabase DB env names**
   - Run `scripts/check-supabase-client-env.sh` in CI on PRs touching env/docs/config.
   - **Risk:** low; may catch pre-existing drift.
   - **Fallback:** start as non-blocking check, then enforce.

5. **Fly deployment reconciliation playbook hardening**
   - Ensure all split-deploy recovery examples use `--strategy rolling --max-concurrent 1`.
   - **Risk:** low; docs/script consistency.
   - **Fallback:** no-op for single-machine apps.

### 5) Scale (Next 2 small reversible tasks)

- **Task 1 (docs-only):** standardize runbooks to explicitly distinguish liveness (`/api/health/live`) vs readiness (`/api/health` or `/api/health/ready`) and fallback-mode interpretation.
- **Task 2 (CI-only):** add a lightweight audit job running:
  - `pnpm run env:check:supabase-client`
  - `scripts/check-fly-docker-config.sh`

Both tasks are low-risk, reversible, and improve deploy reliability without weakening security.

## Root-cause summary (likely)
Most potential incidents here are likely to come from **configuration drift** (scripts/docs/env expectations diverging), not core API runtime logic. Existing runtime defaults look aligned; the main opportunity is consolidation and enforcement.
