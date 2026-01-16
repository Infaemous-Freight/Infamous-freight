/**
 * Phase 20 Integration Guide
 * 
 * Shows how to integrate billing services into the main API application
 * This file is a reference guide - copy patterns into your api/src/app.js
 */

// ============================================
// 1. IMPORTS (Add to your app.js)
// ============================================

import billingRoutes from './routes/billing';
import { scheduleMonthlyInvoicing } from './jobs/monthlyInvoicing';
import { recordJobCompletion } from './billing/usage';
import { createStripeSubscription, storeComplianceDocuments } from './billing/stripeSync';
import { storeComplianceDocuments as generateDocs } from './billing/documents';

// ============================================
// 2. REGISTER BILLING ROUTES (app setup)
// ============================================

/**
 * Add this to your Express app setup (after other routes):
 */
app.use('/api/billing', billingRoutes);

// ============================================
// 3. SCHEDULE MONTHLY INVOICING JOB (app startup)
// ============================================

/**
 * Add this to your API server startup (after database connection):
 */
async function startupTasks() {
  try {
    console.log('[Startup] Scheduling monthly invoicing job...');
    await scheduleMonthlyInvoicing();
    console.log('[Startup] Monthly invoicing scheduled for 1st of month');
  } catch (err) {
    console.error('[Startup] Failed to schedule invoicing:', err);
    // Don't fail startup if job scheduling fails
  }
}

// Call during server startup
startupTasks();

// ============================================
// 4. INTEGRATE WITH ORG CREATION (routes/orgs.js)
// ============================================

/**
 * When creating a new organization, set up billing:
 */
import { Router } from 'express';
const router = Router();

router.post('/orgs', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user.sub;

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // PHASE 20: Create default subscription (STARTER plan)
    try {
      const sub = await createStripeSubscription(
        org.id,
        org.name,
        'STARTER',
        req.user.email
      );
      console.log(`[OrgCreation] Subscription created: ${sub.subscriptionId}`);

      // Generate compliance docs
      const docs = await generateDocs(org.id, org.name, sub.stripeCustomerId);
      console.log(`[OrgCreation] Compliance docs stored`);
    } catch (billingErr) {
      console.error('[OrgCreation] Billing setup failed:', billingErr);
      // Log but don't block org creation
    }

    res.status(201).json({
      success: true,
      data: org,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

// ============================================
// 5. INTEGRATE WITH JOB COMPLETION (routes/jobs.js)
// ============================================

/**
 * When a job transitions to COMPLETED, record billing:
 */
router.patch('/jobs/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, vehicleType, finalPrice } = req.body;
    const orgId = req.auth.organizationId;

    // Update job
    const job = await prisma.job.update({
      where: { id },
      data: { status },
      include: { organization: true },
    });

    // PHASE 20: Record billing when job completes
    if (status === 'COMPLETED' && vehicleType && finalPrice) {
      try {
        await recordJobCompletion(orgId, id, vehicleType, finalPrice);
        console.log(`[JobCompletion] Billing recorded: ${id} - $${finalPrice}`);
      } catch (billingErr) {
        console.error('[JobCompletion] Failed to record billing:', billingErr);
        // Log but don't block job update
      }
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// 6. OPTIONAL: ADMIN ENDPOINTS (routes/admin.js)
// ============================================

/**
 * Add admin-only endpoints for manual operations:
 */
import { Router } from 'express';
import { authenticate, requireScope } from '../middleware/security';
import { triggerMonthlyInvoicing } from '../jobs/monthlyInvoicing';

const adminRouter = Router();

/**
 * POST /api/admin/billing/invoices/generate
 * Manually trigger monthly invoice generation (admin only)
 */
adminRouter.post(
  '/billing/invoices/generate',
  authenticate,
  requireScope('admin:billing'),
  async (req, res, next) => {
    try {
      const jobId = await triggerMonthlyInvoicing();
      res.json({
        success: true,
        message: 'Monthly invoicing triggered',
        jobId,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/billing/revenue
 * Get monthly recurring revenue (MRR) breakdown
 */
adminRouter.get(
  '/billing/revenue',
  authenticate,
  requireScope('admin:billing'),
  async (req, res, next) => {
    try {
      const stats = await prisma.orgBilling.groupBy({
        by: ['plan'],
        _count: true,
        _sum: { monthlyBase: true },
      });

      const mrrByPlan = stats.reduce((acc, stat) => {
        acc[stat.plan] = {
          count: stat._count,
          mrr: stat._sum.monthlyBase || 0,
        };
        return acc;
      }, {});

      const totalMrr = Object.values(mrrByPlan).reduce(
        (sum, plan) => sum + (plan.mrr * plan.count),
        0
      );

      res.json({
        success: true,
        data: {
          totalMrr,
          byPlan: mrrByPlan,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/billing/usage
 * Get usage analytics (jobs vs quota)
 */
adminRouter.get(
  '/billing/usage',
  authenticate,
  requireScope('admin:billing'),
  async (req, res, next) => {
    try {
      const { month } = req.query;
      const queryMonth = month || new Date().toISOString().slice(0, 7);

      const usage = await prisma.orgUsage.findMany({
        where: { month: queryMonth },
        include: {
          organization: {
            include: { billing: true },
          },
        },
        orderBy: { revenue: 'desc' },
      });

      const stats = {
        totalOrgs: usage.length,
        totalJobs: usage.reduce((sum, u) => sum + u.jobs, 0),
        totalRevenue: usage.reduce((sum, u) => sum + u.revenue, 0),
        overageOrgs: usage.filter((u) => u.overageJobs > 0).length,
        totalOverageCharge: usage.reduce((sum, u) => sum + u.overageCharge, 0),
        byPlan: {},
      };

      // Group by plan
      usage.forEach((u) => {
        const plan = u.organization.billing?.plan || 'UNPLANNED';
        if (!stats.byPlan[plan]) {
          stats.byPlan[plan] = {
            count: 0,
            jobs: 0,
            revenue: 0,
          };
        }
        stats.byPlan[plan].count += 1;
        stats.byPlan[plan].jobs += u.jobs;
        stats.byPlan[plan].revenue += u.revenue;
      });

      res.json({
        success: true,
        data: {
          month: queryMonth,
          stats,
          details: usage,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/billing/invoices
 * Get invoice status (paid, overdue, etc.)
 */
adminRouter.get(
  '/billing/invoices',
  authenticate,
  requireScope('admin:billing'),
  async (req, res, next) => {
    try {
      const invoices = await prisma.orgInvoice.findMany({
        include: { organization: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const stats = {
        total: invoices.length,
        paid: invoices.filter((i) => i.stripeStatus === 'paid').length,
        pending: invoices.filter((i) => i.stripeStatus === 'open').length,
        overdue: invoices.filter(
          (i) =>
            i.stripeStatus === 'open' &&
            new Date(i.createdAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length,
        totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      };

      res.json({
        success: true,
        data: {
          stats,
          invoices: invoices.slice(0, 20),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default adminRouter;

// ============================================
// 7. OPTIONAL: STRIPE WEBHOOK HANDLER (routes/webhooks.js)
// ============================================

/**
 * Handle Stripe events (payment success, invoice updates, etc.)
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('[Webhook] Payment succeeded', event.data.object.id);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('[Webhook] Invoice paid', invoice.id);
        // Mark invoice as paid
        // await markInvoicePaid(invoice.metadata.orgId, invoice.metadata.month);
        break;

      case 'invoice.payment_failed':
        console.log('[Webhook] Invoice payment failed', event.data.object.id);
        // Send payment failure notification
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('[Webhook] Subscription updated', subscription.id);
        // Sync subscription status
        // await syncSubscriptionStatus(subscription.metadata.orgId);
        break;

      case 'customer.subscription.deleted':
        console.log('[Webhook] Subscription deleted', event.data.object.id);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error processing event:', err);
    res.status(500).send('Webhook handler error');
  }
}

// ============================================
// 8. FULL APP.JS EXAMPLE
// ============================================

/**
 * Here's how everything fits together in your main app.js:
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from './middleware/security';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';
import orgRoutes from './routes/orgs';
import jobRoutes from './routes/jobs';
import { scheduleMonthlyInvoicing } from './jobs/monthlyInvoicing';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/orgs', orgRoutes);      // Includes org creation → billing setup
app.use('/api/jobs', jobRoutes);      // Includes job completion → billing record
app.use('/api/billing', billingRoutes); // NEW: Phase 20 billing endpoints
app.use('/api/admin', authenticate, adminRoutes); // Admin analytics

// Start server
const PORT = process.env.API_PORT || 4000;
app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);

  // Schedule monthly invoicing job
  try {
    await scheduleMonthlyInvoicing();
    console.log('Monthly invoicing job scheduled');
  } catch (err) {
    console.error('Failed to schedule invoicing:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

// ============================================
// 9. ENVIRONMENT VARIABLES REQUIRED
// ============================================

/**
 * Add these to your .env file:
 * 
 * # Stripe
 * STRIPE_SECRET_KEY=sk_test_...
 * STRIPE_PUBLISHABLE_KEY=pk_test_...
 * STRIPE_PRICE_STARTER=price_...
 * STRIPE_PRICE_GROWTH=price_...
 * STRIPE_PRICE_ENTERPRISE=price_...
 * STRIPE_WEBHOOK_SECRET=whsec_...
 * 
 * # Billing
 * SEND_INVOICES=false
 * INVOICE_TIMEZONE=America/Los_Angeles
 * 
 * # Redis (for BullMQ)
 * REDIS_URL=redis://localhost:6379
 * 
 * # Notifications (optional)
 * SLACK_WEBHOOK_URL=https://hooks.slack.com/...
 */

// ============================================
// 10. TESTING THE INTEGRATION
// ============================================

/**
 * Manual testing sequence:
 * 
 * 1. Create an organization (triggers STARTER subscription)
 *    POST /api/orgs
 *    { "name": "Test Company" }
 * 
 * 2. Verify subscription created
 *    GET /api/billing/subscription
 * 
 * 3. Create and complete a job
 *    POST /api/jobs
 *    { "price": 150, "vehicleType": "VAN", ... }
 *    PATCH /api/jobs/123
 *    { "status": "COMPLETED" }
 * 
 * 4. Check usage recorded
 *    GET /api/billing/usage?month=2025-01
 * 
 * 5. Trigger monthly invoicing (admin)
 *    POST /api/admin/billing/invoices/generate
 * 
 * 6. Verify invoice generated
 *    GET /api/billing/invoice/2025-01
 */

export { handleStripeWebhook };
