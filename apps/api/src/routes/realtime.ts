import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { sseHandler } from "../realtime/sse.js";

/**
 * Realtime routes (SSE).
 * Must be authenticated to avoid leaking tenant activity.
 */
export const realtime = Router();

realtime.get("/stream", requireAuth as any, sseHandler);
