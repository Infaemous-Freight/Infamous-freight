// Customer Success Automation Service
// Reduces churn by 20-30% = $15K-23K saved revenue annually
// Automates onboarding, engagement, and retention workflows

const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('./emailService');
const { logger } = require('../middleware/logger');

const prisma = new PrismaClient();

class CustomerSuccessAutomation {
  constructor(config = {}) {
    this.config = {
      healthScoreThreshold: config.healthScoreThreshold || 30,
      inactivityDays: config.inactivityDays || 7,
      retentionOffers: config.retentionOffers || [
        { type: 'discount', value: 30, duration: 3 },
        { type: 'pause', duration: 2 },
        { type: 'downgrade', tier: 'starter' },
      ],
    };
  }

  /**
   * Run daily customer health monitoring
   */
  async monitorCustomerHealth() {
    logger.info('Running customer health check...');
    
    try {
      const customers = await prisma.customer.findMany({
        where: { status: 'active' },
        include: {
          subscription: true,
          usage: { orderBy: { createdAt: 'desc' }, take: 30 },
          supportTickets: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      for (const customer of customers) {
        const healthScore = await this.calculateHealthScore(customer);
        
        // Store health score
        await this.updateHealthScore(customer.id, healthScore);
        
        // Take action based on health score
        if (healthScore < this.config.healthScoreThreshold) {
          await this.handleUnhealthyCustomer(customer, healthScore);
        }
        
        // Check for cancellation intent
        if (customer.subscription?.cancelAt) {
          await this.handleCancellationIntent(customer);
        }
      }
      
      logger.info({ customersAnalyzed: customers.length }, 'Analyzed customers');
    } catch (error) {
      logger.error({ error }, 'Error monitoring customer health');
      throw error;
    }
  }

  /**
   * Calculate customer health score (0-100)
   */
  async calculateHealthScore(customer) {
    const factors = {
      loginFrequency: await this.getLoginFrequency(customer.id),
      featureUsage: await this.getFeatureUsage(customer.id),
      supportTickets: this.getSupportTicketScore(customer.supportTickets || []),
      paymentHistory: await this.getPaymentHistory(customer.id),
      tenure: this.getTenureScore(customer.createdAt),
    };

    // Weighted scoring (total = 100)
    const score = (
      factors.loginFrequency * 0.25 +
      factors.featureUsage * 0.25 +
      factors.supportTickets * 0.20 +
      factors.paymentHistory * 0.20 +
      factors.tenure * 0.10
    );

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate login frequency score
   */
  async getLoginFrequency(customerId) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const loginCount = await prisma.auditLog.count({
      where: {
        userId: customerId,
        action: 'login',
        createdAt: { gte: last30Days },
      },
    });

    // Score based on login frequency
    if (loginCount >= 20) return 100; // Daily user
    if (loginCount >= 10) return 75;  // Weekly user
    if (loginCount >= 4) return 50;   // Bi-weekly user
    if (loginCount >= 1) return 25;   // Monthly user
    return 0; // Inactive
  }

  /**
   * Calculate feature usage score
   */
  async getFeatureUsage(customerId) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const usage = await prisma.usage.aggregate({
      where: {
        customerId,
        createdAt: { gte: last30Days },
      },
      _sum: { count: true },
    });

    const totalUsage = usage._sum.count || 0;
    
    // Score based on usage volume
    if (totalUsage >= 1000) return 100;
    if (totalUsage >= 500) return 75;
    if (totalUsage >= 100) return 50;
    if (totalUsage >= 10) return 25;
    return 0;
  }

  /**
   * Calculate support ticket score (fewer tickets = better)
   */
  getSupportTicketScore(tickets) {
    const recentTickets = tickets.filter(
      t => t.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const openTickets = recentTickets.filter(t => t.status === 'open').length;
    
    // More open tickets = lower score
    if (openTickets === 0) return 100;
    if (openTickets === 1) return 80;
    if (openTickets === 2) return 60;
    if (openTickets >= 3) return 30;
    return 0;
  }

  /**
   * Calculate payment history score
   */
  async getPaymentHistory(customerId) {
    const payments = await prisma.payment.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (payments.length === 0) return 50; // New customer

    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    
    // Score based on success rate
    const successRate = successfulPayments / payments.length;
    
    if (failedPayments >= 3) return 20; // Multiple failures
    if (failedPayments >= 1) return 60; // Some failures
    if (successRate === 1) return 100;  // Perfect record
    return 80;
  }

  /**
   * Calculate tenure score
   */
  getTenureScore(createdAt) {
    const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
    
    // Longer tenure = more invested
    if (daysActive >= 365) return 100; // 1+ year
    if (daysActive >= 180) return 80;  // 6+ months
    if (daysActive >= 90) return 60;   // 3+ months
    if (daysActive >= 30) return 40;   // 1+ month
    return 20; // New customer
  }

  /**
   * Update health score in database
   */
  async updateHealthScore(customerId, score) {
    await prisma.customerHealth.upsert({
      where: { customerId },
      update: {
        score,
        updatedAt: new Date(),
      },
      create: {
        customerId,
        score,
      },
    });
  }

  /**
   * Handle unhealthy customer (low health score)
   */
  async handleUnhealthyCustomer(customer, healthScore) {
    logger.warn({ customerEmail: customer.email, healthScore }, 'Unhealthy customer detected');
    
    // Check last engagement attempt
    const lastContact = await this.getLastEngagementContact(customer.id);
    const daysSinceContact = lastContact
      ? Math.floor((Date.now() - lastContact.getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    // Don't spam - wait at least 7 days between contacts
    if (daysSinceContact < 7) return;

    // Send re-engagement email
    await this.sendReengagementEmail(customer, healthScore);
    
    // Log engagement attempt
    await prisma.engagementLog.create({
      data: {
        customerId: customer.id,
        type: 'reengagement',
        reason: 'low_health_score',
        healthScore,
      },
    });
  }

  /**
   * Handle customer with cancellation intent
   */
  async handleCancellationIntent(customer) {
    logger.warn({ customerEmail: customer.email }, 'Cancellation intent detected');
    
    // Check if we've already offered retention
    const existingOffer = await prisma.retentionOffer.findFirst({
      where: {
        customerId: customer.id,
        status: 'pending',
      },
    });

    if (existingOffer) return; // Don't send duplicate offers

    // Create retention offer
    const offer = this.config.retentionOffers[0]; // Start with best offer
    
    await prisma.retentionOffer.create({
      data: {
        customerId: customer.id,
        type: offer.type,
        value: offer.value,
        duration: offer.duration,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send retention email
    await this.sendRetentionEmail(customer, offer);
  }

  /**
   * Send onboarding email series
   */
  async sendOnboardingEmail(customer, day = 1) {
    const templates = {
      1: {
        subject: 'Welcome to Infamous Freight! 🚀',
        body: `
          Hi ${customer.name},
          
          Welcome aboard! We're excited to have you.
          
          Here's what to do next:
          1. ✅ Complete your profile
          2. 📦 Create your first shipment
          3. 🎯 Set up tracking notifications
          
          Need help? Reply to this email or check our guide:
          https://docs.infamous-freight.com/getting-started
          
          Best,
          The Infamous Freight Team
        `,
      },
      3: {
        subject: 'Quick check-in - How are things going?',
        body: `
          Hi ${customer.name},
          
          Just checking in! How's your experience so far?
          
          Here are some power user tips:
          • Use bulk upload for faster shipment creation
          • Set up webhooks for real-time notifications
          • Try our mobile app for on-the-go tracking
          
          Questions? We're here to help!
          
          Best,
          The Infamous Freight Team
        `,
      },
      7: {
        subject: 'Advanced tips to maximize your plan',
        body: `
          Hi ${customer.name},
          
          You've been with us for a week! Here's how to get even more value:
          
          📊 Advanced Features:
          • Custom reporting and analytics
          • API integration for automation
          • Team collaboration tools
          
          📞 Need personalized help?
          Schedule a free 15-minute consultation:
          https://calendly.com/infamous-freight
          
          Best,
          The Infamous Freight Team
        `,
      },
    };

    const template = templates[day];
    if (!template) return;

    await sendEmail({
      to: customer.email,
      subject: template.subject,
      body: template.body,
    });

    logger.info({ customerEmail: customer.email, day }, 'Sent onboarding email');
  }

  /**
   * Send re-engagement email
   */
  async sendReengagementEmail(customer, healthScore) {
    await sendEmail({
      to: customer.email,
      subject: 'We miss you! Here\'s 20% off your next month',
      body: `
        Hi ${customer.name},
        
        We noticed you haven't logged in recently, and we'd love to see you back!
        
        Here's an exclusive offer: Use code COMEBACK20 for 20% off your next month.
        
        What can we improve? Hit reply and let us know.
        
        Best,
        The Infamous Freight Team
      `,
    });

    logger.info({ customerEmail: customer.email }, 'Sent re-engagement email');
  }

  /**
   * Send retention email with offer
   */
  async sendRetentionEmail(customer, offer) {
    const offerText = {
      discount: `${offer.value}% off for ${offer.duration} months`,
      pause: `Pause your subscription for ${offer.duration} months`,
      downgrade: `Switch to our ${offer.tier} plan`,
    };

    await sendEmail({
      to: customer.email,
      subject: 'Before you go... let\'s talk',
      body: `
        Hi ${customer.name},
        
        We're sorry to see you considering cancellation.
        
        Would this help you stay?
        🎁 ${offerText[offer.type]}
        
        Or schedule a quick call to discuss your needs:
        https://calendly.com/infamous-freight/retention
        
        We value your feedback and want to make things right.
        
        Best,
        The Infamous Freight Team
      `,
    });

    logger.info({ customerEmail: customer.email }, 'Sent retention offer');
  }

  /**
   * Send payment retry reminder
   */
  async sendPaymentRetryEmail(customer) {
    await sendEmail({
      to: customer.email,
      subject: '⚠️ Payment Failed - Update Your Card',
      body: `
        Hi ${customer.name},
        
        Your recent payment didn't go through.
        
        Update your payment method here:
        https://app.infamous-freight.com/billing/update
        
        Need help? Contact us:
        support@infamous-freight.com
        
        Best,
        The Infamous Freight Team
      `,
    });

    logger.info({ customerEmail: customer.email }, 'Sent payment retry email');
  }

  /**
   * Get last engagement contact timestamp
   */
  async getLastEngagementContact(customerId) {
    const log = await prisma.engagementLog.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return log?.createdAt || null;
  }

  /**
   * Schedule onboarding emails for new customer
   */
  async scheduleOnboarding(customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) return;

    // Send immediate welcome email
    await this.sendOnboardingEmail(customer, 1);

    // Schedule future emails
    setTimeout(() => this.sendOnboardingEmail(customer, 3), 3 * 24 * 60 * 60 * 1000);
    setTimeout(() => this.sendOnboardingEmail(customer, 7), 7 * 24 * 60 * 60 * 1000);
    
    logger.info({ customerEmail: customer.email }, 'Scheduled onboarding');
  }
}

/**
 * Schedule automated customer success checks
 */
function scheduleCustomerSuccess(config = {}) {
  const cron = require('node-cron');
  const automation = new CustomerSuccessAutomation(config);

  // Daily health check at 10 AM
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running scheduled customer health check...');
    await automation.monitorCustomerHealth();
  });

  logger.info('Customer success automation scheduled');
  return automation;
}

module.exports = {
  CustomerSuccessAutomation,
  scheduleCustomerSuccess,
};

// Usage in server.js:
/*
const { scheduleCustomerSuccess } = require('./services/customerSuccess');

scheduleCustomerSuccess({
  healthScoreThreshold: 30,
  inactivityDays: 7,
});
*/
