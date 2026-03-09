import { z } from "zod";

export const etaRiskRequestSchema = z.object({
  distanceRemainingMiles: z.number().nonnegative(),
  averageSpeedMph: z.number().positive(),
  weatherRisk: z.number().min(0).max(1),
  trafficRisk: z.number().min(0).max(1),
  carrierReliability: z.number().min(0).max(1),
});

export type EtaRiskRequest = z.infer<typeof etaRiskRequestSchema>;
