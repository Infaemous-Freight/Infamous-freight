/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Marketplace Metrics Dashboard Service
 */

const { redis } = require("../lib/redisCache");
const logger = require("../middleware/logger").logger;

/**
 * Marketplace Metrics Collector
 * Tracks queue performance, worker health, and system metrics
 */
class MetricsService {
  constructor() {
    this.metrics = {
      queues: {
        dispatch: {
          processed: 0,
          failed: 0,
          active: 0,
          waiting: 0,
          avgDuration: 0,
        },
        eta: { processed: 0, failed: 0, active: 0, waiting: 0, avgDuration: 0 },
        expiry: {
          processed: 0,
          failed: 0,
          active: 0,
          waiting: 0,
          avgDuration: 0,
        },
      },
      workers: {
        dispatch: { active: 0, idle: 0, errors: 0 },
        eta: { active: 0, idle: 0, errors: 0 },
        expiry: { active: 0, idle: 0, errors: 0 },
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    this.enabled = process.env.METRICS_ENABLED === "true";
    // Skip auto-start in test environment
    if (this.enabled && process.env.NODE_ENV !== "test") {
      this.startCollection();
    }
  }

  /**
   * Start periodic metrics collection
   */
  startCollection() {
    // Collect metrics every 30 seconds
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectQueueMetrics();
        await this.collectSystemMetrics();
      } catch (error) {
        logger.error("[Metrics] Collection error", { error: error.message });
      }
    }, 30000);

    logger.info("[Metrics] Collection started (interval: 30s)");
  }

  /**
   * Collect queue metrics from BullMQ
   */
  async collectQueueMetrics() {
    if (!redis) return;

    try {
      const queues = ["dispatch", "eta", "expiry"];

      for (const queueName of queues) {
        // Get queue counts from Redis
        const waiting = (await redis.llen(`bull:${queueName}:wait`)) || 0;
        const active = (await redis.llen(`bull:${queueName}:active`)) || 0;

        // Get completed and failed counts from sorted sets
        const completedCount =
          (await redis.zcard(`bull:${queueName}:completed`)) || 0;
        const failedCount =
          (await redis.zcard(`bull:${queueName}:failed`)) || 0;

        this.metrics.queues[queueName] = {
          ...this.metrics.queues[queueName],
          waiting,
          active,
          processed: completedCount,
          failed: failedCount,
        };
      }
    } catch (error) {
      logger.warn("[Metrics] Queue collection error", { error: error.message });
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    this.metrics.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics() {
    const metrics = [];
    const timestamp = Date.now();

    // Queue metrics
    for (const [queueName, data] of Object.entries(this.metrics.queues)) {
      metrics.push(
        `infamous_queue_processed_total{queue="${queueName}"} ${data.processed} ${timestamp}`,
      );
      metrics.push(
        `infamous_queue_failed_total{queue="${queueName}"} ${data.failed} ${timestamp}`,
      );
      metrics.push(
        `infamous_queue_active{queue="${queueName}"} ${data.active} ${timestamp}`,
      );
      metrics.push(
        `infamous_queue_waiting{queue="${queueName}"} ${data.waiting} ${timestamp}`,
      );
    }

    // Worker metrics
    for (const [workerName, data] of Object.entries(this.metrics.workers)) {
      metrics.push(
        `infamous_worker_active{worker="${workerName}"} ${data.active} ${timestamp}`,
      );
      metrics.push(
        `infamous_worker_idle{worker="${workerName}"} ${data.idle} ${timestamp}`,
      );
      metrics.push(
        `infamous_worker_errors_total{worker="${workerName}"} ${data.errors} ${timestamp}`,
      );
    }

    // System metrics
    metrics.push(
      `infamous_uptime_seconds ${Math.floor(this.metrics.system.uptime)} ${timestamp}`,
    );
    metrics.push(
      `infamous_memory_heap_used_bytes ${this.metrics.system.memory.heapUsed} ${timestamp}`,
    );
    metrics.push(
      `infamous_memory_heap_total_bytes ${this.metrics.system.memory.heapTotal} ${timestamp}`,
    );
    metrics.push(
      `infamous_memory_rss_bytes ${this.metrics.system.memory.rss} ${timestamp}`,
    );

    return metrics.join("\n");
  }

  /**
   * Record queue job completion
   */
  recordJobCompletion(queueName, duration, success = true) {
    if (!this.metrics.queues[queueName]) return;

    if (success) {
      this.metrics.queues[queueName].processed++;
    } else {
      this.metrics.queues[queueName].failed++;
    }

    // Update average duration (simple moving average)
    const current = this.metrics.queues[queueName].avgDuration;
    this.metrics.queues[queueName].avgDuration = current * 0.9 + duration * 0.1;
  }

  /**
   * Record worker state change
   */
  recordWorkerState(workerName, state) {
    if (!this.metrics.workers[workerName]) return;

    if (state === "active") {
      this.metrics.workers[workerName].active++;
      this.metrics.workers[workerName].idle = Math.max(
        0,
        this.metrics.workers[workerName].idle - 1,
      );
    } else if (state === "idle") {
      this.metrics.workers[workerName].idle++;
      this.metrics.workers[workerName].active = Math.max(
        0,
        this.metrics.workers[workerName].active - 1,
      );
    } else if (state === "error") {
      this.metrics.workers[workerName].errors++;
    }
  }

  /**
   * Get dashboard-friendly summary
   */
  getDashboardSummary() {
    const totalProcessed = Object.values(this.metrics.queues).reduce(
      (sum, q) => sum + q.processed,
      0,
    );
    const totalFailed = Object.values(this.metrics.queues).reduce(
      (sum, q) => sum + q.failed,
      0,
    );
    const totalActive = Object.values(this.metrics.queues).reduce(
      (sum, q) => sum + q.active,
      0,
    );
    const totalWaiting = Object.values(this.metrics.queues).reduce(
      (sum, q) => sum + q.waiting,
      0,
    );

    const successRate =
      totalProcessed + totalFailed > 0
        ? ((totalProcessed / (totalProcessed + totalFailed)) * 100).toFixed(2)
        : 100;

    return {
      overview: {
        totalProcessed,
        totalFailed,
        totalActive,
        totalWaiting,
        successRate: `${successRate}%`,
      },
      queues: this.metrics.queues,
      workers: this.metrics.workers,
      system: {
        uptime: Math.floor(this.metrics.system.uptime),
        memory: {
          used: `${(this.metrics.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          total: `${(this.metrics.system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Stop metrics collection
   */
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      logger.info("[Metrics] Collection stopped");
    }
  }
}

// Singleton instance
let metricsInstance = null;

function getMetricsService() {
  if (!metricsInstance) {
    metricsInstance = new MetricsService();
  }
  return metricsInstance;
}

module.exports = {
  MetricsService,
  getMetricsService,
};
