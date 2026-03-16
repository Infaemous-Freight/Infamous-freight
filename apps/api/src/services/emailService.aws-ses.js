/**
 * Email Service using AWS SES
 * Cost-optimized replacement for SendGrid ($20/month → $0/month)
 * Free tier: 62,000 emails/month via AWS SES
 */

const {
    SESClient,
    SendEmailCommand,
    GetSendQuotaCommand,
    VerifyEmailIdentityCommand,
} = require("@aws-sdk/client-ses");
const logger = require("../utils/logger");

// Initialize AWS SES
const SES_REGION = process.env.AWS_SES_REGION || "us-east-1";
const SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || "noreply@infamousfreight.com";
const SES_FROM_NAME = process.env.AWS_SES_FROM_NAME || process.env.SENDGRID_FROM_NAME || "Infamous Freight";

let sesClient;

if (process.env.AWS_SES_ACCESS_KEY && process.env.AWS_SES_SECRET_KEY) {
    const options = {
        region: SES_REGION,
        credentials: {
            accessKeyId: process.env.AWS_SES_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SES_SECRET_KEY,
        },
    };

    sesClient = new SESClient(options);
    logger.info("AWS SES email service initialized", { region: SES_REGION });
} else {
    logger.warn("AWS SES credentials not configured - email service disabled");
}

/**
 * Send a transactional email via AWS SES
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<Object>}
 */
async function sendEmail({ to, subject, text, html }) {
    if (!sesClient) {
        logger.warn("Email not sent - AWS SES not configured", { to, subject });
        return { success: false, error: "Email service not configured" };
    }

    try {
        const recipients = Array.isArray(to) ? to : [to];

        const params = {
            Source: `${SES_FROM_NAME} <${SES_FROM_EMAIL}>`,
            Destination: {
                ToAddresses: recipients,
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: "UTF-8",
                },
                Body: {
                    Text: {
                        Data: text,
                        Charset: "UTF-8",
                    },
                    ...(html && {
                        Html: {
                            Data: html,
                            Charset: "UTF-8",
                        },
                    }),
                },
            },
        };

        const result = await sesClient.send(new SendEmailCommand(params));

        logger.info("Email sent successfully via AWS SES", {
            to: recipients,
            subject,
            messageId: result.MessageId,
        });

        return {
            success: true,
            messageId: result.MessageId,
        };
    } catch (error) {
        logger.error("Failed to send email via AWS SES", {
            error: error.message,
            code: error.code,
            to,
            subject,
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
        ${shipment.estimatedDelivery
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
 * @returns {Promise<Object>}
 */
async function sendBatch(emails) {
    if (!sesClient) {
        logger.warn("Batch emails not sent - AWS SES not configured");
        return { success: false, error: "Email service not configured" };
    }

    try {
        const results = await Promise.allSettled(
            emails.map((email) =>
                sendEmail({
                    to: email.to,
                    subject: email.subject,
                    text: email.text,
                    html: email.html,
                })
            )
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        logger.info("Batch emails sent via AWS SES", {
            total: emails.length,
            successful,
            failed,
        });

        return {
            success: true,
            total: emails.length,
            successful,
            failed,
            results,
        };
    } catch (error) {
        logger.error("Failed to send batch emails via AWS SES", {
            error: error.message,
            count: emails.length,
        });
        throw error;
    }
}

/**
 * Verify email address with AWS SES
 * Required before sending from a new email address
 * @param {string} email - Email address to verify
 */
async function verifyEmailAddress(email) {
    if (!sesClient) {
        throw new Error("AWS SES not configured");
    }

    try {
        const params = {
            EmailAddress: email,
        };

        const result = await sesClient.send(new VerifyEmailIdentityCommand(params));
        logger.info("Email verification initiated", { email });
        return result;
    } catch (error) {
        logger.error("Failed to verify email", { error: error.message, email });
        throw error;
    }
}

/**
 * Check AWS SES sending quota
 * @returns {Promise<Object>}
 */
async function getSendQuota() {
    if (!sesClient) {
        return { error: "AWS SES not configured" };
    }

    try {
        const result = await sesClient.send(new GetSendQuotaCommand({}));
        return {
            max24HourSend: result.Max24HourSend,
            maxSendRate: result.MaxSendRate,
            sentLast24Hours: result.SentLast24Hours,
            remaining: result.Max24HourSend - result.SentLast24Hours,
        };
    } catch (error) {
        logger.error("Failed to get SES quota", { error: error.message });
        throw error;
    }
}

module.exports = {
    sendEmail,
    sendShipmentNotification,
    sendDriverAssignment,
    sendAdminAlert,
    sendBatch,
    verifyEmailAddress,
    getSendQuota,
};
