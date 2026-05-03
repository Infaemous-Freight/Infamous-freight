# Incident Response Runbook

## Severity levels

| Severity | Definition | Examples | Response target |
|---|---|---|---|
| SEV-1 | Production unavailable or security incident suspected | Site down, API unavailable, exposed secret, payment/security breach | Immediate response |
| SEV-2 | Major degradation affecting launch-critical flows | Login broken, quote form broken, billing checkout failing | Same business day |
| SEV-3 | Non-critical degradation or partial feature failure | Admin page issue, delayed notification, analytics gap | Next planned work block |

## Roles

- **Incident Commander:** owns coordination, severity, timeline, and decision-making.
- **Technical Lead:** investigates root cause and owns remediation.
- **Communications Lead:** prepares stakeholder/customer updates.
- **Scribe:** records timestamps, actions, evidence, and final summary.

## Response flow

1. Declare severity and assign roles.
2. Confirm customer impact and affected systems.
3. Stabilize first: rollback, disable feature, scale service, or route around the failure.
4. Preserve evidence: workflow run links, logs, screenshots with secrets redacted, timestamps, and command output.
5. Communicate status at a fixed interval until resolved.
6. Close only after production checks pass and owner records evidence.
7. Complete post-incident review within two business days for SEV-1/SEV-2.

## Required evidence

- UTC start and end timestamps.
- Severity and impact summary.
- Trigger source: alert, customer report, workflow failure, manual smoke test, or security scan.
- Systems affected: Netlify, Fly.io, Supabase, Stripe, GitHub Actions, Sentry, or other.
- Links to workflow runs, deploys, logs, and related issues/PRs.
- Final smoke-test results.
- Follow-up owners and due dates.

## Security-specific handling

- Rotate suspected exposed credentials before reopening the incident as resolved.
- Do not paste secrets into GitHub, chat, screenshots, or logs.
- If a webhook signing secret, database credential, service key, or deploy token is exposed, assume compromise until rotated and verified.
- For payment/security concerns, preserve evidence and restrict access before making broad changes.

## Post-incident review template

```markdown
# Post-Incident Review: <title>

- Date/time opened UTC:
- Date/time resolved UTC:
- Severity:
- Incident commander:
- Technical lead:
- Customer impact:
- Root cause:
- What went well:
- What failed:
- Corrective actions:
- Owners and due dates:
```
