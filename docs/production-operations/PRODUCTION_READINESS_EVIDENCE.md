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

- Storage location: `documents/carrier-packets/` (full packet and signed agreement), `documents/w9/` (W-9 forms), `documents/coi/` (certificates of insurance). Naming conventions and retention rules documented in `CARRIER_VETTING_SOP.md`.
- Broker-carrier agreement source: `templates/broker-carrier-agreement/` — signed copy stored at `documents/carrier-packets/<MC_NUMBER>_agreement.pdf`.
- W-9 process: Collected during carrier onboarding; stored at `documents/w9/<EIN>.pdf`; must be on file before first dispatch. See `CARRIER_VETTING_SOP.md` — W-9 Collection Process.
- Insurance process: COI required naming Infamous Freight LLC as certificate holder; minimum auto liability $1,000,000 and cargo $100,000; stored at `documents/coi/<MC_NUMBER>_coi.pdf`; 30-day renewal reminder required. See `CARRIER_VETTING_SOP.md` — Insurance Collection Process.
- Approval owner: Operations Manager — final sign-off required to move carrier from Pending to Approved.
- Carrier statuses: Pending, Approved, Rejected, Expired — defined in `CARRIER_VETTING_SOP.md` — Carrier Statuses.
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
