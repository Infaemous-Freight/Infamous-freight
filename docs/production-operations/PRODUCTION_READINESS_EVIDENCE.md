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

- Quote route or endpoint:
- Lead destination:
- Internal notification path:
- Follow-up owner:
- Test quote ID:
- Test result:
- Verified by:
- Verified date:

## Carrier Onboarding Evidence

Related issue: #1586

- Application route or endpoint: `POST /api/carrier-applications` (requires `x-tenant-id` and `x-user-role` headers)
- Document upload path: `carriers/{carrierId}/onboarding/{documentType}/{uuid}-{fileName}` in the `documents` Supabase storage bucket. Supported document types: `w9`, `broker_carrier_agreement`, `insurance_auto`, `insurance_cargo`, `other`. Implemented in `apps/api/src/uploads/upload.service.ts` (`uploadCarrierDocument`).
- Carrier record destination: In-memory store (`MemoryDataStore`) in test/development; Prisma-backed `PrismaDataStore` in production. Application fields stored: company name, MC number, DOT number, EIN, contact info, address, equipment types, fleet size, factoring company, status, timestamps, and attached documents.
- Approval workflow: `PATCH /api/carrier-applications/:id/status` — status transitions: `pending` → `under_review` → `approved` (or `rejected`). Each transition records timestamps (`reviewedAt`, `approvedAt`, `rejectedAt`) and optional `reviewNotes`. Vetting checklist: `docs/production-operations/CARRIER_VETTING_SOP.md`.
- Test application ID: Generated at runtime (UUID). Verified via `test/carrier-onboarding.test.ts` — 10 tests covering submission, field validation, list/get, full approval workflow, rejection, tenant isolation, and auth enforcement.
- Test result: All 10 carrier onboarding tests pass (`npm test` in `apps/api`).
- Verified by: @copilot
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
