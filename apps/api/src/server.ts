import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startWorkers } from "./lib/queue.js";
import { initTelemetry } from "./lib/telemetry.js";

initTelemetry();

const app = createApp();

app.listen(env.PORT, () => {
  startWorkers();
  console.log(`Infamous Freight API running on :${env.PORT}`);
});
