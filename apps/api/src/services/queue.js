/**
 * Redis Message Queue Service
 * Handles async jobs: email, notifications, webhook retries, batch processing
 * Uses BullMQ for reliable job queuing with progress tracking
 */

const { Queue, Worker, QueueScheduler } = require("bullmq");
const Redis = require("ioredis");
const { logger } = require("../middleware/logger");
const prisma = require("../lib/prisma");

// Create Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  enableReadyCheck: false,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn("Redis reconnecting", { attempt: times, delay });
    return delay;
  },
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error", { error: err.message });
});

redisConnection.on("connect", () => {
  logger.info("Redis connected");
});

/**
 * Queue: Email notifications
 * Retry up to 3 times with exponential backoff
 */
const emailQueue = new Queue("emails", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
  },
});

/**
 * Queue: Webhook deliveries
 * Retry up to 5 times (webhooks are critical)
 */
const webhookQueue = new Queue("webhooks", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 7200, // Keep for 2 hours
    },
  },
});

/**
 * Queue: SMS notifications
 * Retry up to 3 times
 */
const smsQueue = new Queue("sms", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: {
      age: 3600,
    },
  },
});

/**
 * Queue: Push notifications
 * Retry up to 2 times (low priority)
 */
const pushQueue = new Queue("push-notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 1800,
    },
  },
});

/**
 * Queue: Batch processing
 * Analytics aggregation, report generation
 * No retry as it's scheduled
 */
const batchQueue = new Queue("batch-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
    },
  },
});

/**
 * Queue: Audit logging (highest priority)
 * Never lose audit logs
 */
const auditQueue = new Queue("audit-logs", {
  connection: redisConnection,
  defaultJobOptions: {
    priority: 10,
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
    },
  },
});

/**
 * Queue: File processing
 * Document OCR, image optimization, etc.
 */
const fileQueue = new Queue("file-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600,
    },
  },
});

/**
 * Queue: Periodic tasks
 * Cleanup, maintenance, health checks
 */
const scheduledQueue = new Queue("scheduled-tasks", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,
    },
  },
});

/**
 * Initialize queue schedulers for repeating jobs
 */
function initializeSchedulers() {
  try {
    new QueueScheduler("emails", { connection: redisConnection });
    new QueueScheduler("webhooks", { connection: redisConnection });
    new QueueScheduler("sms", { connection: redisConnection });
    new QueueScheduler("batch-processing", { connection: redisConnection });
    new QueueScheduler("scheduled-tasks", { connection: redisConnection });
    logger.info("Queue schedulers initialized");
  } catch (error) {
    logger.error("Failed to initialize queue schedulers", { error: error.message });
  }
}

/**
 * Set up email worker
 */
function startEmailWorker() {
  const emailWorker = new Worker(
    "emails",
    async (job) => {
      try {
        logger.info("Processing email job", {
          jobId: job.id,
          to: job.data.to,
        });

        // TODO: Integrate with SendGrid or your email provider
        // const result = await sendgridClient.send({
        //   to: job.data.to,
        //   from: job.data.from,
        //   subject: job.data.subject,
        //   html: job.data.html,
        // });

        job.progress(100);
        return { sent: true, messageId: "mock-message-id" };
      } catch (error) {
        logger.error("Email job failed", {
          jobId: job.id,
          error: error.message,
        });
        throw error; // Retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 emails in parallel
    },
  );

  emailWorker.on("completed", (job) => {
    logger.info("Email job completed", { jobId: job.id });
  });

  emailWorker.on("failed", (job, err) => {
    logger.error("Email job failed after retries", {
      jobId: job.id,
      attempts: job.attemptsMade,
      error: err.message,
    });
  });

  return emailWorker;
}

/**
 * Set up webhook worker
 */
function startWebhookWorker() {
  const webhookWorker = new Worker(
    "webhooks",
    async (job) => {
      try {
        logger.info("Delivering webhook", {
          jobId: job.id,
          url: job.data.url,
          event: job.data.event,
        });

        // TODO: Implement webhook delivery with signature verification
        // const response = await axios.post(job.data.url, job.data.payload, {
        //   headers: {
        //     'X-Webhook-Signature': generateSignature(job.data.payload),
        //   },
        //   timeout: 10000,
        // });

        job.progress(100);
        return { delivered: true, statusCode: 200 };
      } catch (error) {
        logger.warn("Webhook delivery failed, will retry", {
          jobId: job.id,
          attempts: job.attemptsMade,
          error: error.message,
        });
        throw error; // Retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process up to 10 webhooks in parallel
    },
  );

  webhookWorker.on("failed", (job, err) => {
    logger.error("Webhook job failed after retries", {
      jobId: job.id,
      attempts: job.attemptsMade,
      url: job.data.url,
    });
  });

  return webhookWorker;
}

/**
 * Set up audit logging worker
 */
function startAuditWorker() {
  const auditWorker = new Worker(
    "audit-logs",
    async (job) => {
      try {
        logger.info("Processing audit log", {
          jobId: job.id,
          action: job.data.action,
          userId: job.data.userId,
        });

        // Persist audit log to database
        await prisma.auditLog.create({
          data: {
            userId: job.data.userId,
            action: job.data.action,
            resource: job.data.resource,
            changes: job.data.changes,
            metadata: job.data.metadata,
            timestamp: job.data.timestamp ? new Date(job.data.timestamp) : new Date(),
          },
        });

        job.progress(100);
        return { logged: true };
      } catch (error) {
        logger.error("Audit log job failed", {
          jobId: job.id,
          error: error.message,
        });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 20, // High concurrency for non-blocking audit logs
    },
  );

  return auditWorker;
}

/**
 * Set up batch processing worker
 */
function startBatchWorker() {
  const batchWorker = new Worker(
    "batch-processing",
    async (job) => {
      try {
        logger.info("Processing batch job", {
          jobId: job.id,
          type: job.data.type,
        });

        // Process based on type
        switch (job.data.type) {
          case "daily-analytics":
            // TODO: Aggregate daily analytics
            break;
          case "report-generation":
            // TODO: Generate reports
            break;
          case "cleanup":
            // TODO: Cleanup old data
            break;
        }

        job.progress(100);
        return { processed: true };
      } catch (error) {
        logger.error("Batch job failed", {
          jobId: job.id,
          error: error.message,
        });
        // Don't retry batch jobs, just log
        return { error: error.message };
      }
    },
    {
      connection: redisConnection,
      concurrency: 2, // Low concurrency for heavy batch processing
    },
  );

  return batchWorker;
}

/**
 * Add email job to queue
 */
async function queueEmail(to, subject, html, options = {}) {
  try {
    const job = await emailQueue.add(
      "send",
      {
        to,
        subject,
        html,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@infamousfreight.com",
        ...options,
      },
      {
        jobId: `email-${to}-${Date.now()}`,
      },
    );

    logger.info("Email queued", { jobId: job.id, to });
    return job;
  } catch (error) {
    logger.error("Failed to queue email", { to, error: error.message });
    throw error;
  }
}

/**
 * Add webhook job to queue
 */
async function queueWebhook(url, event, payload, options = {}) {
  try {
    const job = await webhookQueue.add(
      "deliver",
      {
        url,
        event,
        payload,
        timestamp: new Date().toISOString(),
        ...options,
      },
      {
        jobId: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    );

    logger.info("Webhook queued", { jobId: job.id, url, event });
    return job;
  } catch (error) {
    logger.error("Failed to queue webhook", { url, error: error.message });
    throw error;
  }
}

/**
 * Add audit log job to queue
 */
async function queueAuditLog(userId, action, resource, changes, metadata = {}) {
  try {
    const job = await auditQueue.add(
      "log",
      {
        userId,
        action,
        resource,
        changes,
        metadata,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `audit-${userId}-${Date.now()}`,
      },
    );

    logger.info("Audit log queued", { jobId: job.id, action });
    return job;
  } catch (error) {
    logger.error("Failed to queue audit log", { action, error: error.message });
    // Don't throw - audit logging shouldn't break the system
    return null;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const stats = {
      emails: await emailQueue.getMetrics(),
      webhooks: await webhookQueue.getMetrics(),
      sms: await smsQueue.getMetrics(),
      push: await pushQueue.getMetrics(),
      batch: await batchQueue.getMetrics(),
      audit: await auditQueue.getMetrics(),
      file: await fileQueue.getMetrics(),
      scheduled: await scheduledQueue.getMetrics(),
    };

    return stats;
  } catch (error) {
    logger.error("Failed to get queue stats", { error: error.message });
    return null;
  }
}

/**
 * Close all queues gracefully
 */
async function closeQueues() {
  try {
    await Promise.all([
      emailQueue.close(),
      webhookQueue.close(),
      smsQueue.close(),
      pushQueue.close(),
      batchQueue.close(),
      auditQueue.close(),
      fileQueue.close(),
      scheduledQueue.close(),
    ]);

    await redisConnection.quit();
    logger.info("All queues closed");
  } catch (error) {
    logger.error("Error closing queues", { error: error.message });
  }
}

module.exports = {
  // Queues
  emailQueue,
  webhookQueue,
  smsQueue,
  pushQueue,
  batchQueue,
  auditQueue,
  fileQueue,
  scheduledQueue,
  redisConnection,

  // Functions
  initializeSchedulers,
  startEmailWorker,
  startWebhookWorker,
  startAuditWorker,
  startBatchWorker,
  queueEmail,
  queueWebhook,
  queueAuditLog,
  getQueueStats,
  closeQueues,
};
