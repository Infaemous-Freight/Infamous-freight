import type { ZodSchema } from "zod";
import { HttpError } from "./errors.js";

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const out = schema.safeParse(data);
  if (!out.success) throw new HttpError(400, out.error.message);
  return out.data;
}
