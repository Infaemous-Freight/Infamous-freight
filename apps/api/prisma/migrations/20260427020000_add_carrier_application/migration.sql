-- CreateTable
CREATE TABLE "CarrierApplication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "mcNumber" TEXT NOT NULL,
    "dotNumber" TEXT NOT NULL,
    "ein" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "equipmentTypes" TEXT NOT NULL DEFAULT '[]',
    "numberOfTrucks" INTEGER NOT NULL DEFAULT 0,
    "numberOfTrailers" INTEGER NOT NULL DEFAULT 0,
    "factoringCompany" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarrierApplication_tenantId_idx" ON "CarrierApplication"("tenantId");

-- CreateIndex
CREATE INDEX "CarrierApplication_status_idx" ON "CarrierApplication"("status");

-- CreateIndex
CREATE INDEX "CarrierApplication_mcNumber_idx" ON "CarrierApplication"("mcNumber");
