-- CreateTable
CREATE TABLE "DispatchIncident" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "loadId" TEXT,
  "severity" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DispatchIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatchAlert" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'created',
  "message" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DispatchAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatchSlaTimer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deadlineAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DispatchSlaTimer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HosRiskEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "loadId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "severity" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HosRiskEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchIncident_organizationId_status_idx" ON "DispatchIncident"("organizationId", "status");
CREATE INDEX "DispatchIncident_organizationId_createdAt_idx" ON "DispatchIncident"("organizationId", "createdAt");
CREATE INDEX "DispatchIncident_loadId_idx" ON "DispatchIncident"("loadId");
CREATE INDEX "DispatchAlert_organizationId_createdAt_idx" ON "DispatchAlert"("organizationId", "createdAt");
CREATE INDEX "DispatchAlert_incidentId_idx" ON "DispatchAlert"("incidentId");
CREATE INDEX "DispatchAlert_status_idx" ON "DispatchAlert"("status");
CREATE INDEX "DispatchSlaTimer_organizationId_status_idx" ON "DispatchSlaTimer"("organizationId", "status");
CREATE INDEX "DispatchSlaTimer_incidentId_status_idx" ON "DispatchSlaTimer"("incidentId", "status");
CREATE INDEX "DispatchSlaTimer_deadlineAt_idx" ON "DispatchSlaTimer"("deadlineAt");
CREATE INDEX "HosRiskEvent_organizationId_createdAt_idx" ON "HosRiskEvent"("organizationId", "createdAt");
CREATE INDEX "HosRiskEvent_loadId_createdAt_idx" ON "HosRiskEvent"("loadId", "createdAt");
CREATE INDEX "HosRiskEvent_severity_idx" ON "HosRiskEvent"("severity");

ALTER TABLE "DispatchAlert" ADD CONSTRAINT "DispatchAlert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DispatchIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispatchSlaTimer" ADD CONSTRAINT "DispatchSlaTimer_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DispatchIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
