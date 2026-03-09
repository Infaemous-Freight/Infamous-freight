import { z } from "zod";

export const laneSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  distanceMiles: z.number().positive(),
});

export const equipmentTypeSchema = z.enum(["VAN", "REEFER", "FLATBED"]);

export const carrierProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  onTimeRate: z.number().min(0).max(1),
  tenderAcceptanceRate: z.number().min(0).max(1),
  safetyScore: z.number().min(0).max(1),
  priceCompetitiveness: z.number().min(0).max(1),
  serviceRating: z.number().min(0).max(1),
  equipmentTypes: z.array(equipmentTypeSchema),
  activeLanes: z.array(z.string()),
});

export const rankCarriersRequestSchema = z.object({
  lane: laneSchema,
  equipmentType: equipmentTypeSchema,
  carriers: z.array(carrierProfileSchema),
});

export type RankCarriersRequest = z.infer<typeof rankCarriersRequestSchema>;
