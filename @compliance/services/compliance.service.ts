import { carrierComplianceInputSchema } from "../schemas/compliance.schema";
import { evaluateCarrierCompliance } from "../rules/carrier.rules";
import type { CarrierComplianceInput, ComplianceResult } from "../types/compliance.types";

export class ComplianceService {
  evaluateCarrier(input: CarrierComplianceInput): ComplianceResult {
    const result = carrierComplianceInputSchema.safeParse(input);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(", ");
      throw new Error(`Invalid carrier compliance input: ${messages}`);
    }
    return evaluateCarrierCompliance(result.data);
  }
}
