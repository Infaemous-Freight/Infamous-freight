# Production Readiness Evidence

Use this file to record evidence before closing launch-readiness issues.

Fields marked **PENDING** require external real-world confirmation before the related issue can be closed.

## Launch Gate

Main tracking issue: #1589

## Compliance Evidence

Related issue: #1583

- Legal entity status: PENDING — confirm LLC formation and legal entity name
- EIN status: PENDING — confirm EIN has been issued by the IRS
- FMCSA broker authority status: PENDING — confirm broker authority application has been filed and active authority number is assigned
- BOC-3 status: PENDING — confirm BOC-3 process agent filing has been submitted to FMCSA
- BMC-84 or BMC-85 status: PENDING — confirm surety bond (BMC-84) or trust fund agreement (BMC-85) is in place
- Evidence location: `docs/production-operations/COMPLIANCE_CHECKLIST.md` documents all required filings; actual filing confirmations must be stored by the compliance owner and linked here
- Verified by: PENDING — assign compliance owner before any freight brokerage activity
- Verified date: PENDING

## Carrier Packet Evidence

Related issue: #1584

- Storage location: `Document` model via `POST /documents` API; documents stored at the URL recorded in the `fileUrl` field, organized by `relatedEntityType: "carrier"` and `relatedEntityId`
- Broker-carrier agreement source: Required document collected at vetting step 7 per `docs/production-operations/CARRIER_VETTING_SOP.md`; `agreementStatus` field on `Carrier` model must be verified before approval
- W-9 process: Collected at vetting step 6 per carrier vetting SOP; `w9Status` field on `Carrier` model must be verified before approval
- Insurance process: Active authority confirmed at step 2, cargo coverage at step 4, auto liability at step 5 per carrier vetting SOP; `insuranceStatus` field on `Carrier` model must be verified before approval
- Approval owner: Operations lead; approval requires W-9, insurance, and agreement status all verified, then `POST /carriers/:id/approve`
- Carrier statuses: PENDING | NEEDS_DOCUMENTS | APPROVED | REJECTED | EXPIRED (defined in `CarrierApprovalStatus` enum in MVP Technical Implementation Spec)
- Test carrier record: PENDING — submit one sample carrier application, confirm documents are uploaded, confirm carrier record is created, confirm approval workflow produces APPROVED status, and record carrier ID here
- Verified by: PENDING
- Verified date: PENDING

## Quote Intake Evidence

Related issue: #1585 (closed 2026-04-27)

- Quote route or endpoint: `POST /quote-requests`
- Lead destination: `QuoteRequest` model in PostgreSQL database; fields include `shipperId`, `pickupLocation`, `deliveryLocation`, `commodity`, `freightType`, `weight`, `equipmentNeeded`, `pickupDate`, `deliveryDeadline`, and `assignedSalesRepId`
- Internal notification path: Quote assigned to sales rep via `assignedSalesRepId`; operations lead reviews new quotes in the quote requests list during morning review per Daily Operations SOP
- Follow-up owner: Operations lead; follow-up per `docs/production-operations/DAILY_OPERATIONS_SOP.md` morning check-new-quote-requests step
- Test quote ID: Verified — issue #1585 closed with confirmed quote intake workflow
- Test result: PASS — quote intake route confirmed end-to-end
- Verified by: MrMiless44
- Verified date: 2026-04-27

## Carrier Onboarding Evidence

Related issue: #1586

- Application route or endpoint: `POST /carriers` — creates a `Carrier` record with required fields: `companyName`, `mcNumber`, `dotNumber`, `contactName`, `email`, `phone`, `equipmentType`, `operatingStates`
- Document upload path: `POST /documents` with `relatedEntityType: "carrier"` and `relatedEntityId` set to the carrier ID; document types include broker-carrier agreement, W-9, certificate of insurance
- Carrier record destination: `Carrier` model in PostgreSQL database; initial `approvalStatus` set to PENDING
- Approval workflow: (1) Carrier submits application via `POST /carriers` → status PENDING; (2) Operations uploads or receives documents via `POST /documents`; (3) Operations verifies W-9, insurance, and agreement → updates `w9Status`, `insuranceStatus`, `agreementStatus`; (4) Operations approves via `POST /carriers/:id/approve` → status APPROVED; (5) Approved carrier is eligible for load assignment per business rule 1 in MVP Technical Implementation Spec
- Test application ID: PENDING — submit one test carrier application, run full vetting workflow, confirm APPROVED status, and record carrier ID here
- Test result: PENDING
- Verified by: PENDING
- Verified date: PENDING

## Tracking Evidence

Related issue: #1587

- Shipment statuses: PENDING | CARRIER_ASSIGNED | DISPATCHED | AT_PICKUP | LOADED | IN_TRANSIT | AT_DELIVERY | DELIVERED | POD_RECEIVED | INVOICED | PAID | CLOSED | EXCEPTION (defined in `LoadStatus` enum in MVP Technical Implementation Spec)
- Status update owner: Dispatcher; updates submitted via `POST /loads/operations/:id/tracking-updates` creating a `TrackingUpdate` record with `status`, `location`, `eta`, `notes`, and `updatedById`
- Customer visibility rules: Customer-facing tracking accessed via `GET /tracking/:trackingNumber`; internal notes, rates, gross margin, and carrier private data are filtered out per business rule 7 in MVP Technical Implementation Spec; `visibilityLevel` field on `TrackingUpdate` controls visibility scope
- Delay messaging process: EXCEPTION status on `TrackingUpdate` triggers shipper notification; dispatcher confirms delay and communicates ETA per in-transit steps in `docs/production-operations/DISPATCH_WORKFLOW.md`
- Test load ID: PENDING — run one test load through status progression from DISPATCHED to DELIVERED, confirm customer-visible tracking filters correctly, and record load ID here
- Test result: PENDING
- Verified by: PENDING
- Verified date: PENDING

## Document Retention Evidence

Related issue: #1588

- Storage system: Cloud storage with URL recorded in `fileUrl` field of the `Document` model in PostgreSQL; document records track `documentType`, `relatedEntityType`, `relatedEntityId`, `expirationDate`, `uploadedById`, `verificationStatus`, and `createdAt`
- Folder structure: Documents organized by `relatedEntityType` (carrier, load, invoice, compliance) and `relatedEntityId`; each entity's documents are grouped by type
- Naming convention: Document records identified by `documentType` field (e.g., broker-carrier agreement, W-9, certificate of insurance, bill of lading, proof of delivery, rate confirmation); file names should follow the pattern `{entityType}-{entityId}-{documentType}-{date}`
- Retention period: PENDING — confirm legal retention period with compliance owner; freight industry standard is 3 years for bills of lading and proof of delivery, 7 years for contracts and financial records; `expirationDate` field on `Document` model enforces per-document expiry
- Access owner: Operations lead; role-based access enforced via `RBACModule`; shippers cannot view internal documents; carriers cannot view other carrier records per business rules in MVP Technical Implementation Spec
- Backup process: PENDING — confirm cloud storage provider backup configuration and frequency with infrastructure owner; backup policy must be linked here before closing issue #1588
- Verified by: PENDING
- Verified date: PENDING

## Closure Rule

Do not close #1589 until #1583 through #1588 have documented evidence and are closed.

Fields marked PENDING must be replaced with confirmed evidence before the related issue can be closed.
