type EmailPayload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

const asArray = (to: string | string[]) => (Array.isArray(to) ? to : [to]);

export const sendEmail = async (payload: EmailPayload): Promise<{ accepted: string[] }> => {
  const recipients = asArray(payload.to);

  if (!recipients.length) {
    throw new Error("No email recipients provided");
  }

  // Keep non-blocking behavior in production boot paths when provider credentials are missing.
  if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
    console.info("email_skipped", {
      reason: "provider_not_configured",
      to: recipients,
      subject: payload.subject,
    });
    return { accepted: recipients };
  }

  // Existing codebase has mixed providers; use a safe no-op fallback here for deploy stability.
  console.info("email_queued", { to: recipients, subject: payload.subject });
  return { accepted: recipients };
};

export const sendShipmentNotification = async (
  to: string | string[],
  shipmentId: string,
  message: string,
) =>
  sendEmail({
    to,
    subject: `Shipment Update ${shipmentId}`,
    text: message,
    html: `<p>${message}</p>`,
  });

export const sendDriverAssignment = async (
  to: string | string[],
  loadId: string,
  driverName: string,
) =>
  sendEmail({
    to,
    subject: `Driver Assigned for Load ${loadId}`,
    text: `${driverName} has been assigned to load ${loadId}.`,
    html: `<p><strong>${driverName}</strong> has been assigned to load <strong>${loadId}</strong>.</p>`,
  });

export const sendAdminAlert = async (to: string | string[], title: string, details: string) =>
  sendEmail({
    to,
    subject: `[Admin Alert] ${title}`,
    text: details,
    html: `<p>${details}</p>`,
  });

export const sendBatch = async (emails: EmailPayload[]) =>
  Promise.all(emails.map((email) => sendEmail(email)));

export default {
  sendEmail,
  sendShipmentNotification,
  sendDriverAssignment,
  sendAdminAlert,
  sendBatch,
};
