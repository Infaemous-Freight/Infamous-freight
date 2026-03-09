import { z } from "zod";
import { equipmentTypeSchema, laneSchema } from "./carrier.model.js";

export const ratePredictionRequestSchema = z.object({
  lane: laneSchema,
  equipmentType: equipmentTypeSchema,
  fuelPriceUsdPerGallon: z.number().positive(),
  seasonalityIndex: z.number().positive(),
  marketCapacityIndex: z.number().positive(),
  demandIndex: z.number().positive(),
  historicalSpotRatePerMile: z.number().positive(),
});

export type RatePredictionRequest = z.infer<typeof ratePredictionRequestSchema>;
