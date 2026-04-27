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

- Shipment statuses: pending, carrier_assigned, dispatched, at_pickup, loaded, in_transit, at_delivery, delivered, pod_received, invoiced, paid, closed, exception
- Status update owner: Dispatcher via `POST /api/loads/:loadId/status`
- Customer visibility rules: Tracking updates include `visibilityLevel` field ('customer' or 'internal'). The `GET /api/tracking/:loadId` endpoint returns only customer-visible updates with internal fields (notes, visibilityLevel, tenantId) stripped.
- Delay messaging process: Exception status supported. Internal notes (visibilityLevel: 'internal') can document delays without exposing them to customers.
- Dispatcher tracking endpoint: `GET /api/loads/:loadId/tracking-updates` (requires tenant + role headers, returns all updates)
- Customer tracking endpoint: `GET /api/tracking/:loadId` (public, returns only customer-visible updates, strips internal fields)
- Test load ID: See `apps/api/test/mvp-dispatch-tracking.test.ts`
- Test result: 5/5 tests pass — status progression (pending → dispatched → at_pickup → in_transit → at_delivery → delivered), invalid status rejection, tenant isolation, customer/internal filtering
- Verified by: Automated integration tests
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
