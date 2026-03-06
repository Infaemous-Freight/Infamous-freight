import { z } from "zod";

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional()
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion("ok", [
    z.object({
      ok: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      ok: z.literal(false),
      error: apiErrorSchema,
    }),
  ]);
