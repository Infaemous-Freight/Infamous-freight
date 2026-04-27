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

- Application route or endpoint: `POST /api/carriers/:id/approve`, `POST /api/carriers/:id/reject`
- Document upload path: Document model (`apps/api/prisma/schema.prisma` — `Document` with `type`, `fileUrl`, `status`, `expiryDate` fields associated to `Carrier`)
- Carrier record destination: `Carrier` model with `approvalStatus` field (PENDING / APPROVED / REJECTED)
- Approval workflow: Carrier defaults to `approvalStatus: PENDING`. Admin/dispatcher calls `POST /api/carriers/:id/approve` to set `approvalStatus: APPROVED`. Only approved carriers can be assigned to loads — attempting assignment for a non-approved carrier returns HTTP 422 `carrier_not_approved`.
- Test application ID: See `apps/api/test/mvp-carrier-approval.test.ts`
- Test result: All 4 carrier approval tests pass — blocked assignment (PENDING), approve carrier, allow assignment after approval, reject and re-block; plus updated `freight-workflows.test.ts` to approve carrier before load assignment (34 total tests passing)
- Verified by: @copilot (automated test suite)
- Verified date: 2026-04-27

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
