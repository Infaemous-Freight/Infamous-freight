# Carrier Vetting SOP

## Onboarding Workflow

Carrier applications are submitted via `POST /api/carrier-applications` and progress through the following approval statuses:

1. `pending` — Application received, awaiting review.
2. `under_review` — Vetting steps in progress (see checklist below).
3. `approved` — All vetting steps passed; carrier cleared for dispatch.
4. `rejected` — Application denied; reason recorded in `reviewNotes`.

Status is updated via `PATCH /api/carrier-applications/:id/status` with an optional `reviewNotes` field.

## Vetting Steps

1. Confirm MC and DOT numbers.
2. Confirm active authority.
3. Confirm insurance.
4. Confirm cargo coverage.
5. Confirm auto liability coverage.
6. Collect W-9.
7. Collect signed broker-carrier agreement.
8. Verify equipment type.
9. Verify operating states.
10. Confirm dispatcher and driver contact.
11. Review safety history.
12. Confirm factoring or payment instructions.
13. Approve carrier before dispatch.

## Red Flags

- New authority with no history
- Insurance mismatch
- Company name mismatch
- Email domain mismatch
- Refusal to provide documents
- Poor communication
- Repeated contact changes
