import { z } from "zod";

export const createLoadSchema = z.object({
  referenceNumber: z.string().min(1),
  originLat: z.number(),
  originLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  pickupWindowStart: z.string().datetime(),
  pickupWindowEnd: z.string().datetime(),
  deliveryDeadline: z.string().datetime(),
  weightLbs: z.number().int().positive(),
  hazmat: z.boolean().optional(),
  trailerType: z.enum(["DRY_VAN", "REEFER", "FLATBED", "POWER_ONLY"])
});
