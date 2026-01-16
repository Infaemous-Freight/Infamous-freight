/**
 * Monthly Invoice Generation Job (Phase 20.8)
 * 
 * BullMQ scheduled job that runs on the 1st of each month
 * to generate and send invoices for all active organizations
 */

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "redis";
import { PrismaClient } from "@prisma/client";
import { generateMonthlyInvoices } from "./invoicing";
import { logAuditEvent, AUDIT_ACTIONS } from "../audit/orgAuditLog";

const prisma = new PrismaClient();

// ============================================
// Queue Setup
// ============================================

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const monthlyInvoicingQueue = new Queue("monthly-invoicing", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const queueEvents = new QueueEvents("monthly-invoicing", {
  connection: redisConfig,
});

// ============================================
// Worker: Process Monthly Invoicing
// ============================================

export const monthlyInvoicingWorker = new Worker(
  "monthly-invoicing",
  async (job) => {
    console.log(`[MonthlyInvoicing] Starting job ${job.id}...`);

    const startTime = Date.now();
    const stats = {
      totalOrgs: 0,
      invoicesGenerated: 0,
      invoicesFailed: 0,
      totalRevenue: 0,
      errors: [] as string[],
    };

    try {
      // Get all active organizations
      const orgs = await prisma.organization.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          billing: {
            select: {
              id: true,
              plan: true,
            },
          },
        },
      });

      stats.totalOrgs = orgs.length;
      console.log(`[MonthlyInvoicing] Found ${stats.totalOrgs} active organizations`);

      // Generate invoices for each org
      for (const org of orgs) {
        try {
          // Skip if no billing plan
          if (!org.billing) {
            console.log(
              `[MonthlyInvoicing] Skipping ${org.name} - no billing setup`
            );
            continue;
          }

          // Generate invoice for previous month
          const invoice = await generateMonthlyInvoices();

          stats.invoicesGenerated += 1;
          stats.totalRevenue += invoice?.totalAmount || 0;

          console.log(
            `[MonthlyInvoicing] Generated invoice for ${org.name} - ${org.id}`
          );

          // Log audit event
          try {
            await logAuditEvent(prisma, {
              organizationId: org.id,
              userId: "system",
              action: AUDIT_ACTIONS.BILLING_INVOICE_GENERATED,
              entity: "invoice",
              entityId: invoice?.id || "unknown",
              metadata: {
                month: new Date().toISOString().slice(0, 7),
                amount: invoice?.totalAmount,
              },
            });
          } catch (auditErr) {
            console.warn(
              `[MonthlyInvoicing] Failed to log audit for ${org.id}:`,
              auditErr
            );
          }
        } catch (err) {
          stats.invoicesFailed += 1;
          const errorMsg = `Failed to invoice ${org.name}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          stats.errors.push(errorMsg);
          console.error(`[MonthlyInvoicing] ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[MonthlyInvoicing] Completed in ${duration}ms - Generated: ${stats.invoicesGenerated}, Failed: ${stats.invoicesFailed}, Revenue: $${stats.totalRevenue.toFixed(2)}`
      );

      return stats;
    } catch (err) {
      console.error(
        "[MonthlyInvoicing] Fatal error:",
        err instanceof Error ? err.message : String(err)
      );
      throw err;
    }
  },
  {
    connection: redisConfig,
    concurrency: 1, // Only one job at a time
  }
);

// ============================================
// Job Events
// ============================================

queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  console.log(`[MonthlyInvoicing] Job ${jobId} completed:`, returnvalue);

  // Send notification (e.g., to Slack or email)
  try {
    const stats = returnvalue as typeof stats;
    await notifyCompletion(stats);
  } catch (err) {
    console.error("[MonthlyInvoicing] Failed to notify:", err);
  }
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  console.error(`[MonthlyInvoicing] Job ${jobId} failed:`, failedReason);

  // Send error notification
  try {
    await notifyError(jobId, failedReason);
  } catch (err) {
    console.error("[MonthlyInvoicing] Failed to notify error:", err);
  }
});

// ============================================
// Notifications
// ============================================

async function notifyCompletion(stats: {
  totalOrgs: number;
  invoicesGenerated: number;
  invoicesFailed: number;
  totalRevenue: number;
  errors: string[];
}) {
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "✅ Monthly Invoicing Complete",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Monthly Invoicing Report*\n` +
                  `📊 Total Organizations: ${stats.totalOrgs}\n` +
                  `✅ Invoices Generated: ${stats.invoicesGenerated}\n` +
                  `❌ Failed: ${stats.invoicesFailed}\n` +
                  `💰 Total Revenue: $${stats.totalRevenue.toFixed(2)}\n` +
                  `⏰ Time: ${new Date().toLocaleString()}`,
              },
            },
          ],
        }),
      });
    } catch (err) {
      console.error("[MonthlyInvoicing] Slack notification failed:", err);
    }
  }
}

async function notifyError(jobId: string, reason: string) {
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "❌ Monthly Invoicing Failed",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Error in Monthly Invoicing*\n` +
                  `Job ID: ${jobId}\n` +
                  `Reason: ${reason}\n` +
                  `⏰ Time: ${new Date().toLocaleString()}`,
              },
            },
          ],
        }),
      });
    } catch (err) {
      console.error("[MonthlyInvoicing] Error notification failed:", err);
    }
  }
}

// ============================================
// Schedule Job (1st of month, midnight UTC)
// ============================================

export async function scheduleMonthlyInvoicing() {
  try {
    // Check if job already scheduled
    const existing = await monthlyInvoicingQueue.getRepeatableJobs();
    const alreadyScheduled = existing.some(
      (job) => job.name === "monthly-invoicing"
    );

    if (alreadyScheduled) {
      console.log("[MonthlyInvoicing] Job already scheduled, skipping...");
      return;
    }

    // Schedule for 1st of each month at midnight UTC
    // Cron: 0 0 1 * * (day 1 of month, midnight, every month)
    await monthlyInvoicingQueue.add(
      "monthly-invoicing",
      {},
      {
        repeat: {
          pattern: "0 0 1 * *", // 1st of month, 00:00 UTC
        },
      }
    );

    console.log("[MonthlyInvoicing] Scheduled job for 1st of each month");
  } catch (err) {
    console.error("[MonthlyInvoicing] Failed to schedule:", err);
    throw err;
  }
}

// ============================================
// Manual Trigger (for testing/catch-up)
// ============================================

export async function triggerMonthlyInvoicing() {
  try {
    const job = await monthlyInvoicingQueue.add("monthly-invoicing", {});
    console.log(`[MonthlyInvoicing] Triggered manual job: ${job.id}`);
    return job.id;
  } catch (err) {
    console.error("[MonthlyInvoicing] Failed to trigger:", err);
    throw err;
  }
}

// ============================================
// Cleanup & Shutdown
// ============================================

export async function cleanupMonthlyInvoicing() {
  try {
    await monthlyInvoicingWorker.close();
    await monthlyInvoicingQueue.close();
    await queueEvents.close();
    console.log("[MonthlyInvoicing] Cleanup complete");
  } catch (err) {
    console.error("[MonthlyInvoicing] Cleanup failed:", err);
  }
}

export default {
  monthlyInvoicingQueue,
  monthlyInvoicingWorker,
  scheduleMonthlyInvoicing,
  triggerMonthlyInvoicing,
  cleanupMonthlyInvoicing,
};
