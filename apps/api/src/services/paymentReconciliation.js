/**
 * Payment Reconciliation Service
 * Validates and reconciles payment transactions with Stripe
 * Ensures financial accuracy and detects discrepancies
 */

const Stripe = require("stripe");
const { logger } = require("../middleware/logger");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Payment Reconciliation Engine
 */
class PaymentReconciliation {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Reconcile all payments
   * Compares local database against Stripe records
   */
  async reconcileAllPayments(options = {}) {
    const startDate = options.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();

    logger.info("Starting payment reconciliation", { startDate, endDate });

    try {
      // Get local payments
      const localPayments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get Stripe payments
      const stripePayments = [];
      let hasMore = true;
      let startingAfter = null;

      while (hasMore) {
        const page = await stripe.paymentIntents.list({
          limit: 100,
          starting_after: startingAfter,
          created: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          },
        });

        stripePayments.push(...page.data);
        hasMore = page.has_more;
        startingAfter = page.data[page.data.length - 1]?.id;
      }

      // Reconcile
      const discrepancies = [];

      // Check all local payments have Stripe record
      for (const localPayment of localPayments) {
        const stripePayment = stripePayments.find(
          (p) => p.id === localPayment.stripePaymentIntentId,
        );

        if (!stripePayment) {
          discrepancies.push({
            type: "MISSING_IN_STRIPE",
            localPayment,
          });
        } else if (localPayment.amount !== stripePayment.amount / 100) {
          discrepancies.push({
            type: "AMOUNT_MISMATCH",
            localPayment,
            stripePayment,
          });
        } else if (localPayment.status !== mapStripeStatus(stripePayment.status)) {
          discrepancies.push({
            type: "STATUS_MISMATCH",
            localPayment,
            stripePayment,
          });
        }
      }

      // Check for Stripe payments not in local DB
      for (const stripePayment of stripePayments) {
        const localPayment = localPayments.find(
          (p) => p.stripePaymentIntentId === stripePayment.id,
        );

        if (!localPayment) {
          discrepancies.push({
            type: "MISSING_IN_LOCAL_DB",
            stripePayment,
          });
        }
      }

      const report = {
        period: { startDate, endDate },
        totalLocalPayments: localPayments.length,
        totalStripePayments: stripePayments.length,
        discrepancies,
        discrepancyCount: discrepancies.length,
        status: discrepancies.length === 0 ? "RECONCILED" : "DISCREPANCIES_FOUND",
        generatedAt: new Date(),
      };

      logger.info("Payment reconciliation completed", {
        localCount: localPayments.length,
        stripeCount: stripePayments.length,
        discrepancyCount: discrepancies.length,
      });

      return report;
    } catch (error) {
      logger.error("Payment reconciliation failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Reconcile single payment
   */
  async reconcilePayment(paymentId) {
    try {
      const localPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!localPayment) {
        throw new Error("Payment not found in local DB");
      }

      const stripePayment = await stripe.paymentIntents.retrieve(
        localPayment.stripePaymentIntentId,
      );

      const issues = [];

      if (localPayment.amount !== stripePayment.amount / 100) {
        issues.push(`Amount mismatch: ${localPayment.amount} vs ${stripePayment.amount / 100}`);
      }

      if (localPayment.status !== mapStripeStatus(stripePayment.status)) {
        issues.push(
          `Status mismatch: ${localPayment.status} vs ${mapStripeStatus(stripePayment.status)}`,
        );
      }

      return {
        paymentId,
        reconciled: issues.length === 0,
        issues,
        localPayment,
        stripePayment,
      };
    } catch (error) {
      logger.error("Single payment reconciliation failed", {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fix discrepancy by updating local record
   */
  async fixDiscrepancy(discrepancy) {
    try {
      const { type, localPayment, stripePayment } = discrepancy;

      switch (type) {
        case "AMOUNT_MISMATCH":
          // Update local amount to match Stripe
          await this.prisma.payment.update({
            where: { id: localPayment.id },
            data: { amount: stripePayment.amount / 100 },
          });
          logger.warn("Fixed amount mismatch", { paymentId: localPayment.id });
          break;

        case "STATUS_MISMATCH":
          // Update local status to match Stripe
          await this.prisma.payment.update({
            where: { id: localPayment.id },
            data: { status: mapStripeStatus(stripePayment.status) },
          });
          logger.warn("Fixed status mismatch", { paymentId: localPayment.id });
          break;

        case "MISSING_IN_STRIPE":
          // Log issue, manual review needed
          logger.error("Payment missing in Stripe", { paymentId: localPayment.id });
          break;

        case "MISSING_IN_LOCAL_DB": {
          // Create local record from Stripe
          const userId = await findUserByStripePaymentIntent(stripePayment.id);
          if (userId) {
            await this.prisma.payment.create({
              data: {
                stripePaymentIntentId: stripePayment.id,
                userId,
                amount: stripePayment.amount / 100,
                currency: stripePayment.currency,
                status: mapStripeStatus(stripePayment.status),
              },
            });
            logger.info("Created missing local payment record", {
              stripeId: stripePayment.id,
            });
          }
          break;
        }
      }

      return { fixed: true, type };
    } catch (error) {
      logger.error("Failed to fix discrepancy", { error: error.message });
      throw error;
    }
  }

  /**
   * Generate reconciliation report
   */
  async generateReport(startDate, endDate) {
    const report = await this.reconcileAllPayments({ startDate, endDate });
    return report;
  }
}

/**
 * Map Stripe payment status to local status
 */
function mapStripeStatus(stripeStatus) {
  const mapping = {
    succeeded: "succeeded",
    requires_payment_method: "pending",
    requires_confirmation: "pending",
    requires_action: "requires_action",
    processing: "processing",
    canceled: "canceled",
  };
  return mapping[stripeStatus] || stripeStatus;
}

/**
 * Find user by Stripe payment intent (for missing local records)
 * Retrieves the payment intent from Stripe and extracts userId from metadata
 */
async function findUserByStripePaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata && paymentIntent.metadata.userId) {
      return paymentIntent.metadata.userId;
    }
    return null;
  } catch (error) {
    logger.warn("Failed to retrieve payment intent from Stripe", {
      paymentIntentId,
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  PaymentReconciliation,
  mapStripeStatus,
};
