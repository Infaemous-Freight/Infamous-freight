# Infamous Freight Android Launch Checklist (Play Store)

Date: 2026-04-05 (UTC)

## Definition of launch-ready

Infamous Freight is launch-ready when all of the following are true:

1. A signed Android App Bundle (AAB) is built in release mode.
2. A production backend is online and monitored.
3. Public web pages exist for support, privacy, terms, and account deletion.
4. Google Play Console requirements are completed and accepted.

No team can guarantee a literal 100% launch outcome because review timing and production incidents are not fully controllable. The practical goal is to be compliant, observable, and operational from day one.

## Recommended lean stack

This checklist reflects the repository's current production deployment targets. If infrastructure changes, follow the existing deployment documentation as the source of truth.

- **Web**: Vercel
- **Backend/API**: Render (primary) + Fly.io (backup)
- **Database/Auth**: Supabase
- **Android delivery**: AAB + Play App Signing
- **Monitoring**: Firebase Crashlytics + Performance Monitoring + Analytics
- **Test distribution**: Firebase App Distribution

## Public web assets required before Play submission

Publish these pages on your own domain using the actual web app routes:

- `/` (home/product)
- `/contact` (support)
- `/legal/privacy-policy`
- `/legal/terms-of-service`
- a public account deletion page at its real app URL (required if user accounts exist)

If Play listing text, reviewer notes, or external docs reference alternate aliases such as `/support`, `/privacy`, `/terms`, or `/delete-account`, configure redirects for those paths before submission.
Deletion page should clearly state:

- how users request deletion
- what data is deleted
- what data is retained (legal/accounting requirements)
- expected processing timeline
- support contact email

## Play Console compliance checklist

As of 2026-04-05, confirm:

1. Developer account verification is complete.
2. Target SDK requirement is met for new submissions (Android 15 / API 35+).
3. Play App Signing is configured for first release.
4. App content declarations are complete:
   - Data safety
   - Content rating
   - Target audience + app content
   - Store listing
   - Pricing and distribution
5. 64-bit architecture support is included.
6. If account type is a new personal developer account, closed testing prerequisites are met (12 opted-in testers for 14 continuous days before production access request).
7. Reviewer access instructions and test credentials are valid if login is required.

## Production backend readiness checklist

Before launch, production environment must include:

- isolated production database
- authentication + authorization rules
- role and permission enforcement
- HTTPS endpoints
- logs + alerting + uptime monitoring
- backups and restore verification
- strict environment separation (dev/staging/prod)

Core freight flows to validate end-to-end:

- user registration/login
- shipment creation and status updates
- quote request handling
- carrier/driver event updates
- notification delivery
- failed payment and failed request recovery

## App instrumentation before launch

Install and validate before release:

- Crashlytics (crash visibility)
- Performance Monitoring (latency/performance)
- Analytics (core user funnel tracking)

## Release sequence

1. Internal testing
2. Closed testing
3. Production release

For first release, submit full production release when eligible. After first live version, use staged rollout for updates and keep rollback/halt process documented.

## 3-week execution plan

### Week 1

- Finalize domain and public pages
- Configure production backend
- Wire monitoring and analytics
- Build signed, target-compliant AAB
- Create Play app entry and baseline listing assets

### Week 2

- Run internal testing
- Fix auth/API/crash/permission issues
- Complete Data safety, content rating, target audience, and app access declarations
- Finalize screenshots, icon, feature graphic, short/full descriptions

### Week 3+

- Run closed test and maintain continuous tester opt-in
- Triage and fix bugs from test cohort
- Request production access if account policy requires it
- Release to production after approval

## Common launch blockers

- missing or weak privacy policy
- Data safety declarations that do not match real SDK/app behavior
- account deletion flow incomplete
- invalid reviewer credentials
- tester continuity issues for personal-account closed testing requirement
- wrong target SDK
- unsigned/incorrectly signed release artifact
- backend instability when moving from dev to production
- missing crash/performance telemetry

## Operational definition of “fully up and running”

- website live on owned domain
- app approved and listed on Google Play
- backend stable in production
- monitoring active and alerting configured
- support email live and staffed
- privacy and deletion workflows active
- analytics tracking key business and product events
- repeatable release process for safe updates
