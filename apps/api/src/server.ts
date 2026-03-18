import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const app = createApp();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Infamous Freight API started");
});
