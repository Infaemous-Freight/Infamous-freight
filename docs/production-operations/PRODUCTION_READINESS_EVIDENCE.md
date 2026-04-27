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

- Storage system: Supabase Storage — private bucket `freight-documents`; file metadata linked to `documents` table in Supabase Postgres
- Folder structure: `freight-documents/loads/{load_id}/{doc_type}/`, `carriers/{carrier_id}/`, `customers/{customer_id}/` — see `docs/production-operations/DOCUMENT_RETENTION_POLICY.md`
- Naming convention: `{DOCUMENT_TYPE}-{LOAD_OR_ENTITY_ID}-{YYYYMMDD}.{ext}` (e.g. `BOL-LOAD-20240515-001.pdf`) — see `docs/production-operations/DOCUMENT_RETENTION_POLICY.md`
- Retention period: 7 years for BOL, POD, rate confirmations, agreements, W-9, invoices, and payment records (FMCSA 49 CFR 371.3 and IRS guidance) — see `docs/production-operations/DOCUMENT_RETENTION_POLICY.md`
- Access owner: Operations Manager (Infamous Freight); role-based access enforced in application
- Backup process: Supabase automated daily backups with point-in-time recovery; secondary scheduled export to separate cloud backup; monthly integrity verification by operations owner — see `docs/BACKUP_RESTORE_VERIFICATION.md`
- Verified by:
- Verified date:

## Closure Rule

Do not close #1589 until #1583 through #1588 have documented evidence and are closed.
