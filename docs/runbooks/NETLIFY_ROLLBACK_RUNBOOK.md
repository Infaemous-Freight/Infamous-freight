# Netlify Rollback Runbook

## Ownership

- Primary: Platform DevOps
- Secondary: Web Platform Lead
- Incident Commander: On-call Engineering Manager

## Trigger conditions

- Elevated 5xx or client error rates after deploy
- Critical user journey failures
- Security incident requiring immediate rollback

## Rollback steps

1. Identify last known-good deploy in Netlify Deploys UI.
2. Lock active incident channel and announce rollback intent.
3. Restore/publish the previous deploy.
4. Verify:
   - homepage returns 200
   - auth sign-in path renders
   - critical API-dependent route loads
5. Post rollback confirmation in incident channel.
6. Create postmortem ticket using the incident template.

## Validation checklist

- [ ] Core smoke tests passed.
- [ ] Error budget burn stabilizing.
- [ ] No critical auth/billing regressions.
- [ ] Stakeholders notified.

