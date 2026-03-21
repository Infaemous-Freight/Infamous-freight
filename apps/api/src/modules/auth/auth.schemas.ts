import { z } from "zod";
import { REFRESH_TOKEN_COOKIE_BODY_FIELD } from "./auth.constants.js";

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be 128 characters or fewer")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  [REFRESH_TOKEN_COOKIE_BODY_FIELD]: z.string().min(32).optional(),
});

export const logoutSchema = z.object({
  [REFRESH_TOKEN_COOKIE_BODY_FIELD]: z.string().min(32).optional(),
});
