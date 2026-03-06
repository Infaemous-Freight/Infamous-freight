import { z } from "zod";

export const zTenantId = z.string().min(3);

export const zCreateShipment = z.object({
  tenantId: zTenantId,
  ref: z.string().min(3),
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destCity: z.string().min(2),
  destState: z.string().min(2),
  weightLb: z.number().int().positive(),
  rateCents: z.number().int().nonnegative()
});

export const zCreateLoad = z.object({
  tenantId: zTenantId,
  originCity: z.string().min(2),
  originState: z.string().min(2),
  destCity: z.string().min(2),
  destState: z.string().min(2),
  distanceMi: z.number().int().positive(),
  weightLb: z.number().int().positive(),
  rateCents: z.number().int().nonnegative()
});

export const zAICommand = z.object({
  tenantId: zTenantId,
  input: z.string().min(1),
  context: z.record(z.any()).optional()
});
