/**
 * Email Service using SendGrid
 * Provides transactional email capabilities for notifications, alerts, and reports
 */

const sgMail = require("@sendgrid/mail");
const logger = require("../utils/logger");

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@infamousfreight.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Infamous Freight";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info("SendGrid email service initialized");
} else {
  logger.warn("SendGrid API key not configured - email service disabled");
}

/**
 * Send a transactional email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @param {string} [options.templateId] - SendGrid template ID
 * @param {Object} [options.dynamicTemplateData] - Template variables
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, text, html, templateId, dynamicTemplateData }) {
  if (!SENDGRID_API_KEY) {
    logger.warn("Email not sent - SendGrid not configured", { to, subject });
    return;
  }

  try {
    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      text,
      html,
      ...(templateId && { templateId }),
      ...(dynamicTemplateData && { dynamicTemplateData }),
    };

    const result = await sgMail.send(msg);

    logger.info("Email sent successfully", {
      to: Array.isArray(to) ? to : [to],
      subject,
      messageId: result[0]?.headers?.["x-message-id"],
    });

    return result;
  } catch (error) {
    logger.error("Failed to send email", {
      error: error.message,
      to,
      subject,
      code: error.code,
      response: error.response?.body,
    });
    throw error;
  }
}

/**
 * Send shipment notification email
 * @param {Object} shipment - Shipment data
 * @param {string} recipientEmail - Recipient email
 * @param {string} event - Event type (created, updated, delivered, etc.)
 */
async function sendShipmentNotification(shipment, recipientEmail, event) {
  const eventTitles = {
    created: "Shipment Created",
    updated: "Shipment Updated",
    delivered: "Shipment Delivered",
    delayed: "Shipment Delayed",
    cancelled: "Shipment Cancelled",
  };

  const subject = `${eventTitles[event] || "Shipment Update"} - ${shipment.trackingNumber}`;

  const text = `
Shipment ${event}: ${shipment.trackingNumber}

Status: ${shipment.status}
Origin: ${shipment.origin}
Destination: ${shipment.destination}
${shipment.estimatedDelivery ? `Estimated Delivery: ${new Date(shipment.estimatedDelivery).toLocaleDateString()}` : ""}

Track your shipment: ${process.env.WEB_URL || "https://infamousfreight.com"}/shipments/${shipment.id}
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${eventTitles[event] || "Shipment Update"}</h2>
      <p>Tracking Number: <strong>${shipment.trackingNumber}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shipment.status}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Origin:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shipment.origin}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Destination:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shipment.destination}</td>
        </tr>
        ${
          shipment.estimatedDelivery
            ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Est. Delivery:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(shipment.estimatedDelivery).toLocaleDateString()}</td>
        </tr>
        `
            : ""
        }
      </table>
      <a href="${process.env.WEB_URL || "https://infamousfreight.com"}/shipments/${shipment.id}" 
         style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
        Track Shipment
      </a>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    text,
    html,
  });
}

/**
 * Send driver assignment notification
 * @param {Object} driver - Driver data
 * @param {Object} shipment - Shipment data
 */
async function sendDriverAssignment(driver, shipment) {
  const subject = `New Shipment Assignment - ${shipment.trackingNumber}`;

  const text = `
Hello ${driver.name},

You have been assigned to a new shipment:

Tracking Number: ${shipment.trackingNumber}
Origin: ${shipment.origin}
Destination: ${shipment.destination}
Pickup Time: ${shipment.pickupTime ? new Date(shipment.pickupTime).toLocaleString() : "TBD"}

Please log in to the driver portal for full details.
  `.trim();

  return sendEmail({
    to: driver.email,
    subject,
    text,
  });
}

/**
 * Send alert email to administrators
 * @param {string} alertType - Type of alert
 * @param {Object} details - Alert details
 * @param {string[]} adminEmails - Admin email addresses
 */
async function sendAdminAlert(alertType, details, adminEmails) {
  const subject = `[ALERT] ${alertType}`;

  const text = `
Alert Type: ${alertType}
Timestamp: ${new Date().toISOString()}

Details:
${JSON.stringify(details, null, 2)}
  `.trim();

  return sendEmail({
    to: adminEmails,
    subject,
    text,
  });
}

/**
 * Send batch emails (bulk operations)
 * @param {Array<Object>} emails - Array of email objects
 * @returns {Promise<void>}
 */
async function sendBatch(emails) {
  if (!SENDGRID_API_KEY) {
    logger.warn("Batch emails not sent - SendGrid not configured");
    return;
  }

  try {
    const messages = emails.map((email) => ({
      to: email.to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: email.subject,
      text: email.text,
      html: email.html,
    }));

    const result = await sgMail.send(messages);

    logger.info("Batch emails sent successfully", {
      count: emails.length,
      recipients: emails.map((e) => e.to),
    });

    return result;
  } catch (error) {
    logger.error("Failed to send batch emails", {
      error: error.message,
      count: emails.length,
    });
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendShipmentNotification,
  sendDriverAssignment,
  sendAdminAlert,
  sendBatch,
};
