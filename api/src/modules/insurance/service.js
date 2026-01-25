const {
  listCertificates,
  createCertificate,
  updateCertificateStatus,
  listRequirements,
  upsertRequirement,
  upsertComplianceStatus,
  listComplianceStatuses,
  createQuoteRequest,
  listCertificatesForCarrier,
  listDistinctCarriers,
  listEventLogs,
  markExpiredCertificates,
  createEventLog,
} = require("./storage");
const { evaluateCompliance, computeRiskScore } = require("./rules");

async function uploadCertificate({ orgId, actorUserId, payload }) {
  return createCertificate({
    orgId,
    actorUserId,
    carrierId: payload.carrierId || null,
    coverageType: payload.coverageType,
    documentUrl: payload.documentUrl,
    providerName: payload.providerName,
    policyNumber: payload.policyNumber,
    effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : null,
    expirationDate: payload.expirationDate
      ? new Date(payload.expirationDate)
      : null,
    limitsJson: payload.limitsJson || undefined,
    extractedJson: payload.extractedJson || undefined,
  });
}

async function listCertificatesForOrg({ orgId, carrierId }) {
  return listCertificates({ orgId, carrierId });
}

async function verifyCertificate({ orgId, id, actorUserId }) {
  return updateCertificateStatus({
    orgId,
    id,
    status: "VERIFIED",
    actorUserId,
  });
}

async function rejectCertificate({ orgId, id, actorUserId, rejectionReason }) {
  return updateCertificateStatus({
    orgId,
    id,
    status: "REJECTED",
    actorUserId,
    rejectionReason,
  });
}

async function getRequirements(orgId) {
  return listRequirements(orgId);
}

async function setRequirements({ orgId, actorUserId, requirements }) {
  const results = [];
  for (const requirement of requirements) {
    const record = await upsertRequirement({ orgId, requirement });
    results.push(record);
  }

  await createEventLog({
    orgId,
    actorUserId,
    eventType: "REQUIREMENTS_UPDATED",
    payloadJson: {
      count: results.length,
    },
  });

  return results;
}

async function evaluateCarrierCompliance({ orgId, carrierId }) {
  const [requirements, certificates] = await Promise.all([
    listRequirements(orgId),
    listCertificatesForCarrier({ orgId, carrierId }),
  ]);

  const evaluation = evaluateCompliance({ requirements, certificates });
  const result = await upsertComplianceStatus({
    orgId,
    carrierId,
    state: evaluation.state,
    reasons: evaluation.reasons,
  });

  return { result, evaluation };
}

async function listCompliance({ orgId, carrierId }) {
  return listComplianceStatuses({ orgId, carrierId });
}

async function createQuote({
  orgId,
  userId,
  carrierId,
  loadId,
  requestType,
  partner,
  payloadJson,
}) {
  return createQuoteRequest({
    orgId,
    userId,
    carrierId,
    loadId,
    requestType,
    partner,
    payloadJson,
  });
}

async function evaluateOrgCompliance({ orgId }) {
  const carriers = await listDistinctCarriers(orgId);
  const results = [];
  for (const carrierId of carriers) {
    const evaluation = await evaluateCarrierCompliance({ orgId, carrierId });
    results.push({ carrierId, ...evaluation });
  }
  return results;
}

async function getRiskScore({ orgId, carrierId }) {
  const [requirements, certificates, recentSuspensions] = await Promise.all([
    listRequirements(orgId),
    listCertificatesForCarrier({ orgId, carrierId }),
    listEventLogs({
      orgId,
      carrierId,
      since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    }),
  ]);

  const evaluation = evaluateCompliance({ requirements, certificates });
  const suspensionsLast90Days = recentSuspensions.filter((event) =>
    event.eventType === "SUSPEND"
  ).length;

  return {
    score: computeRiskScore({ evaluation, suspensionsLast90Days }),
    evaluation,
  };
}

async function runExpirationSweep({ orgId, now = new Date() }) {
  const requirements = await listRequirements(orgId);
  const certificates = await listCertificates({ orgId });

  const expiringThresholds = [30, 14, 7, 1];
  const expiringEvents = [];

  for (const certificate of certificates) {
    if (!certificate.expirationDate) continue;
    const daysToExpiration = Math.ceil(
      (new Date(certificate.expirationDate).getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000)
    );
    if (expiringThresholds.includes(daysToExpiration)) {
      expiringEvents.push({
        certificateId: certificate.id,
        coverageType: certificate.coverageType,
        daysToExpiration,
      });

      await createEventLog({
        orgId,
        carrierId: certificate.carrierId,
        eventType: "WARNING_SENT",
        payloadJson: {
          certificateId: certificate.id,
          coverageType: certificate.coverageType,
          daysToExpiration,
        },
      });
    }
  }

  await markExpiredCertificates({ orgId, now });

  return {
    totalCertificates: certificates.length,
    expiringEvents,
    requirementsCount: requirements.length,
  };
}

module.exports = {
  uploadCertificate,
  listCertificatesForOrg,
  verifyCertificate,
  rejectCertificate,
  getRequirements,
  setRequirements,
  evaluateCarrierCompliance,
  listCompliance,
  createQuote,
  evaluateOrgCompliance,
  getRiskScore,
  runExpirationSweep,
};
