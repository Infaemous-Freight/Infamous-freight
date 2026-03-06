export type ComplianceStatus = "compliant" | "warning" | "non_compliant";

export type ComplianceSeverity = "info" | "warning" | "critical";

export type RequiredDocumentType =
  | "insurance"
  | "w9"
  | "mc_authority"
  | "dot_certificate"
  | "carrier_packet"
  | "signed_agreement";

export interface ComplianceDocument {
  type: RequiredDocumentType;
  present: boolean;
  expiresAt?: string | null;
  verifiedAt?: string | null;
}

export interface CarrierComplianceInput {
  tenantId: string;
  carrierId: string;
  legalName: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
  insuranceExpiresAt?: string | null;
  equipmentTypes: string[];
  documents: ComplianceDocument[];
  requiredEquipmentType?: string | null;
  asOf?: string;
}

export interface ComplianceFinding {
  code: string;
  message: string;
  severity: ComplianceSeverity;
  field?: string;
}

export interface ComplianceResult {
  tenantId: string;
  carrierId: string;
  status: ComplianceStatus;
  score: number;
  checkedAt: string;
  findings: ComplianceFinding[];
  eligibleForBooking: boolean;
}
