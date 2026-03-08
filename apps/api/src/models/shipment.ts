import { z } from "zod";
import type { Shipment, ShipmentStatus } from "../types/domain.js";

export const ShipmentStatusValues = [
  "CREATED",
  "POSTED",
  "BOOKED",
  "IN_TRANSIT",
  "DELAYED",
  "DELIVERED",
] as const satisfies readonly ShipmentStatus[];

export const CreateShipmentSchema = z.object({
  lane: z.object({
    origin: z.string().min(1),
    destination: z.string().min(1),
    distanceMiles: z.number().positive(),
  }),
  equipmentType: z.enum(["VAN", "REEFER", "FLATBED"]),
  weightLbs: z.number().positive(),
  pickupAt: z.string().datetime(),
  carrierId: z.string().optional(),
});

export const UpdateShipmentSchema = z.object({
  status: z.enum(ShipmentStatusValues).optional(),
  carrierId: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;
export type { Shipment };
