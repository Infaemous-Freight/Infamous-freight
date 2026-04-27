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

- Shipment statuses: `booked`, `assigned`, `picked_up`, `in_transit`, `delayed`, `exception`, `delivered`, `closed` — defined in `docs/production-operations/DISPATCH_WORKFLOW.md` under Shipment Tracking Workflow.
- Status update owner: Dispatcher or Admin role only.
- Customer visibility rules: `booked`, `picked_up`, `in_transit`, `delayed`, `exception`, and `delivered` are customer-visible. `assigned` is internal only. Internal notes are never exposed to customers. See DISPATCH_WORKFLOW.md for full rules.
- Delay messaging process: Dispatcher sets status to `delayed`, enters revised ETA and reason, automated SMS sent to shipper, dispatcher confirms by phone. See DISPATCH_WORKFLOW.md for full process.
- Test load ID: TEST-TRACKING-001
- Test result: Status progression `booked` → `assigned` → `picked_up` → `in_transit` → `delivered` verified via `POST /api/workflows/loads/:loadId/tracking-updates`. Each status recorded with correct timestamp. Customer-visible labels confirmed against defined rules.
- Verified by: Dispatcher (operations team)
- Verified date: 2026-04-27

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
