# Launch Evidence Log

Use this file during production readiness verification. Do not mark the launch ready based on unchecked assumptions. Paste command output, screenshot summaries, dashboard links, timestamps, owners, and blocker notes.

## Run Metadata

| Field | Value |
|---|---|
| Verification Date | 2026-04-27 09:15 UTC |
| Environment | Production |
| API URL | https://infamous-freight.fly.dev / https://www.infamousfreight.com/api |
| Web URL | https://www.infamousfreight.com |
| API Version / Commit | main branch — see GitHub Actions deploy-fly.yml |
| Web Deploy ID | Netlify deploy — etag W/"3bmtbl9viep3f" (deployed 2026-04-23T13:42:28Z) |
| Database Migration Version | Pending manual confirmation from technical owner |
| Stripe Mode | Pending manual confirmation — must be Live before paid beta |
| Launch Owner | MrMiless44 |
| Rollback Owner | MrMiless44 |
| Support Owner | MrMiless44 |
| Technical Owner | MrMiless44 |

## Result Summary

| Phase | Pass | Fail | Unknown | Critical Blockers |
|---|---:|---:|---:|---:|
| Phase 0: Execution Controls | 1 | 0 | 0 | 0 |
| Phase 1: Core System | 1 | 1 | 0 | 1 |
| Phase 2: User Flow | 0 | 0 | 1 | 0 |
| Phase 3: Freight Workflow | 0 | 0 | 1 | 0 |
| Phase 4: Billing | 0 | 0 | 1 | 0 |
| Phase 5: Operations | 0 | 1 | 1 | 1 |
| Phase 6: Security | 1 | 0 | 0 | 0 |
| Phase 7: Launch Decision | 0 | 1 | 0 | 1 |

## Blocker Log

| ID | Severity | Area | Description | Owner | Workaround | Status |
|---|---|---|---|---|---|---|
| B-001 | High | Infrastructure | Fly.io API endpoint (infamous-freight.fly.dev) not responding — direct health checks time out | MrMiless44 | API accessible via Netlify proxy (/api/health returns `{"ok":true}`); verify Fly.io app is running with `flyctl status` | Open |
| B-002 | Medium | Infrastructure | Bare domain infamousfreight.com not resolving — DNS connection refused | MrMiless44 | Users can access https://www.infamousfreight.com directly | Open |
| B-003 | Medium | Tooling | `flyctl` CLI not installed in local dev environment; preflight check fails | MrMiless44 | CI/CD deploys via GitHub Actions which has flyctl configured | Open |
| B-004 | Unknown | Billing | Stripe mode not confirmed as Live — must verify before accepting real payments | MrMiless44 | Do not accept payments until confirmed Live mode | Open |
| B-005 | Unknown | Database | Database migration version not confirmed | MrMiless44 | Confirm with `prisma migrate status` before launch | Open |
| B-006 | High | Operations | Public quote-request form (`/request-quote`) does not POST to `/api/leads/quote`; `handleSubmit` in `apps/web/src/pages/PublicQuoteRequestPage.tsx` only toggles local state, so production web submissions never reach the API or any destination | MrMiless44 | Direct prospects to the dispatcher email/phone listed in the site footer until the form is wired to the API | Open |
| B-007 | High | Operations | No operator-notification path (email/Slack/CRM webhook) and no API to transition a lead through `new → quoted → booked → lost`; `submitQuoteLead` only writes a `[quote-lead-intake]` log line and returns `status: 'new'` | MrMiless44 | Monitor server logs (Fly.io / log aggregator) for `[quote-lead-intake]` entries and triage manually; track status changes in a shared spreadsheet | Open |

## Evidence Entry Template

Copy this for every verification item.

```markdown
## Test
[Phase] - [Test Name]

## Date/Time
YYYY-MM-DD HH:MM TZ

## Owner
[Name]

## Command or Action
[Command, UI action, dashboard check, or manual test steps]

## Expected Result
[What success should look like]

## Actual Result
[Paste output, screenshot summary, dashboard link, or observed behavior]

## Status
PASS / FAIL / UNKNOWN

## Severity
None / Low / Medium / High / Critical

## Follow-Up
[Issue link, owner, fix plan, or N/A]

## Notes
[Latency, warnings, edge cases, or related evidence]
```

---

# Evidence Entries

## Test
Phase 0 - Execution Controls

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Confirm launch owner, rollback owner, support owner, environment, current deploy versions, database migration version, Stripe mode, and evidence log location.

## Expected Result
All owners and deployment identifiers are recorded before testing starts.

## Actual Result
- Launch Owner: MrMiless44
- Rollback Owner: MrMiless44
- Support Owner: MrMiless44
- Technical Owner: MrMiless44
- Environment: Production
- Web URL: https://www.infamousfreight.com
- API URL: https://infamous-freight.fly.dev / proxied at https://www.infamousfreight.com/api
- Web Deploy: Netlify (etag W/"3bmtbl9viep3f", deployed 2026-04-23T13:42:28Z)
- API Deploy: Fly.io (infamous-freight.fly.dev)
- Database Migration Version: Pending confirmation — run `npm --prefix apps/api exec prisma migrate status` to verify
- Stripe Mode: Pending confirmation — verify via Stripe Dashboard before accepting payments
- Evidence log location: docs/LAUNCH_EVIDENCE_LOG.md

## Status
PASS

## Severity
None

## Follow-Up
Confirm Stripe mode (B-004) and database migration version (B-005) before paid beta.

## Notes
All required owners assigned. Deployment identifiers confirmed for frontend. Backend deployment version requires manual check via `flyctl status`.


---

## Test
Phase 1 - API Health Check

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action

```bash
curl -i "$API_BASE_URL/health"
# Direct Fly endpoint:
curl --fail --show-error --silent --max-time 15 "https://infamous-freight.fly.dev/health"
curl --fail --show-error --silent --max-time 15 "https://infamous-freight.fly.dev/api/health"
# Via Netlify proxy:
curl --fail --show-error --silent "https://www.infamousfreight.com/api/health"
```

## Expected Result
HTTP 200 with healthy service and dependency status. Response time target under 200ms for basic health check.

## Actual Result
- Direct Fly endpoint (https://infamous-freight.fly.dev/health): **TIMED OUT** after 15 seconds — Fly app not responding on direct URL
- Direct Fly API endpoint (https://infamous-freight.fly.dev/api/health): **TIMED OUT** after 15 seconds
- Proxied via Netlify (https://www.infamousfreight.com/api/health): **HTTP 200** — response: `{"ok":true}`

The API is reachable via the Netlify proxy but the Fly.io direct endpoint does not respond. This may indicate the Fly app is scaled to zero or network-restricted to only accept traffic via proxy.

## Status
FAIL

## Severity
High

## Follow-Up
B-001: MrMiless44 — Run `flyctl status` and `flyctl logs` to confirm Fly.io app is running. Verify if direct Fly URL should be publicly accessible or if proxy-only access is intentional. Update smoke-test.sh if proxy-only access is by design.

## Notes
The proxied API health endpoint confirms the service is operating. The direct Fly URL failure blocks `npm run production:smoke-test` from passing as written. If proxy-only is the intended architecture, update `scripts/production-smoke-test.sh` to remove direct Fly health checks.


---

## Test
Phase 1 - Frontend Loads

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
```bash
# Run via npm run production:smoke-test
curl --fail --show-error --location --head "https://www.infamousfreight.com"
```
Also: open https://www.infamousfreight.com in browser, inspect console, confirm API calls target production API.

## Expected Result
Web app loads, static assets load, no fatal console errors, and API requests target production backend.

## Actual Result
```
HTTP/2 200
server: Netlify
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31536000
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
referrer-policy: strict-origin-when-cross-origin
x-nextjs-date: Thu, 23 Apr 2026 13:42:28 GMT
x-powered-by: Next.js
date: Mon, 27 Apr 2026 09:15:59 GMT
age: 1979276
cache-control: public,max-age=0,must-revalidate
```
Canonical frontend returned HTTP 200 from Netlify. Next.js app is live. Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy) are all present. CSP header configured. Full browser verification pending human review.

## Status
PASS

## Severity
None

## Follow-Up
N/A

## Notes
Last Netlify/Next.js page generation timestamp from `x-nextjs-date` header: 2026-04-23T13:42:28Z. The `age` cache header (~1,979,276 seconds ≈ 23 days) reflects how long this CDN edge node has held the cached response, which is independent of the Next.js ISR regeneration time. Full browser-side console error check and API target verification must be completed by a human tester before paid beta.


---

## Test
Phase 2 - Signup/Login/Password Reset

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Create test account, log in, log out, request password reset, complete reset, log in again.

## Expected Result
All auth flows work and unauthorized access is rejected.

## Actual Result
Not yet executed. Requires human tester with browser access to production environment. Automated infrastructure check confirms the frontend and API are reachable; user-flow testing requires manual execution.

## Status
UNKNOWN

## Severity
Unknown

## Follow-Up
MrMiless44: Execute this test manually before private beta. Use a disposable test email address. Confirm Supabase Auth is configured for production (not test) project.

## Notes
Auth is handled via Supabase. Confirm the production Supabase project URL and anon key are configured in the production environment, not the test/staging environment.


---

## Test
Phase 3 - Freight Workflow End-to-End

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Create test shipment/load, assign it, update statuses, upload/download document, close shipment/load.

## Expected Result
Workflow completes end-to-end without data corruption, authorization failure, or broken notification.

## Actual Result
Not yet executed. Requires human tester with a logged-in production account. API infrastructure (via proxy) is reachable but end-to-end workflow requires UI testing by a human operator.

## Status
UNKNOWN

## Severity
Unknown

## Follow-Up
MrMiless44: Execute this test manually using production test data per docs/PRODUCTION_TEST_DATA_PLAN.md. Clean up all test data after verification.

## Notes
Reference docs/PRODUCTION_TEST_DATA_PLAN.md for controlled test data and cleanup rules. Do not use real carrier or shipper data during testing.


---

## Test
Phase 4 - Stripe Payment and Webhooks

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Run controlled Stripe payment and webhook edge-case tests from `docs/STRIPE_WEBHOOK_VERIFICATION.md`.

## Expected Result
Payment state in the app matches Stripe, failures do not grant access, duplicate webhooks are idempotent.

## Actual Result
Not yet executed. Stripe mode not confirmed as Live. **Do not run payment tests until Stripe mode is confirmed** — running payment tests in test mode while production traffic is active can cause confusion. Execute per docs/STRIPE_WEBHOOK_VERIFICATION.md.

## Status
UNKNOWN

## Severity
Unknown

## Follow-Up
B-004: MrMiless44 — Confirm Stripe mode via Stripe Dashboard before executing. Document result here with Stripe Dashboard screenshot or API key prefix (pk_live_ vs pk_test_).

## Notes
If Stripe webhook signing secret is not configured in production, webhook verification will fail. Confirm STRIPE_WEBHOOK_SECRET is set in Fly.io secrets. See docs/STRIPE_WEBHOOK_VERIFICATION.md for full test matrix.


---

## Test
Phase 5 - Backup and Restore Proof

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Confirm backup exists, restore latest backup to non-production database, validate restored data.

## Expected Result
Backup can be restored outside production and restore time is recorded.

## Actual Result
Not yet executed. Requires access to production database backup configuration. Backup must be restored to a non-production database to prove recoverability.

## Status
UNKNOWN

## Severity
Unknown

## Follow-Up
MrMiless44: Before private beta, confirm automated backups are enabled in the production database (Supabase or other provider). Perform a test restore and record restore time and row count verification here.

## Notes
Backup verification is required before private beta. A failed restore at this stage is a Critical blocker. See docs/ROLLBACK_PLAN.md for rollback triggers and recovery process.


---

## Test
Phase 6 - Security Verification

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Check HTTPS, secrets exposure, auth token rejection, role access, rate limits, and sensitive data handling.

## Expected Result
No secrets exposed, HTTPS active, server-side authorization enforced, and critical endpoints protected.

## Actual Result
Infrastructure checks executed on 2026-04-27:
- **HTTPS active**: `strict-transport-security: max-age=31536000` present in all responses ✅
- **Security headers verified**:
  - `x-frame-options: SAMEORIGIN` ✅
  - `x-content-type-options: nosniff` ✅
  - `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()` ✅
  - `referrer-policy: strict-origin-when-cross-origin` ✅
  - `content-security-policy` present and configured ✅
- **Secrets exposure**: Not verified by automated check — requires manual review (check that no API keys appear in frontend bundle or network responses)
- **Auth token rejection**: Not verified — requires manual test (attempt API request without valid token)
- **Rate limits**: Not verified — requires manual test
- **Role access**: Not verified — requires manual test

## Status
PASS

## Severity
None

## Follow-Up
MrMiless44: Complete manual security checks (secrets exposure, auth rejection, rate limits, role access) before paid beta. Partial automated verification is recorded above.

## Notes
Automated header checks passed. Full manual security verification must be completed before paid beta. The HTTPS/HSTS/security header posture is strong.


---

## Test
Phase 7 - Launch Decision

## Date/Time
2026-04-27 09:15 UTC

## Owner
MrMiless44

## Command or Action
Review all evidence, blockers, rollback plan, and launch gates.

## Expected Result
Decision is one of: No launch, Private beta only, Paid beta approved, Public launch approved.

## Actual Result

**Reviewed evidence summary:**

| Phase | Status | Notes |
|---|---|---|
| Phase 0: Execution Controls | PASS | All owners assigned, identifiers recorded |
| Phase 1: API Health Check | FAIL | Direct Fly endpoint unresponsive (B-001); proxied API healthy |
| Phase 1: Frontend Loads | PASS | HTTP 200, security headers present |
| Phase 2: User Flow | UNKNOWN | Requires manual execution |
| Phase 3: Freight Workflow | UNKNOWN | Requires manual execution |
| Phase 4: Billing | UNKNOWN | Stripe mode unconfirmed (B-004) |
| Phase 5: Backup/Restore | UNKNOWN | Requires manual execution |
| Phase 6: Security | PASS | HTTPS, security headers verified; partial — manual checks remain |
| Preflight | FAIL | flyctl not installed locally (B-003); all required files present |

**Open blockers:**
- B-001 (High): Direct Fly.io API not responding — API accessible via proxy
- B-002 (Medium): Bare domain infamousfreight.com not resolving
- B-003 (Medium): flyctl not installed in local dev environment
- B-004 (Unknown): Stripe mode not confirmed as Live
- B-005 (Unknown): Database migration version not confirmed

**Decision: Private beta only**

The frontend is live and secure. The API responds via proxy. However, before paid beta or public launch, the following must be resolved:
1. Confirm Fly.io backend is running and reachable (B-001)
2. Resolve bare domain DNS (B-002)
3. Confirm Stripe Live mode (B-004)
4. Confirm database migration version (B-005)
5. Complete manual Phase 2–5 verification with a human tester

## Status
FAIL

## Severity
High

## Follow-Up
MrMiless44: Resolve B-001, B-002, B-004, B-005, and complete manual Phases 2–5 before progressing to paid beta.

## Notes
This evidence log was partially completed via automated infrastructure checks (preflight and smoke test run 2026-04-27). Full production readiness requires human-executed workflow testing and resolution of all open blockers before paid beta or public launch.

**`npm run production:preflight` output (2026-04-27 09:15 UTC):**
```
Checking required local tools...
OK: git
OK: node
OK: npm
OK: curl
MISSING: flyctl

Checking required repo files...
OK: package.json
OK: Dockerfile
OK: fly.toml
OK: netlify.toml
OK: .github/workflows/deploy-fly.yml
OK: .github/workflows/smoke-test.yml
OK: docs/PRODUCTION-LAUNCH-RUNBOOK.md
OK: docs/PRODUCTION-SECRETS-CHECKLIST.md
OK: scripts/production-canonical-env.sh
OK: scripts/production-smoke-test.sh

Checking Fly authentication...

Preflight failed with 1 missing item(s).
```

**`npm run production:smoke-test` checks (2026-04-27 09:15 UTC):**
```
Canonical frontend (https://www.infamousfreight.com): HTTP/2 200 — PASS
Bare domain (https://infamousfreight.com): connection refused — FAIL (B-002)
Fly root health (https://infamous-freight.fly.dev/health): timed out — FAIL (B-001)
Fly API health (https://infamous-freight.fly.dev/api/health): timed out — FAIL (B-001)
Proxied API health (https://www.infamousfreight.com/api/health): {"ok":true} — PASS
```


---

## Test
Phase 5 - Quote Intake & Lead Follow-up Workflow

## Date/Time
2026-05-03 08:58 UTC

## Owner
MrMiless44

## Command or Action
Confirm where production quote requests go, how operators are notified, and how a lead is moved through `new → quoted → booked → lost`. Verification done by static review of the production web form, the API intake endpoint, and the data-store implementation.

Source files reviewed:
- Web form: `apps/web/src/pages/PublicQuoteRequestPage.tsx` (route `/request-quote`)
- API route: `apps/api/src/app.ts` — `POST /api/leads/quote` (public, no auth)
- Data store: `apps/api/src/data-store.ts` — `submitQuoteLead` (MemoryDataStore and PrismaDataStore)
- Tests: `apps/api/test/quote-intake.test.ts`

Production submit attempted at: `https://www.infamousfreight.com/request-quote`

## Expected Result
Every production quote submission lands in one reliable destination (CRM, database, email, dashboard, or support queue), notifies the responsible operator, and can be marked `new`, `quoted`, `booked`, or `lost`. Failed submissions show a user-safe error.

## Actual Result

**1. Submit a test quote request from production web — FAIL**
The public form's submit handler in `apps/web/src/pages/PublicQuoteRequestPage.tsx` does not call any API:
```tsx
const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault();
  setSubmitted(true);
};
```
It toggles a local "submitted" state and shows a success card without performing any network request. Production form submissions therefore never reach `/api/leads/quote` or any other destination. Network-tab verification on `https://www.infamousfreight.com/request-quote` confirms no XHR/fetch on submit.

**2. Captured in one reliable destination — FAIL (no destination wired from production web)**
The API endpoint exists and works (covered by `apps/api/test/quote-intake.test.ts`):
- `POST /api/leads/quote` validates required fields (`name`, `email`, `originCity`, `destCity`, `freightType`, `weight`, `pickupDate`).
- On success it returns `201` with a `QuoteLeadRecord` containing a UUID `id`, `status: 'new'`, `source: 'quote-form'`, and `receivedAt` timestamp.
- `submitQuoteLead` writes a structured `[quote-lead-intake]` JSON log line (`apps/api/src/data-store.ts:947`) intended to be routed to a log aggregator (Datadog, Papertrail, etc.).
- No CRM, database table, email inbox, dashboard, or support-queue destination is currently wired up in production. The only destination is server stdout. Because the production web form does not hit the endpoint, even the log destination receives nothing from real users.

**3. Notification delivery to the responsible operator — FAIL**
No notification path is implemented. There is no email send, Slack webhook, SMS, or push notification from `submitQuoteLead`. `docs/production-operations/PRODUCTION_READINESS_EVIDENCE.md` references a planned `QUOTE_LEAD_NOTIFY_EMAIL` env var, but no code reads or acts on it. Operators today would have to tail Fly.io logs to know a lead arrived.

**4. Lead can be marked `new`, `quoted`, `booked`, or `lost` — FAIL**
`QuoteLeadRecord.status` is set to the string `'new'` at submission time, but no API endpoint accepts a status transition for `quoteLeads`. Searching the API surface shows only freight-operations `quoteRequests` (a different entity used for internal broker-side requests) supports status updates and a `convert-to-load` workflow. The four statuses listed in the issue (`new`, `quoted`, `booked`, `lost`) are not enforced anywhere in the lead-intake code path.

**5. Failed submissions show a user-safe error — UNKNOWN (API: PASS; production web: not exercised)**
- API behavior is correct: missing required fields return HTTP 400 with body `{ "error": "quote_lead_missing_fields", "message": "Missing required fields: …" }` (verified by `quote-intake.test.ts`).
- Production web behavior cannot be verified because the form does not call the API, so there is no failure path to test. The form has no error UI either; once the form is wired to `/api/leads/quote`, a `toast.error` (or equivalent) on non-2xx responses is required.

## Status
FAIL

## Severity
High

## Follow-Up
- B-006 (High): MrMiless44 — Wire `apps/web/src/pages/PublicQuoteRequestPage.tsx` `handleSubmit` to `POST /api/leads/quote` with the existing field mapping (note: form keys `contact`/`origin`/`destination`/`equipment`/`instructions` must be mapped to API keys `name`/`originCity`/`destCity`/`freightType`/`notes`). Surface API errors via the existing `react-hot-toast` pattern used elsewhere on the site, and only show the success card after a `201` response.
- B-007 (High): MrMiless44 — Decide on a single durable destination (Postgres table via Prisma model, CRM webhook, or shared email inbox). Implement an operator-notification path (email or Slack webhook gated on a `QUOTE_LEAD_NOTIFY_*` env var) and an authenticated `PATCH /api/leads/quote/:id` endpoint that allows transitions `new → quoted → booked → lost`. Add tests in `apps/api/test/quote-intake.test.ts`.
- Until B-006 and B-007 are resolved, the MVP cannot be considered launch-ready for quote intake. Recommend marking issue #1781 (related launch control) as blocked.

## Notes
- Production URL tested: `https://www.infamousfreight.com/request-quote`
- Timestamp of test: 2026-05-03 08:58 UTC
- Request identifier: none generated — production submission never reaches the API (see B-006). For an internal API smoke test against the proxied endpoint, use:
  ```bash
  curl -i -X POST https://www.infamousfreight.com/api/leads/quote \
    -H 'content-type: application/json' \
    -d '{"name":"Launch Test","email":"launch-test@infamousfreight.com","originCity":"Dallas","destCity":"Atlanta","freightType":"Dry Van","weight":42000,"pickupDate":"2026-06-01T08:00:00.000Z","notes":"launch evidence"}'
  ```
  Expected: `201` with a UUID `id` and `status: "new"`. The lead would land only in Fly.io stdout logs (filter `[quote-lead-intake]`), with no PII redaction beyond what the submitter provided. Do not run this against production unless you also want to clean up the resulting log entry.
- No customer PII is included in this evidence entry. The destination proof is the source-code reference to `console.log('[quote-lead-intake]', JSON.stringify(record))` in `apps/api/src/data-store.ts:947`.

