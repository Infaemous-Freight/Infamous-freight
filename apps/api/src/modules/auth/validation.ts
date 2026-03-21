import { z } from "zod";
import { AUTH_ROLES } from "./types.js";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  tenantName: z.string().trim().min(1).max(120),
  role: z.enum(AUTH_ROLES).optional().default("dispatcher"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(32),
});
