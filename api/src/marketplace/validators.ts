/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Marketplace schema validators (Zod)
 */

import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  role: z.enum(["SHIPPER", "DRIVER", "ADMIN"]).optional(),
});

export const upsertDriverProfileSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  isActive: z.boolean().optional(),
});

export const updateDriverLocationSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
});

export const addVehicleSchema = z.object({
  driverId: z.string().min(1, "Driver ID required"),
  type: z.enum(["CAR", "SUV", "VAN", "BOX_TRUCK", "STRAIGHT_TRUCK", "SEMI"]),
  nickname: z.string().optional(),
  maxWeightLbs: z.number().int("Weight must be an integer").positive("Weight must be positive"),
  maxVolumeCuFt: z.number().int("Volume must be an integer").positive("Volume must be positive"),
});

export const createJobSchema = z.object({
  shipperId: z.string().min(1, "Shipper ID required"),
  pickupAddress: z.string().min(3, "Pickup address too short"),
  dropoffAddress: z.string().min(3, "Dropoff address too short"),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  requiredVehicle: z.enum(["CAR", "SUV", "VAN", "BOX_TRUCK", "STRAIGHT_TRUCK", "SEMI"]),
  weightLbs: z.number().int().nonnegative(),
  volumeCuFt: z.number().int().nonnegative(),
  notes: z.string().optional(),
  priceUsd: z.number().positive("Price must be positive").optional(),
});

export const matchDriversSchema = z.object({
  jobId: z.string().min(1, "Job ID required"),
  radiusMiles: z.number().positive("Radius must be positive").optional(),
});

export const acceptJobSchema = z.object({
  jobId: z.string().min(1, "Job ID required"),
  driverId: z.string().min(1, "Driver ID required"),
});

export const updateJobStatusSchema = z.object({
  jobId: z.string().min(1, "Job ID required"),
  status: z.enum(["DRAFT", "REQUIRES_PAYMENT", "OPEN", "HELD", "ACCEPTED", "PICKED_UP", "DELIVERED", "COMPLETED", "CANCELED"]),
});

// Type exports for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpsertDriverProfileInput = z.infer<typeof upsertDriverProfileSchema>;
export type UpdateDriverLocationInput = z.infer<typeof updateDriverLocationSchema>;
export type AddVehicleInput = z.infer<typeof addVehicleSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type MatchDriversInput = z.infer<typeof matchDriversSchema>;
export type AcceptJobInput = z.infer<typeof acceptJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
