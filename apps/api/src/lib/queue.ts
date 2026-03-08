import { Queue, Worker } from "bullmq";
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
      console.log("dispatch-recompute job", job.data);
    },
    { connection: redis }
  );

  new Worker(
    "anomaly-scan",
    async (job) => {
      console.log("anomaly-scan job", job.data);
    },
    { connection: redis }
  );
}
