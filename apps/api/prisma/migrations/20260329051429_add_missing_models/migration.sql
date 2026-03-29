-- Migration: add_missing_models
-- Adds AI/ML, logistics, payment, and billing models

-- AI Decision Logs
CREATE TABLE "ai_decision_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "reasonCodes" JSONB,
    "inputSnapshot" JSONB,
    "outputSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_decision_logs_tenantId_idx" ON "ai_decision_logs"("tenantId");
CREATE INDEX "ai_decision_logs_entityId_idx" ON "ai_decision_logs"("entityId");
CREATE INDEX "ai_decision_logs_module_idx" ON "ai_decision_logs"("module");

-- Carrier Scores
CREATE TABLE "carrier_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancelRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anomalyFlags" JSONB,
    "explanation" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carrier_scores_tenantId_driverId_key" ON "carrier_scores"("tenantId", "driverId");
CREATE INDEX "carrier_scores_tenantId_idx" ON "carrier_scores"("tenantId");
CREATE INDEX "carrier_scores_driverId_idx" ON "carrier_scores"("driverId");

-- Pricing Snapshots
CREATE TABLE "pricing_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "recommendedRateCents" INTEGER NOT NULL,
    "acceptanceProbability" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_snapshots_tenantId_idx" ON "pricing_snapshots"("tenantId");
CREATE INDEX "pricing_snapshots_loadId_idx" ON "pricing_snapshots"("loadId");

-- Prediction Events
CREATE TABLE "prediction_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "severity" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prediction_events_tenantId_idx" ON "prediction_events"("tenantId");
CREATE INDEX "prediction_events_entityId_idx" ON "prediction_events"("entityId");

-- Loads
CREATE TABLE "loads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipperId" TEXT,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "originCity" TEXT,
    "destCity" TEXT,
    "priceUsd" DECIMAL(10,2),
    "description" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loads_tenantId_idx" ON "loads"("tenantId");
CREATE INDEX "loads_status_idx" ON "loads"("status");
CREATE INDEX "loads_driverId_idx" ON "loads"("driverId");

-- Dispatches
CREATE TABLE "dispatches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dispatches_tenantId_idx" ON "dispatches"("tenantId");
CREATE INDEX "dispatches_loadId_idx" ON "dispatches"("loadId");
CREATE INDEX "dispatches_driverId_idx" ON "dispatches"("driverId");

-- Location Pings
CREATE TABLE "location_pings" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "driverId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "location_pings_orgId_idx" ON "location_pings"("orgId");
CREATE INDEX "location_pings_shipmentId_idx" ON "location_pings"("shipmentId");

-- Shipment Events
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipment_events_orgId_idx" ON "shipment_events"("orgId");
CREATE INDEX "shipment_events_shipmentId_idx" ON "shipment_events"("shipmentId");

-- Tenants
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- Freight Payments (new payment model for tenant-scoped payment processing)
CREATE TABLE "freight_payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "loadId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "checkoutUrl" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeClientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freight_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "freight_payments_tenantId_idx" ON "freight_payments"("tenantId");
CREATE INDEX "freight_payments_userId_idx" ON "freight_payments"("userId");
CREATE INDEX "freight_payments_status_idx" ON "freight_payments"("status");

-- Transactions
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_paymentId_idx" ON "transactions"("paymentId");

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "freight_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Load Payments
CREATE TABLE "load_payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "load_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "load_payments_tenantId_idx" ON "load_payments"("tenantId");
CREATE INDEX "load_payments_loadId_idx" ON "load_payments"("loadId");
CREATE INDEX "load_payments_paymentId_idx" ON "load_payments"("paymentId");

ALTER TABLE "load_payments" ADD CONSTRAINT "load_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "freight_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Overage Charges
CREATE TABLE "overage_charges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "ratePerUnit" DECIMAL(10,4) NOT NULL,
    "totalCharge" DECIMAL(10,2) NOT NULL,
    "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overage_charges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "overage_charges_userId_idx" ON "overage_charges"("userId");
CREATE INDEX "overage_charges_metricType_idx" ON "overage_charges"("metricType");
