import { createRequire } from "node:module";

import { logger } from "../lib/logger.js";

const require = createRequire(import.meta.url);

let warnedLegacyUnavailable = false;

type AsyncLegacyFn = (...args: unknown[]) => Promise<unknown>;

type LegacyEmailService = {
  sendEmail?: AsyncLegacyFn;
  sendShipmentNotification?: AsyncLegacyFn;
  sendDriverAssignment?: AsyncLegacyFn;
  sendAdminAlert?: AsyncLegacyFn;
  sendBatch?: AsyncLegacyFn;
};

function loadLegacy(): LegacyEmailService {
  try {
    return require("./emailService.cjs") as LegacyEmailService;
  } catch (error: unknown) {
    const moduleError = error as { code?: string; message?: string };

    if (moduleError.code === "MODULE_NOT_FOUND") {
      if (!warnedLegacyUnavailable) {
        warnedLegacyUnavailable = true;
        logger.warn(
          { reason: moduleError.message },
          "Legacy email service unavailable; email operations are no-op",
        );
      }
      return {};
    }

    throw error;
  }
}

export async function sendEmail(...args: unknown[]): Promise<unknown | null> {
  const legacy = loadLegacy();
  return legacy.sendEmail ? legacy.sendEmail(...args) : null;
}

export async function sendShipmentNotification(...args: unknown[]): Promise<unknown | null> {
  const legacy = loadLegacy();
  return legacy.sendShipmentNotification ? legacy.sendShipmentNotification(...args) : null;
}

export async function sendDriverAssignment(...args: unknown[]): Promise<unknown | null> {
  const legacy = loadLegacy();
  return legacy.sendDriverAssignment ? legacy.sendDriverAssignment(...args) : null;
}

export async function sendAdminAlert(...args: unknown[]): Promise<unknown | null> {
  const legacy = loadLegacy();
  return legacy.sendAdminAlert ? legacy.sendAdminAlert(...args) : null;
}

export async function sendBatch(...args: unknown[]): Promise<unknown | null> {
  const legacy = loadLegacy();
  return legacy.sendBatch ? legacy.sendBatch(...args) : null;
}

export default {
  sendEmail,
  sendShipmentNotification,
  sendDriverAssignment,
  sendAdminAlert,
  sendBatch,
};
