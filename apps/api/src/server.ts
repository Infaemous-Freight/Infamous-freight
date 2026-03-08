import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startWorkers } from "./lib/queue.js";
import { registerTrackingSocket } from "./lib/ws.js";

const app = createApp();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/tracking" });

registerTrackingSocket(wss);

server.listen(env.PORT, () => {
  startWorkers();
  console.log(`Infamous Freight API running on :${env.PORT}`);
});
