# MVP Launch Demo Data Set

Controlled demo and smoke-test data set used for sales demos, MVP smoke tests, and launch verification. This is intentionally small, clearly labeled, and safe to show prospects without exposing real customer PII or processing real payments.

Related launch control: see `docs/PRODUCTION_TEST_DATA_PLAN.md` for the broader production test data plan and `docs/LAUNCH_READINESS_INDEX.md` for the launch gate index.

## Rules

- Do not use real customer PII unless explicitly approved in writing by the launch owner.
- Mark all records clearly as demo/test records using the naming conventions below.
- Do not process real payments for demo data. Only use Stripe test mode, or an approved controlled live-payment test recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.
- Demo phone numbers must use the `555-01xx` reserved test prefix. Demo emails must use the `@demo.infamousfreight.com` or `@example.com` domains.
- Do not delete records that may be needed as launch verification evidence. Archive or mark them instead.

## Naming Conventions

| Record Type | Convention | Example |
|---|---|---|
| Company / Customer | `DEMO - <Name>` | `DEMO - Acme Distribution` |
| Carrier / Driver | `DEMO - <Name>` | `DEMO - Northstar Logistics` |
| Shipment / Load Reference | `DEMO-MVP-[YYYYMMDD]-[###]` | `DEMO-MVP-20260503-001` |
| Quote / Lead Reference | `DEMO-QUOTE-[YYYYMMDD]-[###]` | `DEMO-QUOTE-20260503-001` |
| Tracking Event Notes | Prefix with `[DEMO]` | `[DEMO] Picked up at origin` |

## Sample Customers (3)

| ID | Company | Contact | Email | Phone | Billing Address | Notes |
|---|---|---|---|---|---|---|
| DEMO-CUST-001 | DEMO - Acme Distribution | Jordan Avery | jordan.avery@demo.infamousfreight.com | 555-0101 | 100 Demo Way, Dallas, TX 75201 | Mid-size shipper, weekly LTL |
| DEMO-CUST-002 | DEMO - Bluepeak Manufacturing | Riley Chen | riley.chen@demo.infamousfreight.com | 555-0102 | 220 Sample Blvd, Atlanta, GA 30301 | FTL dry van, food-grade |
| DEMO-CUST-003 | DEMO - Cascade Retail Group | Morgan Diaz | morgan.diaz@demo.infamousfreight.com | 555-0103 | 350 Test Pkwy, Phoenix, AZ 85001 | Reefer, retail DC delivery |

## Sample Carriers / Drivers (3)

| ID | Carrier / Driver | Type | Contact | Email | Phone | DOT / MC (Demo) | Equipment |
|---|---|---|---|---|---|---|---|
| DEMO-CARR-001 | DEMO - Northstar Logistics | Carrier | Pat Nguyen | dispatch@demo.infamousfreight.com | 555-0111 | DOT-DEMO-1001 / MC-DEMO-2001 | Dry van |
| DEMO-CARR-002 | DEMO - Summit Freight Lines | Carrier | Sam Patel | ops@demo.infamousfreight.com | 555-0112 | DOT-DEMO-1002 / MC-DEMO-2002 | Reefer |
| DEMO-DRV-003 | DEMO - Driver Alex Rivera | Owner-operator | Alex Rivera | alex.rivera@demo.infamousfreight.com | 555-0113 | DOT-DEMO-1003 / MC-DEMO-2003 | Flatbed |

## Sample Shipments (5)

All loads are non-billable demo records. Rates shown are example values, not invoiced.

| ID | Customer | Carrier/Driver | Origin | Destination | Equipment | Weight | Status | Pickup | Delivery | Rate (Demo) |
|---|---|---|---|---|---|---|---|---|---|---|
| DEMO-MVP-20260503-001 | DEMO-CUST-001 | DEMO-CARR-001 | Dallas, TX | Houston, TX | Dry van | 12,000 lb | Delivered | 2026-05-01 08:00 CT | 2026-05-01 16:30 CT | $850 |
| DEMO-MVP-20260503-002 | DEMO-CUST-002 | DEMO-CARR-002 | Atlanta, GA | Charlotte, NC | Reefer | 28,500 lb | In Transit | 2026-05-03 06:00 ET | 2026-05-03 18:00 ET | $1,450 |
| DEMO-MVP-20260503-003 | DEMO-CUST-003 | DEMO-DRV-003 | Phoenix, AZ | Los Angeles, CA | Flatbed | 18,200 lb | Delayed | 2026-05-03 05:30 MT | 2026-05-03 19:00 PT | $1,250 |
| DEMO-MVP-20260503-004 | DEMO-CUST-001 | DEMO-CARR-002 | Dallas, TX | Memphis, TN | Reefer | 22,000 lb | Picked Up | 2026-05-03 09:00 CT | 2026-05-04 12:00 CT | $1,675 |
| DEMO-MVP-20260503-005 | DEMO-CUST-002 | DEMO-CARR-001 | Savannah, GA | Jacksonville, FL | Dry van | 15,750 lb | Booked | 2026-05-04 07:00 ET | 2026-05-04 14:00 ET | $725 |

## Sample Tracking Events

Cover the full lifecycle: pickup, in transit, delay, delivered. Notes prefixed with `[DEMO]`.

### DEMO-MVP-20260503-001 (Delivered)

| Timestamp (UTC) | Event | Location | Notes |
|---|---|---|---|
| 2026-05-01T13:02Z | Pickup | Dallas, TX | [DEMO] Picked up at origin facility |
| 2026-05-01T15:45Z | In Transit | Corsicana, TX | [DEMO] On-route checkpoint |
| 2026-05-01T19:10Z | In Transit | Huntsville, TX | [DEMO] On-route checkpoint |
| 2026-05-01T21:32Z | Delivered | Houston, TX | [DEMO] POD signed: J. Avery |

### DEMO-MVP-20260503-002 (In Transit)

| Timestamp (UTC) | Event | Location | Notes |
|---|---|---|---|
| 2026-05-03T10:04Z | Pickup | Atlanta, GA | [DEMO] Reefer set to 36°F |
| 2026-05-03T13:20Z | In Transit | Commerce, GA | [DEMO] On-route checkpoint |

### DEMO-MVP-20260503-003 (Delayed)

| Timestamp (UTC) | Event | Location | Notes |
|---|---|---|---|
| 2026-05-03T12:30Z | Pickup | Phoenix, AZ | [DEMO] Picked up at origin |
| 2026-05-03T16:05Z | In Transit | Quartzsite, AZ | [DEMO] On-route checkpoint |
| 2026-05-03T18:40Z | Delay | Indio, CA | [DEMO] Mechanical delay, ETA pushed 3h |

### DEMO-MVP-20260503-004 (Picked Up)

| Timestamp (UTC) | Event | Location | Notes |
|---|---|---|---|
| 2026-05-03T14:01Z | Pickup | Dallas, TX | [DEMO] Reefer set to 34°F |

### DEMO-MVP-20260503-005 (Booked)

No tracking events yet; load is dispatched but not picked up.

## Sample Quote History / Lead Statuses

| Quote ID | Customer | Lane | Equipment | Status | Quoted Rate (Demo) | Lead Stage | Last Updated |
|---|---|---|---|---|---|---|---|
| DEMO-QUOTE-20260501-001 | DEMO-CUST-001 | Dallas, TX → Houston, TX | Dry van | Won → DEMO-MVP-20260503-001 | $850 | Closed Won | 2026-05-01 |
| DEMO-QUOTE-20260502-002 | DEMO-CUST-002 | Atlanta, GA → Charlotte, NC | Reefer | Won → DEMO-MVP-20260503-002 | $1,450 | Closed Won | 2026-05-02 |
| DEMO-QUOTE-20260502-003 | DEMO-CUST-003 | Phoenix, AZ → Los Angeles, CA | Flatbed | Won → DEMO-MVP-20260503-003 | $1,250 | Closed Won | 2026-05-02 |
| DEMO-QUOTE-20260503-004 | DEMO-CUST-001 | Dallas, TX → Memphis, TN | Reefer | Won → DEMO-MVP-20260503-004 | $1,675 | Closed Won | 2026-05-03 |
| DEMO-QUOTE-20260503-005 | DEMO-CUST-002 | Savannah, GA → Jacksonville, FL | Dry van | Won → DEMO-MVP-20260503-005 | $725 | Closed Won | 2026-05-03 |
| DEMO-QUOTE-20260503-006 | DEMO-CUST-003 | Phoenix, AZ → Denver, CO | Reefer | Quoted | $1,925 | Proposal Sent | 2026-05-03 |
| DEMO-QUOTE-20260503-007 | DEMO-CUST-001 | Dallas, TX → Oklahoma City, OK | Dry van | Lost | $640 | Closed Lost | 2026-05-03 |
| DEMO-QUOTE-20260503-008 | (new lead) DEMO - Lead Co. | Chicago, IL → Indianapolis, IN | Dry van | New Lead | — | New | 2026-05-03 |

## Evidence Required

For each demo data run, capture the following in `docs/LAUNCH_EVIDENCE_LOG.md`:

- [ ] Record identifiers (or redacted screenshots) for each created customer, carrier, shipment, tracking event, and quote
- [ ] Date/time created (UTC)
- [ ] Owner (account/operator who created the records)
- [ ] Environment (staging vs production)
- [ ] Cleanup procedure executed (see below) and date completed

## Cleanup Procedure

Run after demo or smoke test, unless records are required as launch verification evidence.

1. Mark all demo shipments as `Archived` or `Closed - Demo`.
2. Disable demo customer and carrier accounts; do not delete if linked to evidence records.
3. Cancel or void any open demo quotes.
4. Verify no demo records appear in any production-facing report, dashboard, or notification feed.
5. Confirm Stripe contains no real-money charges tied to demo customers; void/refund any approved controlled live-payment tests.
6. Record cleanup completion (date/time, owner, scope) in `docs/LAUNCH_EVIDENCE_LOG.md`.
7. If full purge is approved by the launch owner, remove demo records via the standard admin tooling — never via direct database edits.

## Owner

Default demo data owner: launch owner listed in `docs/LAUNCH_EVIDENCE_LOG.md`. Update the owner field in the evidence log whenever a different operator creates or cleans up the demo data set.
