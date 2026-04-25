# Production Rollback Plan

Use this when a production launch, beta, deploy, migration, billing change, or configuration change creates unacceptable user, revenue, security, or data risk.

## Rollback Owners

| Role | Name | Contact | Backup |
|---|---|---|---|
| Rollback Owner |  |  |  |
| API Owner |  |  |  |
| Web Owner |  |  |  |
| Database Owner |  |  |  |
| Billing Owner |  |  |  |
| Support Owner |  |  |  |

## Rollback Triggers

Rollback immediately if any critical trigger occurs.

### Critical Triggers

- Login failure rate above 5% for active users
- Signup/login unavailable for more than 10 minutes
- Shipment/load creation fails in production
- Assignment or status updates corrupt freight workflow state
- Payment failures affect real users
- Payment success is not recorded correctly
- Failed payment grants paid access
- Duplicate Stripe webhook corrupts billing state
- Database migration corrupts, deletes, or hides production data
- API error rate above 2% for more than 10 minutes
- API health checks fail continuously for 5 minutes
- Secrets are exposed
- Unauthorized role access is discovered
- Admin recovery path unavailable during production incident

### High-Severity Triggers

These may trigger rollback depending on scope and workaround:

- Notifications fail for shipment or billing events
- Document upload/download is unavailable
- Web app loads but key pages are unusable
- Support inbox or escalation path is unavailable
- Monitoring is down during launch window
- Backup job fails before migration or launch event

## Pre-Rollback Requirements

Before launching or deploying, record:

- [ ] Current API commit/version
- [ ] Current web deploy ID
- [ ] Current database migration version
- [ ] Last successful database backup timestamp
- [ ] Previous known-good API version
- [ ] Previous known-good web deploy
- [ ] Migration rollback or forward-fix strategy
- [ ] DNS/provider rollback path if applicable
- [ ] Stripe live-mode restrictions or emergency disable process
- [ ] Support communication draft prepared

## API Rollback

1. Stop active deploy if still running.
2. Identify previous known-good API release.
3. Redeploy previous API version or revert faulty commit.
4. Confirm environment variables did not change incorrectly.
5. Run health check.
6. Confirm login/auth API works.
7. Confirm freight workflow API endpoints work.
8. Log rollback evidence in `docs/LAUNCH_EVIDENCE_LOG.md`.

Suggested verification:

```bash
curl -i "$API_BASE_URL/health"
```

## Web Rollback

1. Identify previous known-good web deploy.
2. Restore previous deploy in Netlify or redeploy previous commit.
3. Confirm production URL loads.
4. Confirm frontend points to correct API URL.
5. Confirm no fatal console errors.
6. Log rollback evidence.

## Database Rollback

Database rollback is higher risk than app rollback. Prefer forward fixes unless the migration is clearly reversible and data-safe.

### Before Database Migration

- [ ] Backup completed
- [ ] Backup location verified
- [ ] Restore tested outside production
- [ ] Migration status recorded
- [ ] Rollback or forward-fix plan reviewed

### If Migration Fails Before Data Mutation

1. Stop deploy traffic if possible.
2. Revert app release to version compatible with previous schema.
3. Mark migration failed only according to the migration tool's official recovery process.
4. Re-run status checks.
5. Document result.

### If Migration Corrupts or Deletes Data

1. Stop writes if possible.
2. Notify rollback owner and database owner.
3. Preserve logs and current database state for investigation.
4. Restore latest verified backup to non-production first.
5. Validate restored data.
6. Decide whether to restore production or forward-fix.
7. Document business impact and user communication needs.

## Stripe/Billing Rollback

Use this when payment state is wrong, webhooks misfire, or live billing creates risk.

1. Disable or restrict affected billing flow if possible.
2. Confirm Stripe dashboard source of truth.
3. Stop automated access changes if they are wrong.
4. Confirm webhook endpoint status.
5. Replay or mark webhook events only after idempotency is confirmed.
6. Manually correct affected user records with audit logging.
7. Issue refunds or credits if required.
8. Document affected users and payment IDs.

Never delete billing records to hide an error. Correct with auditable adjustments.

## Notification Rollback

1. Confirm whether provider outage or app code caused failure.
2. Disable noisy or duplicate notification paths if needed.
3. Queue or manually send critical freight/billing updates.
4. Confirm support has a script for affected users.
5. Document missed events.

## User Communication

Use direct, factual messaging. Do not overexplain internal causes.

### Private Beta Message

```text
We identified an issue affecting [area]. We paused the affected workflow and are restoring the last known-good version. Your data is being protected, and we will confirm once the workflow is available again.
```

### Paid User Message

```text
We identified an issue affecting [billing/workflow area]. We have paused the affected action and are reconciling records against the source of truth. If your account was affected, we will correct it directly and confirm the resolution.
```

## Post-Rollback Checklist

- [ ] API health restored
- [ ] Web app restored
- [ ] Auth tested
- [ ] Freight workflow tested
- [ ] Billing state reconciled if affected
- [ ] Database integrity checked
- [ ] Monitoring restored
- [ ] Support notified
- [ ] Root-cause issue created
- [ ] Evidence log updated
- [ ] Public/private launch decision updated

## Post-Incident Review

Within 48 hours, document:

- What changed
- What failed
- Detection time
- Recovery time
- Affected users
- Data impact
- Revenue impact
- Prevention work
- Owner for each follow-up item
