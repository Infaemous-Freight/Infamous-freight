# Infamous Freight — Phase 1 Database Schema Completion

Date: April 26, 2026
Status: Phase 1 complete — ready for Phases 2–5

## Summary

Phase 1 extends the Prisma database schema for freight operations workflows.

Committed schema update:

- `apps/api/prisma/schema.prisma`
- Commit: `d61d76d088aa619907b14bc15157437e4b0509f4`

## Added Prisma models

### 1. QuoteRequest

Purpose: Quote management.

Core fields:

- `carrierId`
- `brokerName`
- `originCity`
- `destCity`
- `freightType`
- `weight`
- `pickupDate`
- `deliveryDeadline`
- `shipperRate`
- `carrierCost`
- `profitMargin`
- `status`
- `expiresAt`

Indexes:

- `carrierId`
- `status`

### 2. LoadAssignment

Purpose: Carrier assignment and load acceptance workflow.

Core fields:

- `loadId`
- `carrierId`
- `rateConfirmed`
- `acceptedAt`
- `rejectedAt`
- `status`

Indexes:

- `carrierId`
- `status`

### 3. LoadDispatch

Purpose: Dispatch execution details.

Core fields:

- `loadId`
- `carrierId`
- `pickupContactName`
- `pickupContactPhone`
- `pickupAppointment`
- `deliveryContactName`
- `deliveryContactPhone`
- `deliveryAppointment`
- `commodityInfo`
- `status`
- `dispatchedAt`
- `confirmedAt`

Indexes:

- `carrierId`
- `status`

### 4. ShipmentTracking

Purpose: Real-time shipment tracking events and POD status.

Core fields:

- `loadId`
- `status`
- `latitude`
- `longitude`
- `pickupConfirmedAt`
- `deliveryETA`
- `deliveredAt`
- `podReceived`
- `podVerified`

Indexes:

- `loadId`
- `status`

### 5. DeliveryConfirmation

Purpose: Delivery verification.

Core fields:

- `loadId`
- `podSignature`
- `podDate`
- `deliveryTime`
- `verifiedAt`

### 6. CarrierPayment

Purpose: Carrier payment tracking.

Core fields:

- `loadId`
- `carrierId`
- `amount`
- `paymentMethod`
- `status`
- `paymentDate`

Indexes:

- `carrierId`
- `status`

### 7. RateAgreement

Purpose: Carrier rate management.

Core fields:

- `carrierId`
- `baseRate`
- `fuelSurcharge`
- `effectiveDate`
- `expiryDate`

### 8. OperationalMetric

Purpose: KPI and operating metric tracking.

Core fields:

- `date`
- `period`
- `loadsBooked`
- `grossMargin`
- `onTimePickup`
- `onTimeDelivery`
- `daysOutstanding`

Indexes:

- `date`
- `period`

### 9. LoadBoardPost

Purpose: Load board posting and external board tracking.

Core fields:

- `loadId`
- `board`
- `boardPostId`
- `postedAt`
- `expiresAt`
- `status`

Indexes:

- `board`
- `status`

## Existing model relationship updates

### Carrier

Added relations:

- `quoteRequests`
- `loadAssignments`
- `loadDispatches`
- `carrierPayments`
- `rateAgreement`

### Load

Added relations:

- `loadAssignment`
- `loadDispatch`
- `shipmentTracking`
- `deliveryConfirmation`
- `carrierPayments`
- `loadBoardPost`

## Required next steps

### Phase 2 — Migration and validation

1. Run Prisma format:

   ```bash
   npm --prefix apps/api exec prisma format --schema prisma/schema.prisma
   ```

2. Generate migration locally or in CI:

   ```bash
   npm --prefix apps/api exec prisma migrate dev --name add-freight-operations-schema --schema prisma/schema.prisma
   ```

3. Regenerate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Run backend type checks and tests:

   ```bash
   npm --prefix apps/api run build
   npm --prefix apps/api run test
   ```

### Phase 3 — API service layer

Implement CRUD/service modules for:

- Quote requests
- Load assignments
- Load dispatches
- Shipment tracking
- Delivery confirmations
- Carrier payments
- Rate agreements
- Operational metrics
- Load board posts

### Phase 4 — Workflow integration

Wire models into operating flows:

- Quote to load conversion
- Load assignment acceptance/rejection
- Dispatch confirmation
- Shipment tracking updates
- POD verification
- Carrier payment lifecycle
- KPI rollups
- Load board post lifecycle

### Phase 5 — UI and launch validation

Expose the new workflows in the web app and validate:

- Dispatcher workflow
- Carrier workflow
- Document/POD workflow
- Payment status workflow
- Operational reporting workflow
- Production migration readiness

## Notes

The schema update is committed, but the migration file still needs to be generated against the target database environment. Do not apply production migration until the generated SQL is reviewed.
