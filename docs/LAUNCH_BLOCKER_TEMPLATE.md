# Launch Blocker Template

Use this format for any failed production readiness item, unknown result, or launch risk.

## Blocker Summary

| Field | Value |
|---|---|
| Blocker ID | B-### |
| Date Opened |  |
| Reporter |  |
| Owner |  |
| Severity | Critical / High / Medium / Low / Unknown |
| Area | Core System / User Flow / Freight Workflow / Billing / Operations / Security / Support |
| Environment | Production / Staging / Other |
| Launch Gate Impact | Blocks Private Beta / Blocks Paid Beta / Blocks Public Launch / Does Not Block |
| Status | Open / In Progress / Workaround / Resolved / Accepted Risk |

## Problem

Describe exactly what failed.

## Expected Result

What should have happened?

## Actual Result

What happened instead?

## Evidence

Paste command output, screenshots summary, log snippets, dashboard links, or evidence-log reference.

## User or Business Impact

Describe who is affected and how.

## Root Cause

Known / Unknown.

If known, summarize the cause.

## Workaround

Document any safe workaround. If no workaround exists, write `No workaround`.

## Fix Plan

- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Retest Plan

- [ ] Retest command/action identified
- [ ] Expected result documented
- [ ] Owner assigned
- [ ] Evidence log will be updated

## Resolution

| Field | Value |
|---|---|
| Fixed By |  |
| Fix Commit/PR |  |
| Retested By |  |
| Retest Date |  |
| Final Status | PASS / FAIL |
| Launch Decision Updated | Yes / No |

## Severity Guidance

Critical blockers stop launch. Examples:

- Auth broken
- Shipment/load workflow broken
- Billing state wrong
- Payment failure grants access
- Secrets exposed
- Database backup/restore unverified
- Admin recovery unavailable
- Unauthorized access possible

High blockers may allow private beta only if there is a documented workaround.

Medium and low blockers may launch if documented, assigned, and not part of the critical path.
