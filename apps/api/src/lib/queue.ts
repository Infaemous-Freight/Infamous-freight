import { Queue, Worker } from "bullmq";
import { handleAnomalyScanJob } from "../jobs/anomaly-scan.job.js";
import { handleDispatchRecomputeJob } from "../jobs/dispatch-recompute.job.js";
import { redis } from "./redis.js";

export const dispatchQueue = new Queue("dispatch-recompute", {
  connection: redis
});

export const anomalyQueue = new Queue("anomaly-scan", {
  connection: redis
});

export function startWorkers() {
  new Worker(
    "dispatch-recompute",
    async (job) => {
      await handleDispatchRecomputeJob(job.data as { organizationId: string; loadId: string });
    },
    { connection: redis }
  );

  new Worker(
    "anomaly-scan",
    async (job) => {
      await handleAnomalyScanJob(job.data as { organizationId: string; driverId: string });
    },
    { connection: redis }
  );
}
