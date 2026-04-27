# MVP Technical Implementation Spec

This spec converts the GitHub-native MVP build plan into concrete implementation work for the existing monorepo.

## Goal

Build the minimum freight operating system that can run this loop:

```text
Quote Request -> Quote Review -> Load Creation -> Carrier Assignment -> Dispatch -> Tracking -> POD Upload -> Invoice
```

## Backend Modules

Create or verify these API modules:

- `quote-requests`
- `shippers`
- `carriers`
- `loads`
- `tracking-updates`
- `documents`
- `invoices`
- `compliance-evidence`
- `rbac`

## Core Database Entities

### Shipper

Required fields:

- id
- companyName
- contactName
- email
- phone
- billingAddress
- status
- notes
- createdAt
- updatedAt

### QuoteRequest

Required fields:

- id
- quoteNumber
- shipperId
- pickupLocation
- deliveryLocation
- commodity
- freightType
- weight
- dimensions
- equipmentNeeded
- pickupDate
- deliveryDeadline
- specialInstructions
- status
- quotedAmount
- estimatedCarrierCost
- targetMargin
- assignedSalesRepId
- convertedLoadId
- createdAt
- updatedAt

### Carrier

Required fields:

- id
- companyName
- mcNumber
- dotNumber
- contactName
- email
- phone
- equipmentType
- operatingStates
- insuranceStatus
- w9Status
- agreementStatus
- approvalStatus
- notes
- createdAt
- updatedAt

### Load

Required fields:

- id
- loadNumber
- quoteRequestId
- shipperId
- carrierId
- driverName
- driverPhone
- truckNumber
- trailerNumber
- pickupLocation
- deliveryLocation
- commodity
- weight
- equipmentType
- pickupAppointment
- deliveryAppointment
- shipperRate
- carrierRate
- grossMargin
- grossMarginPercentage
- status
- dispatcherId
- trackingNumber
- podStatus
- invoiceStatus
- createdAt
- updatedAt

### TrackingUpdate

Required fields:

- id
- loadId
- status
- location
- eta
- notes
- visibilityLevel
- updatedById
- createdAt

### Document

Required fields:

- id
- relatedEntityType
- relatedEntityId
- documentType
- fileUrl
- expirationDate
- uploadedById
- verificationStatus
- notes
- createdAt
- updatedAt

### Invoice

Required fields:

- id
- invoiceNumber
- loadId
- shipperId
- carrierId
- invoiceAmount
- carrierPayAmount
- grossMargin
- grossMarginPercentage
- podAttached
- invoiceStatus
- paymentStatus
- dueDate
- createdAt
- updatedAt

### ComplianceEvidence

Required fields:

- id
- evidenceArea
- evidenceStatus
- evidenceLocation
- verifiedById
- verifiedDate
- notes
- createdAt
- updatedAt

## Status Enums

### QuoteStatus

- NEW
- REVIEWING
- QUOTED
- APPROVED
- REJECTED
- CONVERTED

### CarrierApprovalStatus

- PENDING
- NEEDS_DOCUMENTS
- APPROVED
- REJECTED
- EXPIRED

### LoadStatus

- PENDING
- CARRIER_ASSIGNED
- DISPATCHED
- AT_PICKUP
- LOADED
- IN_TRANSIT
- AT_DELIVERY
- DELIVERED
- POD_RECEIVED
- INVOICED
- PAID
- CLOSED
- EXCEPTION

### DocumentStatus

- PENDING
- VERIFIED
- REJECTED
- EXPIRED

### InvoiceStatus

- DRAFT
- SENT
- PENDING
- PAID
- OVERDUE
- DISPUTED

### ComplianceEvidenceStatus

- MISSING
- PENDING_REVIEW
- VERIFIED
- BLOCKED

## Business Rules

1. Only approved carriers can be assigned to loads.
2. Carrier approval requires W-9, insurance, and agreement status to be verified.
3. A load cannot move to closed unless POD status is received.
4. An invoice cannot be sent unless POD is attached.
5. Gross margin must calculate as `shipperRate - carrierRate`.
6. Gross margin percentage must calculate as `grossMargin / shipperRate * 100`.
7. Customer-visible tracking must exclude internal notes, rates, margins, and carrier private data.
8. Production readiness remains blocked until compliance evidence is verified.

## Backend Endpoints

### Quote Requests

- `POST /quote-requests`
- `GET /quote-requests`
- `GET /quote-requests/:id`
- `PATCH /quote-requests/:id`
- `POST /quote-requests/:id/convert-to-load`

### Carriers

- `POST /carriers`
- `GET /carriers`
- `GET /carriers/:id`
- `PATCH /carriers/:id`
- `POST /carriers/:id/approve`
- `POST /carriers/:id/reject`

### Loads

- `POST /loads`
- `GET /loads`
- `GET /loads/:id`
- `PATCH /loads/:id`
- `POST /loads/:id/assign-carrier`
- `POST /loads/:id/status`
- `POST /loads/:id/close`

### Tracking Updates

- `POST /loads/:id/tracking-updates`
- `GET /loads/:id/tracking-updates`
- `GET /tracking/:trackingNumber`

### Documents

- `POST /documents`
- `GET /documents`
- `PATCH /documents/:id/verify`
- `PATCH /documents/:id/reject`

### Invoices

- `POST /loads/:id/invoices`
- `GET /invoices`
- `GET /invoices/:id`
- `PATCH /invoices/:id`
- `POST /invoices/:id/send`

### Compliance Evidence

- `POST /compliance-evidence`
- `GET /compliance-evidence`
- `PATCH /compliance-evidence/:id`

## Frontend Screens

Prioritize these screens first:

1. Quote Requests list and detail
2. Convert Quote to Load action
3. Carrier list and detail
4. Carrier approval view
5. Load list and detail
6. Dispatch board
7. Tracking update panel
8. POD upload panel
9. Invoice detail
10. Production readiness evidence view

## Required Tests

### Unit Tests

- Margin calculation
- Carrier assignment validation
- Carrier approval validation
- POD required before load close
- POD required before invoice send
- Customer-visible tracking filtering

### Integration Tests

- Quote request to load conversion
- Carrier approval to load assignment
- Dispatch status progression
- Tracking lookup visibility
- POD upload to invoice generation
- Compliance evidence remains blocked until verified

## MVP Exit Criteria

The MVP is complete only when:

- Issues #1592 through #1599 are closed with test evidence.
- Launch gate #1589 remains open until compliance evidence is verified.
- The evidence log is updated with test IDs and verification results.
