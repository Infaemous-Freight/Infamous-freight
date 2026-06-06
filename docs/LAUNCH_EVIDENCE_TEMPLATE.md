# Launch Evidence Template

Use this template for every production release or launch-readiness review.

## Release Information

- Release date:
- Release owner:
- Git commit SHA:
- Environment:
- Netlify deploy URL:
- Fly.io app:
- API health URL:

## Scope of Release

List the user-facing or operational changes included in this release.

- Change 1:
- Change 2:
- Change 3:

## Repository Verification Gates

Record result, timestamp, and notes for each command.

| Check | Result | Timestamp | Notes |
| --- | --- | --- | --- |
| `pnpm run lint` | Pending |  |  |
| `pnpm run typecheck` | Pending |  |  |
| `pnpm run prisma:validate` | Pending |  |  |
| `pnpm run build` | Pending |  |  |
| `pnpm run test` | Pending |  |  |

## Production Readiness Checks

| Check | Result | Timestamp | Notes |
| --- | --- | --- | --- |
| `pnpm run env:check:strict` | Pending |  |  |
| `pnpm run production:preflight` | Pending |  |  |
| `pnpm run production:smoke-test` | Pending |  |  |
| `pnpm run production:capture-netlify-evidence` | Pending |  |  |
| `pnpm run billing:verify-live` if billing changed | Not Applicable |  |  |

## Public Quote Intake Evidence

- Live quote page URL:
- Test submission timestamp:
- Test submission identifier:
- API result:
- Internal intake destination verified:
- Customer confirmation verified:
- Evidence file or screenshot path:
- Notes:

## Public Tracking Evidence

### Malformed Tracking Lookup

- Test value:
- Expected result:
- Actual result:
- Pass/fail:
- Notes:

### Unknown Tracking Lookup

- Test value:
- Expected result:
- Actual result:
- Pass/fail:
- Notes:

### Known-Safe Positive Tracking Lookup

- Tracking number:
- Expected result:
- Actual result:
- Public payload reviewed for sensitive data:
- Pass/fail:
- Notes:

## Authenticated Route Evidence

| Route | Expected Data Source | Result | Notes |
| --- | --- | --- | --- |
| `/quotes` | Live API | Pending |  |
| `/loads` | Live API | Pending |  |
| `/dispatch` | Live API | Pending |  |
| `/carriers` | Live API or gated | Pending |  |
| `/analytics` | Live API or clearly marked demo | Pending |  |

## Genesis AI Evidence

- Quote assist tested:
- Missing-data detection tested:
- Carrier match suggestion tested:
- Human-review requirement confirmed:
- Recommendations logged:
- Notes:

## Security and Data Exposure Review

- Tenant isolation checked:
- Role access checked:
- Public tracking payload reviewed:
- Sensitive data absent from public responses:
- Logs reviewed for exposed secrets:
- Notes:

## Final Launch Decision

- Approved:
- Approved by:
- Approval timestamp:
- Conditions or blockers:

## Follow-Up Tasks

- Task 1:
- Task 2:
- Task 3:
