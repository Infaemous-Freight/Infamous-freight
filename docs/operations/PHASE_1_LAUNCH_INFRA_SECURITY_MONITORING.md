# Phase 1 Launch Infrastructure, Security, and Monitoring

## Purpose

Phase 1 focuses on the minimum critical operating controls required before launch: production infrastructure confidence, automated security scanning, and incident response readiness.

## Launch-critical recommendations implemented

1. **Critical infrastructure gate**
   - Keep production smoke checks focused on the public frontend and proxied API health endpoint.
   - Treat a failing smoke check as a launch blocker until the owner records evidence and resolution.
   - Require every production deploy to leave copy-pasteable evidence in the GitHub Actions job summary or `docs/LAUNCH_EVIDENCE_LOG.md`.

2. **Security scanning gate**
   - Run dependency review on pull requests that change dependency manifests, lockfiles, workflow definitions, ZAP rules, or operations docs.
   - Run a production dependency audit with high-severity failures blocking the job.
   - Run OWASP ZAP baseline scans against the public production URL on push, schedule, or manual dispatch.
   - Keep ZAP rules explicit in `.zap/rules.tsv` so accepted risks are visible and reviewable.

3. **Monitoring and response gate**
   - Run scheduled smoke checks daily.
   - Route failed scheduled checks to the on-call incident path.
   - Require incident commander assignment, severity classification, customer impact assessment, and evidence capture.

## Required production launch signals

| Signal | Required state | Evidence location |
|---|---|---|
| Frontend availability | `https://www.infamousfreight.com/` returns HTTP 200 after redirects | GitHub Actions summary or launch evidence log |
| API health through Netlify proxy | `https://www.infamousfreight.com/api/health` returns HTTP 200 | GitHub Actions summary or launch evidence log |
| Dependency review | High-severity dependency introductions fail pull requests | PR check output |
| Production dependency audit | `pnpm audit --prod --audit-level high` passes or has documented exception | Workflow run summary |
| OWASP ZAP baseline | No unaccepted high-risk baseline findings | Workflow run artifact or issue output |
| On-call coverage | Primary and secondary responders assigned for launch window | On-call rotation schedule |
| Incident runbook | Team can execute severity, escalation, comms, and rollback flow | Incident response runbook |

## Launch acceptance criteria

- Phase 1 security and monitoring workflow exists and runs on pull requests, pushes to `main`, daily schedule, and manual dispatch.
- Any launch-blocking failure has a named owner and documented next action.
- Accepted security findings are tracked as explicit exceptions with owner, expiry date, and reason.
- On-call primary and secondary responders are assigned before launch traffic is increased.
- Incident response training has been completed or scheduled before public launch.

## Operator notes

- Do not paste secrets into GitHub issues, pull request comments, logs, screenshots, or chat.
- Prefer `/api` for frontend-to-backend calls in production so Netlify proxy behavior is validated.
- Treat redirect loops, failed health checks, and ZAP high findings as launch blockers.
- Record smoke-test evidence with exact UTC timestamp, target URL, HTTP status, final URL, run link, owner, and result.
