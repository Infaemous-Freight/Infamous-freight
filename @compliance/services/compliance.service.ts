import { carrierComplianceInputSchema } from "../schemas/compliance.schema";
import { evaluateCarrierCompliance } from "../rules/carrier.rules";
import type { CarrierComplianceInput, ComplianceResult } from "../types/compliance.types";

export class ComplianceService {
  evaluateCarrier(input: CarrierComplianceInput): ComplianceResult {
    const parsed = carrierComplianceInputSchema.parse(input);
    return evaluateCarrierCompliance(parsed);
  }
}
