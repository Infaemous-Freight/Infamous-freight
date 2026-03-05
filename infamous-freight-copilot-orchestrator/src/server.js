import express from "express";
import crypto from "crypto";
import { handleWebhookEvent } from "./handlers.js";
import { markDelivery, seenDelivery } from "./idempotency.js";
import { adminRouter } from "./admin.js";
import { auditLog } from "./audit.js";

const app = express();

app.get("/health", (_, res) => res.status(200).send("ok"));

// Admin endpoints use normal JSON parsing
app.use(express.json());
app.use(adminRouter());

// Webhook endpoint MUST use raw body for signature verification
app.post("/github/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const delivery = req.get("X-GitHub-Delivery") || "";
  const event = req.get("X-GitHub-Event") || "";
  const signature = req.get("X-Hub-Signature-256") || "";

  if (!delivery || !event) return res.status(400).send("missing headers");

  // Idempotency: drop replays
  if (seenDelivery(delivery)) {
    auditLog({ level: "info", action: "drop_duplicate", delivery, event });
    return res.status(200).send("duplicate");
  }
  markDelivery(delivery);

  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  if (!secret) return res.status(500).send("missing webhook secret");

  // Validate signature: sha256=HMAC_HEX(raw_body)
  const hmac = crypto.createHmac("sha256", secret);
  const expected = "sha256=" + hmac.update(req.body).digest("hex");

  const ok =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!ok) {
    auditLog({ level: "warn", action: "reject_bad_signature", delivery, event });
    return res.status(401).send("bad signature");
  }

  const payload = JSON.parse(req.body.toString("utf8"));

  try {
    const t0 = Date.now();
    await handleWebhookEvent({ event, delivery, payload });

    auditLog({
      level: "info",
      action: "handled",
      delivery,
      event,
      repo: payload?.repository?.full_name,
      ms: Date.now() - t0
    });

    return res.status(200).send("ok");
  } catch (err) {
    auditLog({
      level: "error",
      action: "handler_error",
      delivery,
      event,
      repo: payload?.repository?.full_name,
      message: String(err?.message || err),
      stack: String(err?.stack || "")
    });

    console.error("Webhook handler error:", err);
    return res.status(500).send("error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Orchestrator listening on :${process.env.PORT || 3000}`);
});
