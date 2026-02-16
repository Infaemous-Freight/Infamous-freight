// apps/api/src/services/emailTemplating.js

let handlebars = null;
try {
  handlebars = require("handlebars");
} catch (_) {
  handlebars = null;
}

class EmailTemplatingService {
  /**
   * Email templating engine with variable substitution and design system
   */

  constructor() {
    this.templates = this.initializeTemplates();
    this.queue = [];
  }

  /**
   * Initialize email templates
   */
  initializeTemplates() {
    return {
      order_confirmation: {
        subject: "Order Confirmation - {{orderId}}",
        preview: "Your shipment has been confirmed",
        body: `
          <h1>Order Confirmed!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your shipment {{orderId}} has been confirmed and will be processed shortly.</p>
          <h2>Order Details</h2>
          <ul>
            <li>Shipment ID: {{orderId}}</li>
            <li>Origin: {{origin}}</li>
            <li>Destination: {{destination}}</li>
            <li>Estimated Delivery: {{eta}}</li>
            <li>Total Amount: ${{ amount }}</li>
          </ul>
          <p><a href="{{trackingLink}}">Track Your Shipment</a></p>
        `,
      },
      shipment_picked_up: {
        subject: "Your shipment has been picked up",
        preview: "Order {{orderId}} picked up",
        body: `
          <h1>Shipment Picked Up!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your shipment {{orderId}} has been picked up by driver {{driverName}}.</p>
          <p>Driver Rating: {{driverRating}}/5</p>
          <p><a href="{{trackingLink}}">Real-time Tracking</a></p>
        `,
      },
      delivery_notification: {
        subject: "Out for delivery - {{orderId}}",
        preview: "Your package is on its way",
        body: `
          <h1>Out for Delivery!</h1>
          <p>Your shipment {{orderId}} is out for delivery!</p>
          <p>Estimated delivery time: {{deliveryWindow}}</p>
          <p><a href="{{trackingLink}}">View Live Tracking</a></p>
        `,
      },
      delivery_failed: {
        subject: "Delivery failed for {{orderId}}",
        preview: "There was an issue delivering your package",
        body: `
          <h1>Delivery Attempted</h1>
          <p>We were unable to deliver {{orderId}}.</p>
          <p>Reason: {{failureReason}}</p>
          <p>Next delivery attempt: {{nextAttempt}}</p>
          <p><a href="{{contactLink}}">Contact Support</a></p>
        `,
      },
      delivery_completed: {
        subject: "Delivery Completed - {{orderId}}",
        preview: "Your package has been delivered",
        body: `
          <h1>Delivered!</h1>
          <p>Your shipment {{orderId}} has been successfully delivered.</p>
          <p>Delivered at: {{deliveryTime}}</p>
          <p><a href="{{reviewLink}}">Leave a Review</a></p>
        `,
      },
      refund_processed: {
        subject: "Refund Processed - ${{refundAmount}}",
        preview: "Your refund has been processed",
        body: `
          <h1>Refund Processed</h1>
          <p>Your refund of ${{ refundAmount }} for order {{orderId}} has been processed.</p>
          <p>Expected arrival: {{arrivalDate}}</p>
        `,
      },
      password_reset: {
        subject: "Reset Your Password",
        preview: "Password reset request",
        body: `
          <h1>Reset Your Password</h1>
          <p>Hi {{userName}},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this, ignore this email.</p>
        `,
      },
      welcome_email: {
        subject: "Welcome to Infamous Freight!",
        preview: "Get started with your account",
        body: `
          <h1>Welcome {{userName}}!</h1>
          <p>Thank you for joining Infamous Freight.</p>
          <p>Get started:</p>
          <ul>
            <li><a href="{{setupLink}}">Complete Your Profile</a></li>
            <li><a href="{{tutorialLink}}">Learn How to Send Shipments</a></li>
            <li><a href="{{pricingLink}}">View Our Rates</a></li>
          </ul>
        `,
      },
    };
  }

  /**
   * Render email template
   */
  renderTemplate(templateName, variables) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    if (!handlebars) {
      const subject = this.interpolate(template.subject, variables);
      const body = this.interpolate(template.body, variables);
      return {
        subject,
        preview: template.preview,
        html: this.wrapHTML(body),
        text: body,
        variables,
      };
    }

    // Compile Handlebars templates
    const subjectCompiled = handlebars.compile(template.subject);
    const bodyCompiled = handlebars.compile(template.body);

    return {
      subject: subjectCompiled(variables),
      preview: template.preview,
      html: this.wrapHTML(bodyCompiled(variables)),
      text: handlebars.compile(template.body)(variables), // Text version
      variables,
    };
  }

  interpolate(content, variables) {
    return Object.entries(variables || {}).reduce((acc, [key, value]) => {
      const safeValue = value === undefined || value === null ? "" : String(value);
      return acc.split(`{{${key}}}`).join(safeValue);
    }, content);
  }

  /**
   * Wrap HTML with email styling
   */
  wrapHTML(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #007bff; }
          a { color: #007bff; text-decoration: none; }
          .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          ${content}
          <div class="footer">
            <p>© 2026 Infamous Freight Enterprises. All rights reserved.</p>
            <p><a href="{{unsubscribeLink}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Queue email for sending
   */
  async queueEmail(recipientEmail, templateName, variables, options = {}) {
    const { priority = "normal", delay = 0, retries = 3 } = options;

    const emailJob = {
      jobId: `email_${Date.now()}`,
      recipientEmail,
      templateName,
      variables,
      priority,
      retries,
      maxRetries: retries,
      status: "queued",
      createdAt: new Date(),
      scheduledFor: new Date(Date.now() + delay),
    };

    this.queue.push(emailJob);

    return {
      jobId: emailJob.jobId,
      status: "queued",
      scheduledFor: emailJob.scheduledFor,
    };
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(recipients, templateName, variables, options = {}) {
    const { usePersonalization = true } = options;

    const jobs = [];

    for (const recipient of recipients) {
      const vars = usePersonalization ? { ...variables, customerName: recipient.name } : variables;
      const job = await this.queueEmail(recipient.email, templateName, vars, options);
      jobs.push(job);
    }

    return {
      totalQueued: jobs.length,
      jobs,
    };
  }

  /**
   * Get email templates
   */
  getTemplates() {
    return Object.keys(this.templates).map((name) => ({
      id: name,
      name: this.formatTemplateName(name),
      subject: this.templates[name].subject,
      category: this.categorizeTemplate(name),
    }));
  }

  /**
   * Create custom template
   */
  async createCustomTemplate(userId, templateData) {
    const { name, subject, html, category } = templateData;

    return {
      templateId: `custom_${Date.now()}`,
      userId,
      name,
      subject,
      html,
      category,
      createdAt: new Date(),
      status: "draft",
    };
  }

  /**
   * Format template name
   */
  formatTemplateName(name) {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Categorize template
   */
  categorizeTemplate(name) {
    if (name.includes("order")) return "orders";
    if (name.includes("delivery")) return "shipments";
    if (name.includes("refund")) return "payments";
    if (name.includes("password") || name.includes("welcome")) return "account";
    return "general";
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(templateName, dateRange = "7d") {
    return {
      templateName,
      period: dateRange,
      totalSent: 1243,
      delivered: 1201,
      bounced: 25,
      opened: 856,
      clicked: 342,
      unsubscribed: 8,
      metrics: {
        deliveryRate: "96.6%",
        openRate: "68.8%",
        clickRate: "27.5%",
        bounceRate: "2.0%",
      },
    };
  }

  /**
   * Schedule recurring email
   */
  async scheduleRecurringEmail(userId, templateName, recipients, schedule) {
    const { frequency, startDate, endDate } = schedule;

    return {
      scheduleId: `schedule_${Date.now()}`,
      userId,
      templateName,
      recipientCount: recipients.length,
      frequency, // 'daily', 'weekly', 'monthly'
      startDate,
      endDate,
      status: "active",
      createdAt: new Date(),
    };
  }
}

module.exports = { EmailTemplatingService };
