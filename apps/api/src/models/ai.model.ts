import { z } from "zod";

export const aiCommandRequestSchema = z.object({
  command: z.string().min(3),
});

export type AiCommandRequest = z.infer<typeof aiCommandRequestSchema>;
