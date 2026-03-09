import { z } from "@infamous/shared";

export const requiredDocumentTypeSchema = z.enum([
  "insurance",
  "w9",
  "mc_authority",
  "dot_certificate",
  "carrier_packet",
  "signed_agreement",
]);

export const complianceDocumentSchema = z.object({
  type: requiredDocumentTypeSchema,
  present: z.boolean(),
  expiresAt: z.string().datetime().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
});

export const carrierComplianceInputSchema = z.object({
  tenantId: z.string().min(1),
  carrierId: z.string().min(1),
  legalName: z.string().min(1),
  mcNumber: z.string().trim().min(1).nullable().optional(),
  dotNumber: z.string().trim().min(1).nullable().optional(),
  insuranceExpiresAt: z.string().datetime().nullable().optional(),
  equipmentTypes: z.array(z.string().min(1)).default([]),
  documents: z.array(complianceDocumentSchema).default([]),
  requiredEquipmentType: z.string().trim().min(1).nullable().optional(),
  asOf: z.string().datetime().optional(),
});

export type CarrierComplianceInputDto = z.infer<typeof carrierComplianceInputSchema>;
