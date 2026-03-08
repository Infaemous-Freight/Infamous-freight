import { z } from "zod";
import type { CarrierProfile } from "../types/domain.js";

export const CreateCarrierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  onTimeRate: z.number().min(0).max(1),
  tenderAcceptanceRate: z.number().min(0).max(1),
  safetyScore: z.number().min(0).max(1),
  priceCompetitiveness: z.number().min(0).max(1),
  serviceRating: z.number().min(0).max(1),
  equipmentTypes: z.array(z.enum(["VAN", "REEFER", "FLATBED"])).min(1),
  activeLanes: z.array(z.string()),
});

export type CreateCarrierInput = z.infer<typeof CreateCarrierSchema>;
export type { CarrierProfile };
