import express from "express";
import crypto from "crypto";
import { handleWebhookEvent } from "./handlers.js";
import { markDelivery, seenDelivery } from "./idempotency.js";

const app = express();

app.get("/health", (_, res) => res.status(200).send("ok"));

// Raw body is REQUIRED for signature verification
app.post("/github/webhook", express.raw({ type: "application/json", limit: "2mb" }), async (req, res) => {
  const delivery = req.get("X-GitHub-Delivery") || "";
  const event = req.get("X-GitHub-Event") || "";
  const signature = req.get("X-Hub-Signature-256") || "";

  if (!delivery || !event) return res.status(400).send("missing headers");

  // Idempotency: drop replays
  if (seenDelivery(delivery)) return res.status(200).send("duplicate");
  markDelivery(delivery);

  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  if (!secret) return res.status(500).send("missing webhook secret");

  const hmac = crypto.createHmac("sha256", secret);
  const expected = "sha256=" + hmac.update(req.body).digest("hex");

  const ok =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!ok) return res.status(401).send("bad signature");

  const payload = JSON.parse(req.body.toString("utf8"));

  try {
    await handleWebhookEvent({ event, delivery, payload });
    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Orchestrator listening on :${process.env.PORT || 3000}`);
});
