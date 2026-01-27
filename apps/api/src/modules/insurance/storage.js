const { prisma } = require("../../db/prisma");

function requirePrisma() {
  if (!prisma) {
    const error = new Error("Database unavailable: Prisma client not initialized");
    error.status = 503;
    throw error;
  }
  return prisma;
}

async function listCertificates({ orgId, carrierId }) {
  const client = requirePrisma();
  return client.insuranceCertificate.findMany({
    where: {
      orgId,
      ...(carrierId ? { carrierId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createCertificate({
  orgId,
  carrierId,
  coverageType,
  documentUrl,
  providerName,
  policyNumber,
  effectiveDate,
  expirationDate,
  limitsJson,
  extractedJson,
  actorUserId,
}) {
  const client = requirePrisma();
  const certificate = await client.insuranceCertificate.create({
    data: {
      orgId,
      carrierId,
      coverageType,
      documentUrl,
      providerName,
      policyNumber,
      effectiveDate,
      expirationDate,
      limitsJson,
      extractedJson,
      status: "PENDING",
    },
  });

  await createEventLog({
    orgId,
    carrierId,
    actorUserId,
    eventType: "UPLOAD",
    payloadJson: {
      certificateId: certificate.id,
      coverageType: certificate.coverageType,
    },
  });

  return certificate;
}

async function updateCertificateStatus({
  orgId,
  id,
  status,
  actorUserId,
  rejectionReason,
}) {
  const client = requirePrisma();
  const existing = await client.insuranceCertificate.findFirst({
    where: { id, orgId },
  });

  if (!existing) {
    const error = new Error("Certificate not found");
    error.status = 404;
    throw error;
  }

  const certificate = await client.insuranceCertificate.update({
    where: { id },
    data: {
      status,
      rejectionReason: rejectionReason || null,
      verifiedAt: status === "VERIFIED" ? new Date() : undefined,
      verifiedBy: actorUserId || null,
    },
  });

  await createEventLog({
    orgId,
    carrierId: certificate.carrierId,
    actorUserId,
    eventType: status === "VERIFIED" ? "VERIFY" : "REJECT",
    payloadJson: {
      certificateId: certificate.id,
      coverageType: certificate.coverageType,
      rejectionReason: rejectionReason || undefined,
    },
  });

  return certificate;
}

async function listRequirements(orgId) {
  const client = requirePrisma();
  return client.coverageRequirement.findMany({
    where: { orgId },
    orderBy: { coverageType: "asc" },
  });
}

async function upsertRequirement({ orgId, requirement }) {
  const client = requirePrisma();
  return client.coverageRequirement.upsert({
    where: {
      orgId_coverageType: {
        orgId,
        coverageType: requirement.coverageType,
      },
    },
    create: {
      orgId,
      coverageType: requirement.coverageType,
      minLimitsJson: requirement.minLimitsJson || undefined,
      requiredForJson: requirement.requiredForJson || undefined,
      requiredStatesJson: requirement.requiredStatesJson || undefined,
      graceDays: requirement.graceDays ?? 7,
      warningDays: requirement.warningDays ?? 14,
    },
    update: {
      minLimitsJson: requirement.minLimitsJson || undefined,
      requiredForJson: requirement.requiredForJson || undefined,
      requiredStatesJson: requirement.requiredStatesJson || undefined,
      graceDays: requirement.graceDays ?? 7,
      warningDays: requirement.warningDays ?? 14,
    },
  });
}

async function upsertComplianceStatus({ orgId, carrierId, state, reasons }) {
  const client = requirePrisma();
  return client.insuranceComplianceStatus.upsert({
    where: {
      orgId_carrierId: {
        orgId,
        carrierId,
      },
    },
    update: {
      state,
      reasonsJson: reasons,
      lastEvaluatedAt: new Date(),
    },
    create: {
      orgId,
      carrierId,
      state,
      reasonsJson: reasons,
      lastEvaluatedAt: new Date(),
    },
  });
}

async function listComplianceStatuses({ orgId, carrierId }) {
  const client = requirePrisma();
  return client.insuranceComplianceStatus.findMany({
    where: {
      orgId,
      ...(carrierId ? { carrierId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function createEventLog({ orgId, carrierId, actorUserId, eventType, payloadJson }) {
  const client = requirePrisma();
  return client.insuranceEventLog.create({
    data: {
      orgId,
      carrierId,
      actorUserId,
      eventType,
      payloadJson,
    },
  });
}

async function createQuoteRequest({
  orgId,
  userId,
  carrierId,
  loadId,
  requestType,
  partner,
  payloadJson,
}) {
  const client = requirePrisma();
  const request = await client.insuranceQuoteRequest.create({
    data: {
      orgId,
      userId,
      carrierId,
      loadId,
      requestType,
      partner,
      payloadJson,
      status: "INITIATED",
    },
  });

  await createEventLog({
    orgId,
    carrierId,
    actorUserId: userId,
    eventType: "QUOTE_INITIATED",
    payloadJson: {
      quoteRequestId: request.id,
      requestType,
    },
  });

  return request;
}

async function listCertificatesForCarrier({ orgId, carrierId }) {
  const client = requirePrisma();
  return client.insuranceCertificate.findMany({
    where: { orgId, carrierId },
    orderBy: { updatedAt: "desc" },
  });
}

async function listDistinctCarriers(orgId) {
  const client = requirePrisma();
  const results = await client.insuranceCertificate.findMany({
    where: {
      orgId,
      carrierId: { not: null },
    },
    distinct: ["carrierId"],
    select: { carrierId: true },
  });
  return results.map((item) => item.carrierId).filter(Boolean);
}

async function listEventLogs({ orgId, carrierId, since }) {
  const client = requirePrisma();
  return client.insuranceEventLog.findMany({
    where: {
      orgId,
      ...(carrierId ? { carrierId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

async function markExpiredCertificates({ orgId, now }) {
  const client = requirePrisma();
  return client.insuranceCertificate.updateMany({
    where: {
      orgId,
      expirationDate: { lt: now },
      status: { not: "EXPIRED" },
    },
    data: { status: "EXPIRED" },
  });
}

module.exports = {
  listCertificates,
  createCertificate,
  updateCertificateStatus,
  listRequirements,
  upsertRequirement,
  upsertComplianceStatus,
  listComplianceStatuses,
  createEventLog,
  createQuoteRequest,
  listCertificatesForCarrier,
  listDistinctCarriers,
  listEventLogs,
  markExpiredCertificates,
};
