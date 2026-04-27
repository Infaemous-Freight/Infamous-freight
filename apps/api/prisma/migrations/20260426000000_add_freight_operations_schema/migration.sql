-- Phase 1 freight operations schema expansion
-- Adds quote, assignment, dispatch, tracking, delivery confirmation, carrier payment,
-- rate agreement, operational metric, and load board posting tables.

CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destCity" TEXT NOT NULL,
    "freightType" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "deliveryDeadline" TIMESTAMP(3),
    "shipperRate" DOUBLE PRECISION NOT NULL,
    "carrierCost" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoadAssignment" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "rateConfirmed" DOUBLE PRECISION NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoadDispatch" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "pickupContactName" TEXT,
    "pickupContactPhone" TEXT,
    "pickupAppointment" TIMESTAMP(3),
    "deliveryContactName" TEXT,
    "deliveryContactPhone" TEXT,
    "deliveryAppointment" TIMESTAMP(3),
    "commodityInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dispatchedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadDispatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShipmentTracking" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_transit',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pickupConfirmedAt" TIMESTAMP(3),
    "deliveryETA" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "podReceived" BOOLEAN NOT NULL DEFAULT false,
    "podVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentTracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryConfirmation" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "podSignature" TEXT,
    "podDate" TIMESTAMP(3),
    "deliveryTime" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CarrierPayment" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateAgreement" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "fuelSurcharge" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "loadsBooked" INTEGER NOT NULL DEFAULT 0,
    "grossMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimePickup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimeDelivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysOutstanding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoadBoardPost" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "boardPostId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'posted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadBoardPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoadAssignment_loadId_key" ON "LoadAssignment"("loadId");
CREATE UNIQUE INDEX "LoadDispatch_loadId_key" ON "LoadDispatch"("loadId");
CREATE UNIQUE INDEX "DeliveryConfirmation_loadId_key" ON "DeliveryConfirmation"("loadId");
CREATE UNIQUE INDEX "RateAgreement_carrierId_key" ON "RateAgreement"("carrierId");
CREATE UNIQUE INDEX "LoadBoardPost_loadId_key" ON "LoadBoardPost"("loadId");

CREATE INDEX "QuoteRequest_carrierId_idx" ON "QuoteRequest"("carrierId");
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");
CREATE INDEX "LoadAssignment_carrierId_idx" ON "LoadAssignment"("carrierId");
CREATE INDEX "LoadAssignment_status_idx" ON "LoadAssignment"("status");
CREATE INDEX "LoadDispatch_carrierId_idx" ON "LoadDispatch"("carrierId");
CREATE INDEX "LoadDispatch_status_idx" ON "LoadDispatch"("status");
CREATE INDEX "ShipmentTracking_loadId_idx" ON "ShipmentTracking"("loadId");
CREATE INDEX "ShipmentTracking_status_idx" ON "ShipmentTracking"("status");
CREATE INDEX "CarrierPayment_carrierId_idx" ON "CarrierPayment"("carrierId");
CREATE INDEX "CarrierPayment_status_idx" ON "CarrierPayment"("status");
CREATE INDEX "OperationalMetric_date_idx" ON "OperationalMetric"("date");
CREATE INDEX "OperationalMetric_period_idx" ON "OperationalMetric"("period");
CREATE INDEX "LoadBoardPost_board_idx" ON "LoadBoardPost"("board");
CREATE INDEX "LoadBoardPost_status_idx" ON "LoadBoardPost"("status");

ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadAssignment" ADD CONSTRAINT "LoadAssignment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadAssignment" ADD CONSTRAINT "LoadAssignment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadDispatch" ADD CONSTRAINT "LoadDispatch_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadDispatch" ADD CONSTRAINT "LoadDispatch_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentTracking" ADD CONSTRAINT "ShipmentTracking_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryConfirmation" ADD CONSTRAINT "DeliveryConfirmation_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarrierPayment" ADD CONSTRAINT "CarrierPayment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarrierPayment" ADD CONSTRAINT "CarrierPayment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RateAgreement" ADD CONSTRAINT "RateAgreement_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadBoardPost" ADD CONSTRAINT "LoadBoardPost_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
