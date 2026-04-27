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

## POD Upload and Invoice Generation Evidence

Related issue: #1593

- POD upload endpoint: `POST /api/workflows/loads/:loadId/upload-pod` (requires `x-tenant-id` and `x-user-role` dispatcher or higher)
- POD source: Creates a `deliveryConfirmation` record linked to the load; also accepted from `POST /api/workflows/loads/:loadId/verify-delivery`
- Load close endpoint: `POST /api/workflows/loads/:loadId/close` — returns 422 `pod_required_to_close_load` if no POD exists
- Invoice creation endpoint: `POST /api/workflows/loads/:loadId/invoices` — returns 422 `pod_required_to_create_invoice` if no POD exists
- Invoice send endpoint: `POST /api/workflows/invoices/:id/send` — returns 422 `pod_required_to_send_invoice` if POD is not attached
- Gross margin calculation: `grossMargin = shipperRate - carrierRate`; `grossMarginPercentage = (grossMargin / shipperRate) * 100`
- Invoice fields: `shipperRate`, `carrierRate`, `grossMargin`, `grossMarginPercentage`, `podAttached`, `status`, `invoiceNumber`, `dueDate`
- Test file: `apps/api/test/pod-invoice.test.ts`
- Test result: All 8 POD/invoice tests pass — POD gate on load close, POD gate on invoice create, POD gate on invoice send, gross margin calculation verified (e.g., shipperRate=2800, carrierRate=2250 → grossMargin=550, grossMarginPct≈19.64%), full end-to-end flow from POD upload through invoice send to load close verified
- Verified by: @copilot (automated test suite)
- Verified date: 2026-04-27

## Closure Rule

Do not close #1589 until #1583 through #1588 have documented evidence and are closed.
