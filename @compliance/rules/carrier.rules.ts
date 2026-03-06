import type {
  CarrierComplianceInput,
  ComplianceFinding,
  ComplianceResult,
  ComplianceStatus,
  RequiredDocumentType,
} from "../types/compliance.types";

const REQUIRED_DOCUMENTS: RequiredDocumentType[] = [
  "insurance",
  "w9",
  "mc_authority",
  "dot_certificate",
  "carrier_packet",
];

function isExpired(dateStr?: string | null, asOf?: string): boolean {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  const ref = asOf ? new Date(asOf) : new Date();

  if (Number.isNaN(date.getTime()) || Number.isNaN(ref.getTime())) {
    return true;
  }

  return date.getTime() < ref.getTime();
}

function daysUntil(dateStr?: string | null, asOf?: string): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const ref = asOf ? new Date(asOf) : new Date();

  if (Number.isNaN(date.getTime()) || Number.isNaN(ref.getTime())) {
    return null;
  }

  const diffMs = date.getTime() - ref.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function resolveStatus(findings: ComplianceFinding[]): ComplianceStatus {
  if (findings.some((f) => f.severity === "critical")) return "non_compliant";
  if (findings.some((f) => f.severity === "warning")) return "warning";
  return "compliant";
}

function computeScore(findings: ComplianceFinding[]): number {
  let score = 100;

  for (const finding of findings) {
    if (finding.severity === "critical") score -= 25;
    if (finding.severity === "warning") score -= 10;
    if (finding.severity === "info") score -= 2;
  }

  return Math.max(0, score);
}

export function evaluateCarrierCompliance(input: CarrierComplianceInput): ComplianceResult {
  const findings: ComplianceFinding[] = [];
  const asOf = input.asOf ?? new Date().toISOString();

  if (!input.mcNumber) {
    findings.push({
      code: "MISSING_MC_NUMBER",
      message: "Carrier is missing an MC number.",
      severity: "critical",
      field: "mcNumber",
    });
  }

  if (!input.dotNumber) {
    findings.push({
      code: "MISSING_DOT_NUMBER",
      message: "Carrier is missing a DOT number.",
      severity: "critical",
      field: "dotNumber",
    });
  }

  if (isExpired(input.insuranceExpiresAt, asOf)) {
    findings.push({
      code: "INSURANCE_EXPIRED",
      message: "Carrier insurance is missing or expired.",
      severity: "critical",
      field: "insuranceExpiresAt",
    });
  } else {
    const remaining = daysUntil(input.insuranceExpiresAt, asOf);
    if (remaining !== null && remaining <= 30) {
      findings.push({
        code: "INSURANCE_EXPIRING_SOON",
        message: "Carrier insurance expires within 30 days.",
        severity: "warning",
        field: "insuranceExpiresAt",
      });
    }
  }

  const presentDocs = new Map(input.documents.map((doc) => [doc.type, doc]));

  for (const requiredType of REQUIRED_DOCUMENTS) {
    const doc = presentDocs.get(requiredType);

    if (!doc || !doc.present) {
      findings.push({
        code: `MISSING_${requiredType.toUpperCase()}`,
        message: `Required document "${requiredType}" is missing.`,
        severity: "critical",
        field: "documents",
      });
      continue;
    }

    if (doc.expiresAt && isExpired(doc.expiresAt, asOf)) {
      findings.push({
        code: `${requiredType.toUpperCase()}_EXPIRED`,
        message: `Required document "${requiredType}" is expired.`,
        severity: "critical",
        field: "documents",
      });
    }
  }

  if (input.requiredEquipmentType && !input.equipmentTypes.includes(input.requiredEquipmentType)) {
    findings.push({
      code: "EQUIPMENT_TYPE_MISMATCH",
      message: `Carrier does not support required equipment type "${input.requiredEquipmentType}".`,
      severity: "warning",
      field: "equipmentTypes",
    });
  }

  const status = resolveStatus(findings);
  const score = computeScore(findings);

  return {
    tenantId: input.tenantId,
    carrierId: input.carrierId,
    status,
    score,
    checkedAt: new Date().toISOString(),
    findings,
    eligibleForBooking: status === "compliant",
  };
}
