import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const emailService = require("./emailService.cjs") as {
  sendEmail: (params: Record<string, unknown>) => Promise<unknown>;
  sendShipmentNotification: (params: Record<string, unknown>) => Promise<unknown>;
  sendDriverAssignment: (params: Record<string, unknown>) => Promise<unknown>;
  sendAdminAlert: (params: Record<string, unknown>) => Promise<unknown>;
  sendBatch: (emails: Record<string, unknown>[]) => Promise<unknown>;
};

export const sendEmail = emailService.sendEmail;
export const sendShipmentNotification = emailService.sendShipmentNotification;
export const sendDriverAssignment = emailService.sendDriverAssignment;
export const sendAdminAlert = emailService.sendAdminAlert;
export const sendBatch = emailService.sendBatch;

export default emailService;
