import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const revokeRefreshSchema = z.object({
  refreshToken: z.string().min(20)
});
