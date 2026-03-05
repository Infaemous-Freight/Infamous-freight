import crypto from "node:crypto";
import express from "express";
import { handleWebhookEvent } from "./handlers.js";

const app = express();

function verifyWebhookSignature(req, secret) {
  const signature = req.get("X-Hub-Signature-256") || "";
  if (!secret || !signature) return false;

  const digest = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex")}`;

  const signatureBuffer = Buffer.from(signature, "utf8");
  const digestBuffer = Buffer.from(digest, "utf8");

  if (signatureBuffer.length !== digestBuffer.length) return false;
  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

app.post("/github/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

  if (!verifyWebhookSignature(req, secret)) {
    return res.status(401).send("bad signature");
  }

  const event = req.get("X-GitHub-Event") || "";
  const delivery = req.get("X-GitHub-Delivery") || "";
  const payload = JSON.parse(req.body.toString("utf8"));

  try {
    await handleWebhookEvent({ event, delivery, payload });
    return res.status(200).send("ok");
  } catch (error) {
    console.error("webhook handler error", { event, delivery, error });
    return res.status(500).send("error");
  }
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
