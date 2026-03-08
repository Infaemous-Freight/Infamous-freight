import { z } from "zod";

const LoadStatusValues = [
  "OPEN",
  "COVERED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;

export const LoadSchema = z.object({
  id: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  pickupAt: z.string().datetime(),
  deliverBy: z.string().datetime(),
  weightLbs: z.number().positive(),
  distanceMiles: z.number().positive(),
  equipmentType: z.enum(["VAN", "REEFER", "FLATBED"]),
  ratePerMile: z.number().positive().optional(),
  shipperId: z.string().min(1),
  carrierId: z.string().optional(),
  status: z.enum(LoadStatusValues),
});

export const CreateLoadSchema = LoadSchema.omit({ id: true, status: true }).extend({
  status: z.enum(LoadStatusValues).default("OPEN"),
});

export type Load = z.infer<typeof LoadSchema>;
export type CreateLoadInput = z.infer<typeof CreateLoadSchema>;
