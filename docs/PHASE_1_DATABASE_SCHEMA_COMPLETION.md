# Infamous Freight — Phase 1 Database Schema Completion

Date: April 26, 2026
Status: Phase 1 schema committed; Phase 2 migration/CI validation path committed

## Summary

Phase 1 extends the Prisma database schema for freight operations workflows.

Committed schema update:

- `apps/api/prisma/schema.prisma`
- Commit: `d61d76d088aa619907b14bc15157437e4b0509f4`

Committed baseline migration:

- `apps/api/prisma/migrations/20260425000000_baseline_schema/migration.sql`
- Commit: `57e3d35bcb4678728022edc508594a0c70f7e05b`

Committed freight operations migration:

- `apps/api/prisma/migrations/20260426000000_add_freight_operations_schema/migration.sql`
- Commit: `090f7fedb3e2d4af221570882f0469985e93505f`

Committed Phase 2 validation workflow:

- `.github/workflows/phase-2-prisma-validation.yml`
- Commit: `81ce0381a2ce9ef505b19c6a5654445f671b8cf7`

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

## Phase 2 — Migration and validation

### Completed repo-side

- Schema committed.
- Baseline migration committed for clean database replay.
- Freight operations migration committed.
- GitHub Actions validation workflow committed.

### GitHub Actions validation

The workflow `.github/workflows/phase-2-prisma-validation.yml` runs with a PostgreSQL 16 service and executes:

```bash
npm --prefix apps/api exec prisma format --schema prisma/schema.prisma --check
npm --prefix apps/api exec prisma validate --schema prisma/schema.prisma
npm --prefix apps/api exec prisma migrate deploy --schema prisma/schema.prisma
npm run prisma:generate
npm --prefix apps/api run build
npm --prefix apps/api run test
```

It can be triggered manually from GitHub Actions through `workflow_dispatch`.

### Production migration warning

For an existing production database that already has the baseline tables, do not replay the baseline migration against production. Mark the baseline as applied first, then deploy the freight operations migration.

Production-safe sequence:

```bash
npm --prefix apps/api exec prisma migrate resolve --applied 20260425000000_baseline_schema --schema prisma/schema.prisma
npm --prefix apps/api exec prisma migrate deploy --schema prisma/schema.prisma
```

Run this only after staging validation passes.

## Phase 3 — API service layer

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

## Phase 4 — Workflow integration

Wire models into operating flows:

- Quote to load conversion
- Load assignment acceptance/rejection
- Dispatch confirmation
- Shipment tracking updates
- POD verification
- Carrier payment lifecycle
- KPI rollups
- Load board post lifecycle

## Phase 5 — UI and launch validation

Expose the new workflows in the web app and validate:

- Dispatcher workflow
- Carrier workflow
- Document/POD workflow
- Payment status workflow
- Operational reporting workflow
- Production migration readiness

## Notes

The schema, baseline migration, freight operations migration, and validation workflow are committed. Production database migration remains gated on a passing staging/CI validation run.
