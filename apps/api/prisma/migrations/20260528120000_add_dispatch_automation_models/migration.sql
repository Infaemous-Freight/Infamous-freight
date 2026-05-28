-- Dispatch automation phase 1 data models
CREATE TABLE "DispatchIncident" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "loadId" TEXT,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "summary" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DispatchIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatchAlert" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "incidentId" TEXT,
  "alertType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "acknowledgedAt" TIMESTAMP(3),
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DispatchAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatchSlaTimer" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "incidentId" TEXT,
  "timerType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "breachedAt" TIMESTAMP(3),
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DispatchSlaTimer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HosRiskEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "loadId" TEXT,
  "driverId" TEXT,
  "hosRemainingMinutes" INTEGER NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HosRiskEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchIncident_tenantId_createdAt_idx" ON "DispatchIncident"("tenantId", "createdAt");
CREATE INDEX "DispatchIncident_tenantId_status_idx" ON "DispatchIncident"("tenantId", "status");
CREATE INDEX "DispatchIncident_loadId_idx" ON "DispatchIncident"("loadId");
CREATE INDEX "DispatchAlert_tenantId_status_createdAt_idx" ON "DispatchAlert"("tenantId", "status", "createdAt");
CREATE INDEX "DispatchAlert_incidentId_idx" ON "DispatchAlert"("incidentId");
CREATE INDEX "DispatchSlaTimer_tenantId_status_dueAt_idx" ON "DispatchSlaTimer"("tenantId", "status", "dueAt");
CREATE INDEX "DispatchSlaTimer_incidentId_idx" ON "DispatchSlaTimer"("incidentId");
CREATE INDEX "HosRiskEvent_tenantId_eventAt_idx" ON "HosRiskEvent"("tenantId", "eventAt");
CREATE INDEX "HosRiskEvent_tenantId_riskLevel_idx" ON "HosRiskEvent"("tenantId", "riskLevel");
CREATE INDEX "HosRiskEvent_loadId_idx" ON "HosRiskEvent"("loadId");
CREATE INDEX "HosRiskEvent_driverId_idx" ON "HosRiskEvent"("driverId");

ALTER TABLE "DispatchAlert"
  ADD CONSTRAINT "DispatchAlert_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "DispatchIncident"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DispatchSlaTimer"
  ADD CONSTRAINT "DispatchSlaTimer_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "DispatchIncident"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
