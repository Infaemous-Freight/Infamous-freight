import "./instrument.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runStartupChecks } from "./config/startup-checks.js";
import { logger } from "./lib/logger.js";

runStartupChecks();

const app = createApp();

app.listen(env.appPort, "0.0.0.0", () => {
  logger.info({ port: env.appPort }, "Infamous Freight API started");
});
