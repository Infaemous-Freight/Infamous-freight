<p align="center">
  <a href="https://infamousfreight.com" target="_blank" rel="noopener noreferrer">
    <img src="/docs/screenshots/infamousfreight-header.svg" alt="Infamous Freight" width="100%">
  </a>
</p>

# Production Readiness Verification Guide

Status: Ready for verification. Not approved for public launch until all critical checks pass.

This guide converts the launch recommendations into an execution-grade verification process. Use it before private beta, paid beta, and public launch.

## Launch Principle

Do not treat documentation as proof of readiness. Readiness is proven only by executed tests, pasted evidence, named owners, and blocker decisions.

## Required Output

Every verification run must produce:

- Completed checklist results
- Evidence entries in `docs/LAUNCH_EVIDENCE_LOG.md`
- Documented blockers or explicit `No blockers found`
- Named launch owner
- Named rollback owner
- Final go/no-go decision

## Severity Model

| Severity | Definition | Launch Decision |
|---|---|---|
| Critical | Breaks auth, freight workflow, billing, data integrity, security, or recovery | No launch |
| High | Major user or operator impact with workaround available | Private beta only if workaround is documented |
| Medium | Limited impact or non-critical degraded experience | Launch allowed if documented and assigned |
| Low | Cosmetic, copy, analytics, or minor UX issue | Launch allowed |
| Unknown | Test skipped, not reproducible, or unclear result | Treat as failed until verified |

## Critical Launch Blockers

Any item below blocks paid beta and public launch:

- Users cannot sign up or log in
- Password reset fails
- Role permissions allow unauthorized access
- Shipment/load creation fails
- Assignment workflow fails
- Status updates fail or corrupt state
- Payment success is not recorded correctly
- Payment failure unlocks paid access
- Stripe webhooks are not idempotent
- Production database backup is not confirmed
- Restore process has not been tested outside production
- Secrets are exposed in logs, frontend bundles, repo files, or CI output
- Admin cannot recover broken users, shipments, or billing records
- API health checks fail
- Error logging is unavailable
- Support path is unavailable

## Launch Gates

### Private Beta Ready

Private beta is allowed only when:

- Core system checks pass
- User flow checks pass
- Freight workflow checks pass
- Logs are visible
- Error alerts are active
- Database backup exists
- Basic security checks pass
- Known issues are documented
- Rollback owner is identified

Private beta may include minor UX issues. It must not include broken auth, broken shipment workflows, broken permissions, or unknown data recovery.

### Paid Beta Ready

Paid beta is allowed only when:

- Private beta requirements pass
- Stripe live-mode configuration is verified
- Payment success and failure flows pass
- Webhook idempotency is verified
- Invoice or receipt flow passes
- Support process is ready
- Admin recovery actions are verified

Paid beta must not expose users to billing uncertainty.

### Public Launch Ready

Public launch is allowed only when:

- Paid beta requirements pass
- No unresolved critical blockers remain
- Backup and restore are tested
- Error monitoring is active
- Security review is complete
- Several real freight workflows have completed successfully
- Launch owner signs off
- Rollback owner signs off

## Phase 0: Execution Controls

Before running tests:

- [ ] Launch owner assigned
- [ ] Rollback owner assigned
- [ ] Support owner assigned
- [ ] Production environment identified
- [ ] Current API version recorded
- [ ] Current web deploy recorded
- [ ] Current database migration version recorded
- [ ] Stripe mode confirmed as test or live
- [ ] Evidence log opened
- [ ] Blocker log opened

Status: PASS / FAIL

## Phase 1: Core System

Estimated time: 30 minutes.

### 1. API Deployment Verification

Purpose: Confirm the production API is reachable and responding.

Suggested command:

```bash
curl -i "$API_BASE_URL/health"
```

Expected result:

- HTTP 200
- Response includes healthy application status
- Response time target: under 200ms for basic health check

Checklist:

- [ ] API host resolves
- [ ] API responds with HTTP 200
- [ ] Response body confirms service health
- [ ] Response time recorded
- [ ] Evidence logged

Status: PASS / FAIL

### 2. Frontend Deployment Verification

Purpose: Confirm the production web app loads and points to the correct API.

Suggested checks:

- Open production web URL
- Open browser dev tools
- Confirm no fatal console errors
- Confirm API requests target production API

Checklist:

- [ ] Web URL loads
- [ ] Main app shell renders
- [ ] Static assets load
- [ ] No fatal console errors
- [ ] API URL points to production backend
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Production Database Connection

Purpose: Confirm API can read/write against the intended production database.

Suggested command:

```bash
npm run prisma:status
```

If no status script exists, use the repo's documented Prisma command or a controlled health endpoint that checks database connectivity.

Checklist:

- [ ] Production `DATABASE_URL` is configured outside repo code
- [ ] API can connect to database
- [ ] Database health is included in health output or verified separately
- [ ] No local/staging database is being used accidentally
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Database Migrations

Purpose: Confirm production schema is current.

Suggested command:

```bash
npm run prisma:migrate:status
```

Checklist:

- [ ] Migration status checked
- [ ] No pending required migrations
- [ ] Failed migration count is zero
- [ ] Migration version recorded
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Environment Variables

Purpose: Confirm required environment values are configured without exposing secrets.

Checklist:

- [ ] API environment variables present
- [ ] Web environment variables present
- [ ] Stripe public key configured for web
- [ ] Stripe secret key configured only server-side
- [ ] Sentry DSN configured if used
- [ ] Database URL configured only server-side
- [ ] Secrets not printed in logs
- [ ] Evidence logged without secret values

Status: PASS / FAIL

### 6. Health Endpoint Checks

Purpose: Confirm health checks cover service dependencies.

Checklist:

- [ ] API health endpoint exists
- [ ] Database dependency checked
- [ ] Redis/cache dependency checked if required
- [ ] External dependency failures are visible
- [ ] Health endpoint does not expose secrets
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 2: User Flow

Estimated time: 45 minutes.

### 1. Signup

Checklist:

- [ ] New user can register
- [ ] Email normalization works
- [ ] Duplicate signup is handled safely
- [ ] Required fields are validated
- [ ] Signup event is logged
- [ ] Evidence logged

Status: PASS / FAIL

### 2. Login

Checklist:

- [ ] Valid user can log in
- [ ] Invalid password is rejected
- [ ] Locked/disabled account is rejected if supported
- [ ] Session/JWT is created correctly
- [ ] Logout invalidates local session
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Password Reset

Checklist:

- [ ] Reset request can be submitted
- [ ] Reset email arrives
- [ ] Reset link works once
- [ ] Expired or reused token is rejected
- [ ] User can log in with new password
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Role-Based Permissions

Checklist:

- [ ] Shipper/customer role can access only allowed pages/actions
- [ ] Carrier/driver role can access only allowed pages/actions
- [ ] Dispatcher role can access only allowed pages/actions
- [ ] Admin role can access admin functions
- [ ] Unauthorized API calls return 401 or 403
- [ ] Role escalation is blocked
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Admin Access

Checklist:

- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Admin can search users or operational records
- [ ] Admin actions are audit logged
- [ ] Non-admin user cannot access admin routes
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 3: Freight Workflow

Estimated time: 60 minutes.

### 1. Shipment/Load Creation

Checklist:

- [ ] Test shipper/customer can create shipment or load
- [ ] Required fields validate correctly
- [ ] Pickup and delivery details persist correctly
- [ ] Rate or price fields persist correctly if applicable
- [ ] Created record appears in dashboard/list view
- [ ] Evidence logged

Status: PASS / FAIL

### 2. Assignment Workflow

Checklist:

- [ ] Load can be assigned to carrier/driver/vendor
- [ ] Assigned user can view the load
- [ ] Unauthorized user cannot view or mutate the load
- [ ] Assignment event is logged
- [ ] Notification is triggered if enabled
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Status Updates

Checklist:

- [ ] Status can move through expected lifecycle
- [ ] Invalid transitions are blocked
- [ ] Status history is preserved
- [ ] User-facing status matches backend state
- [ ] Notifications trigger on critical status changes
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Notifications

Checklist:

- [ ] Shipment created notification is triggered
- [ ] Assignment notification is triggered
- [ ] Status update notification is triggered
- [ ] Billing/payment notification is triggered if applicable
- [ ] Notification failures are logged
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Document Upload/Download

Checklist:

- [ ] Upload works for allowed file type
- [ ] Oversized file is rejected
- [ ] Disallowed file type is rejected
- [ ] Uploaded document can be downloaded by authorized user
- [ ] Unauthorized user cannot access document
- [ ] Evidence logged

Status: PASS / FAIL

### 6. Shipment Closure

Checklist:

- [ ] Shipment/load can be closed/completed
- [ ] Required completion documents are enforced if applicable
- [ ] Completion triggers invoice or billing workflow if applicable
- [ ] Closed records are read-only where required
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 4: Billing

Estimated time: 30 minutes.

### 1. Stripe Live Keys

Checklist:

- [ ] Stripe mode confirmed
- [ ] Publishable key is frontend-safe
- [ ] Secret key is server-side only
- [ ] Webhook signing secret is configured server-side only
- [ ] Keys are not committed to repo
- [ ] Evidence logged without secret values

Status: PASS / FAIL

### 2. Controlled Live Payment

Only run a live payment with a controlled low-dollar transaction and a known internal account.

Checklist:

- [ ] Controlled payment created
- [ ] Payment succeeds in Stripe dashboard
- [ ] Payment success is reflected in app database
- [ ] User access/billing state updates correctly
- [ ] Receipt/invoice is generated if applicable
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Webhook Verification

Use `docs/STRIPE_WEBHOOK_VERIFICATION.md` for the full edge-case matrix.

Checklist:

- [ ] Payment success webhook handled
- [ ] Payment failure webhook handled
- [ ] Duplicate webhook safely ignored or idempotently processed
- [ ] Delayed webhook handled
- [ ] Webhook signature validation works
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Failed Payment Handling

Checklist:

- [ ] Failed payment is recorded
- [ ] Paid access is not incorrectly granted
- [ ] User sees clear failure state
- [ ] Admin can inspect failed payment state
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Invoice/Receipt Flow

Checklist:

- [ ] Invoice or receipt is generated
- [ ] Email receipt arrives if configured
- [ ] Payment status matches Stripe
- [ ] Refund or cancellation path is documented
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 5: Operations

Estimated time: 30 minutes.

### 1. Logs Visible

Checklist:

- [ ] API logs visible
- [ ] Web build/deploy logs visible
- [ ] Error logs visible
- [ ] Sensitive values are not logged
- [ ] Evidence logged

Status: PASS / FAIL

### 2. Error Alerts Active

Checklist:

- [ ] Error tracking configured
- [ ] Test error reaches alert destination
- [ ] Alert owner receives notification
- [ ] Priority rules are documented
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Database Backup Configured

Checklist:

- [ ] Backup job exists
- [ ] Backup location verified
- [ ] Backup schedule documented
- [ ] Backup retention documented
- [ ] Backup owner identified
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Restore Process Tested

This is mandatory before paid beta and public launch.

Checklist:

- [ ] Restore tested outside production
- [ ] Restore time recorded
- [ ] Restored database validated with sample query
- [ ] Restore owner identified
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Admin Recovery Process

Use `docs/ADMIN_RECOVERY_RUNBOOK.md`.

Checklist:

- [ ] Admin can find user
- [ ] Admin can disable user
- [ ] Admin can update shipment/load status
- [ ] Admin can inspect payment state
- [ ] Admin can resend or manually trigger notification if supported
- [ ] Admin actions are audit logged
- [ ] Evidence logged

Status: PASS / FAIL

### 6. Support Email/Help Path

Checklist:

- [ ] Support inbox exists
- [ ] Support contact is visible to users
- [ ] Support owner receives messages
- [ ] Escalation path documented
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 6: Security

Estimated time: 30 minutes.

### 1. HTTPS Active

Checklist:

- [ ] Web app uses HTTPS
- [ ] API uses HTTPS
- [ ] HTTP redirects to HTTPS where applicable
- [ ] TLS certificate is valid
- [ ] Evidence logged

Status: PASS / FAIL

### 2. Secrets Not Exposed

Checklist:

- [ ] Repo scan completed
- [ ] Frontend bundle checked for server-side secrets
- [ ] Logs checked for secrets
- [ ] CI output checked for secrets
- [ ] `.env` files are ignored
- [ ] Evidence logged

Status: PASS / FAIL

### 3. Auth Tokens Secure

Checklist:

- [ ] Tokens are not stored insecurely beyond app design
- [ ] Expired token is rejected
- [ ] Missing token is rejected
- [ ] Tampered token is rejected
- [ ] Logout behavior is verified
- [ ] Evidence logged

Status: PASS / FAIL

### 4. Role Access Tested

Checklist:

- [ ] Unauthorized admin access blocked
- [ ] Cross-account data access blocked
- [ ] API enforces roles server-side
- [ ] UI hiding is not the only protection
- [ ] Evidence logged

Status: PASS / FAIL

### 5. Rate Limits Enabled

Checklist:

- [ ] Login or auth endpoints rate limited
- [ ] Payment endpoints protected
- [ ] Upload endpoints protected
- [ ] Health endpoint cannot be abused to leak data
- [ ] Evidence logged

Status: PASS / FAIL

### 6. Sensitive Data Protected

Checklist:

- [ ] PII fields identified
- [ ] Payment secrets never stored directly
- [ ] Documents require authorization
- [ ] Audit logs avoid sensitive payloads
- [ ] Data retention approach documented
- [ ] Evidence logged

Status: PASS / FAIL

## Phase 7: Launch Decision

Estimated time: 15 minutes.

### Decision Checklist

- [ ] All critical tests pass
- [ ] Failed tests are listed with severity
- [ ] Workarounds are documented
- [ ] Rollback plan is current
- [ ] Support owner confirms availability
- [ ] Launch owner signs off
- [ ] Rollback owner signs off

### Decision

Choose one:

- [ ] No launch
- [ ] Private beta only
- [ ] Paid beta approved
- [ ] Public launch approved

### Sign-Off

| Role | Name | Date/Time | Decision |
|---|---|---|---|
| Launch Owner |  |  |  |
| Rollback Owner |  |  |  |
| Support Owner |  |  |  |
| Technical Owner |  |  |  |

## Evidence Standard

Each test must have an evidence entry using this format:

```markdown
## Test
Core System - API Health Check

## Date/Time
YYYY-MM-DD HH:MM TZ

## Command or Action
curl -i https://api.example.com/health

## Expected Result
HTTP 200 with healthy database status

## Actual Result
[Paste result, screenshot summary, or link]

## Status
PASS / FAIL

## Severity
None / Low / Medium / High / Critical

## Owner
[Name]

## Notes
[Any issue, latency, warning, or follow-up]
```

Use `docs/LAUNCH_EVIDENCE_LOG.md` for the actual run log.
