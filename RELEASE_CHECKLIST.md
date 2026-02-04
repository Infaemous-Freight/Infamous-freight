# Release Checklist — Infæmous Freight

> A release is “100%” only when every item below is ✅.

## A) Build Integrity
- [ ] `pnpm -v` and `node -v` confirmed in CI logs
- [ ] `pnpm-lock.yaml` exists at repo root and is committed
- [ ] CI: lint, typecheck, test, build all green
- [ ] No secrets committed (scan passed)

## B) Deploy Integrity
### Web (Vercel)
- [ ] Production URL returns 200
- [ ] Preview deployments enabled for PRs
- [ ] `NEXT_PUBLIC_API_URL` set correctly for prod + preview

### API (Fly.io)
- [ ] `/health` returns 200 and includes dependency checks
- [ ] Correct app secrets present (DATABASE_URL, JWT_SECRET, Stripe, Twilio)
- [ ] Machines healthy (no crash loops)

### Database
- [ ] `prisma migrate deploy` executed for prod
- [ ] DB backups/PITR enabled in provider
- [ ] Staging DB is separate from prod DB

## C) Monetization (Stripe)
- [ ] Webhook endpoint reachable and signature verified
- [ ] Test vs Live mode verified (correct keys)
- [ ] Idempotency enforced for billing mutations
- [ ] Webhook events are stored/logged

## D) Messaging (Twilio)
- [ ] Send test passed from staging + prod
- [ ] Rate limiting enabled on send endpoints
- [ ] Status callbacks logged

## E) Observability
- [ ] Sentry (or equivalent) enabled on API + Web
- [ ] Release/version attached to events
- [ ] Watchdog pinger confirms uptime

## F) Finalization
- [ ] Tag created (e.g., `v2.1.0`)
- [ ] GitHub Release published with notes
- [ ] Post-release smoke test completed
