-- Persist safe, unauthenticated public shipment tracking records.
CREATE TABLE IF NOT EXISTS "PublicShipment" (
    "trackingNumber" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Quote received',
    "pickupDate" TEXT,
    "deliveryDate" TEXT,
    "eta" TEXT,
    "equipment" TEXT,
    "publicNotes" TEXT,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicShipment_pkey" PRIMARY KEY ("trackingNumber")
);

CREATE INDEX IF NOT EXISTS "PublicShipment_status_idx" ON "PublicShipment"("status");
CREATE INDEX IF NOT EXISTS "PublicShipment_updatedAt_idx" ON "PublicShipment"("updatedAt");
