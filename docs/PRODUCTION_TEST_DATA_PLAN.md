# Production Test Data Plan

Use controlled, clearly labeled data for production verification. Do not create messy or ambiguous records that can be mistaken for real customer freight.

## Rules

- Every production test record must include a clear `TEST` label in any user-visible name, company name, reference number, or notes field where possible.
- Never use real customer freight details for verification.
- Never use real payment instruments except approved controlled live-payment tests.
- Clean up or archive test records after verification unless the record is needed for audit evidence.
- Do not delete records that are needed to prove launch verification. Archive or mark them instead.

## Test Accounts

| Account Type | Email | Purpose | Created | Cleaned Up |
|---|---|---|---|---|
| Test Admin |  | Admin recovery, permissions, audit logging |  |  |
| Test Shipper/Customer |  | Shipment/load creation and billing |  |  |
| Test Carrier/Vendor |  | Assignment and status visibility |  |  |
| Test Driver/Operator |  | Driver-facing status/document checks |  |  |
| Disabled User |  | Disabled-account auth rejection |  |  |

## Naming Convention

Recommended prefixes:

- Company: `TEST - Infamous Freight Verification`
- Shipment/Load Reference: `TEST-LAUNCH-[YYYYMMDD]-[###]`
- Invoice Reference: `TEST-INV-[YYYYMMDD]-[###]`
- Document Name: `TEST-POD-[YYYYMMDD].pdf`

## Required Test Records

- [ ] Test admin account
- [ ] Test shipper/customer account
- [ ] Test carrier/vendor account
- [ ] Test driver/operator account if supported
- [ ] Test shipment/load
- [ ] Test assignment
- [ ] Test status history
- [ ] Test uploaded document
- [ ] Test invoice or receipt
- [ ] Test failed payment state if applicable
- [ ] Test support request

## Freight Workflow Test Dataset

| Field | Value |
|---|---|
| Load Reference | TEST-LAUNCH-[YYYYMMDD]-001 |
| Pickup | TEST Pickup Facility, Dallas, TX |
| Delivery | TEST Delivery Facility, Fort Worth, TX |
| Commodity | Test freight - no real cargo |
| Weight | 1000 lb |
| Equipment | Dry van or default supported type |
| Rate | Low controlled amount or non-billable marker |
| Notes | Production verification test record. Do not dispatch. |

## Document Test Dataset

Use synthetic documents only.

Checklist:

- [ ] Small allowed PDF uploads successfully
- [ ] Allowed image upload works if supported
- [ ] Oversized file is rejected
- [ ] Disallowed executable/script file is rejected
- [ ] Authorized user can download
- [ ] Unauthorized user cannot download

## Billing Test Dataset

For live-mode verification, use only an approved controlled transaction.

Checklist:

- [ ] Controlled test customer identified
- [ ] Controlled low-dollar transaction approved
- [ ] Stripe customer/payment ID recorded in evidence log
- [ ] App billing state recorded
- [ ] Receipt/invoice recorded
- [ ] Refund/void decision documented

## Cleanup Plan

After verification:

- [ ] Archive or mark test shipment/load complete and test-only
- [ ] Disable test users not needed for future smoke tests
- [ ] Remove test documents if not needed for evidence
- [ ] Reconcile and refund/void controlled live payment if required
- [ ] Keep evidence log entries
- [ ] Confirm no test records appear in user-facing production reports incorrectly

## Cleanup Evidence

Record cleanup results in `docs/LAUNCH_EVIDENCE_LOG.md`.
