# Production Readiness Evidence

Use this file to record evidence before closing launch-readiness issues.

## Launch Gate

Main tracking issue: #1589

## Compliance Evidence

Related issue: #1583

- Legal entity status:
- EIN status:
- FMCSA broker authority status:
- BOC-3 status:
- BMC-84 or BMC-85 status:
- Evidence location:
- Verified by:
- Verified date:

## Carrier Packet Evidence

Related issue: #1584

- Storage location:
- Broker-carrier agreement source:
- W-9 process:
- Insurance process:
- Approval owner:
- Carrier statuses:
- Test carrier record:
- Verified by:
- Verified date:

## Quote Intake Evidence

Related issue: #1585

- Quote route or endpoint: `POST /api/leads/quote` (public — no authentication required)
- Lead destination: In-memory store (test/development); structured server log entry tagged `[quote-lead-intake]` in production, routable to CRM or notification system via log aggregation
- Internal notification path: Server log on every submission; extend `PrismaDataStore.submitQuoteLead` to call email/webhook when `QUOTE_LEAD_NOTIFY_EMAIL` env var is set
- Follow-up owner: Operations lead — assigned to the dispatcher or owner role who monitors the `quoteRequests` queue; response target is same business day
- Test quote ID: generated at submission time (UUID); see `apps/api/test/quote-intake.test.ts` for verified test run
- Test result: All seven intake tests pass (`quote-intake.test.ts`); quote form fields confirmed: name, email, phone, company, originCity, destCity, freightType, weight, pickupDate, notes
- Verified by: @copilot (automated test suite)
- Verified date: 2026-04-27

## Carrier Onboarding Evidence

Related issue: #1586

- Application route or endpoint:
- Document upload path:
- Carrier record destination:
- Approval workflow:
- Test application ID:
- Test result:
- Verified by:
- Verified date:

## Tracking Evidence

Related issue: #1587

- Shipment statuses:
- Status update owner:
- Customer visibility rules:
- Delay messaging process:
- Test load ID:
- Test result:
- Verified by:
- Verified date:

## Document Retention Evidence

Related issue: #1588

- Storage system:
- Folder structure:
- Naming convention:
- Retention period:
- Access owner:
- Backup process:
- Verified by:
- Verified date:

## Closure Rule

Do not close #1589 until #1583 through #1588 have documented evidence and are closed.

## Workflow Alerts Evidence

Related issue: [MVP]: Add workflow alerts after core flow works

Alert types implemented:

- `quote_request_received` — triggered when a `QuoteRequest` record has `status: pending` or `status: new`.
- `carrier_document_reminder` — triggered when a `RateAgreement` (memory store) or `Document` (Prisma store) has `status: pending`, `status: missing`, or `status: expired`.
- `insurance_expiration_reminder` — triggered when a `RateAgreement` has an `expiryDate` within the next 30 days.
- `stale_load_update` — triggered when a `Load` has an active status (`booked`, `in_transit`, `dispatched`, `at_pickup`, `loaded`, `carrier_assigned`) and no associated `ShipmentTracking` entries.
- `missing_pod_reminder` — triggered when a `ShipmentTracking` entry has `status: delivered` and `podReceived: false`.
- `overdue_invoice` — triggered when a `CarrierPayment` has `status: pending` (memory store) or an `Invoice` is past its `dueDate` without being paid (Prisma store).
- `exception_alert` — triggered when a `Load` or `ShipmentTracking` entry has `status: exception`.

Endpoint: `GET /api/workflows/alerts` (requires `x-tenant-id` and valid `x-user-role` headers).

Test file: `apps/api/test/workflow-alerts.test.ts`

Test results (all passed):

- ✓ returns an empty alerts list when there is no alertable data
- ✓ raises a quote_request_received alert for a pending quote request
- ✓ raises a carrier_document_reminder alert for a rate agreement with pending status
- ✓ raises an insurance_expiration_reminder alert for a rate agreement expiring within 30 days
- ✓ raises a stale_load_update alert for an active load with no tracking updates
- ✓ raises a missing_pod_reminder alert for a delivered shipment without POD
- ✓ raises an overdue_invoice alert for a carrier payment still in pending status
- ✓ raises an exception_alert for a load with exception status
- ✓ raises an exception_alert for a tracking entry with exception status
- ✓ returns alerts with required shape fields
- ✓ requires a valid tenant ID
- ✓ requires a valid role

Verified by: automated test suite (12/12 passed)
Verified date: 2026-04-27

