import { z } from "zod";

export const ingestGpsSchema = z.object({
  driverId: z.string().min(1),
  loadId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  speedMph: z.number().optional(),
  heading: z.number().optional(),
  recordedAt: z.string().datetime()
});
