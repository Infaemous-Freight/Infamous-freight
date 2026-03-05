const express = require("express");
const { limiters } = require("../middleware/security");
const { logger } = require("../middleware/logger");
const {
  assignCopilotToIssue,
  markDeliveryProcessed,
  shouldAssignCopilot,
  verifyGithubSignature,
} = require("../services/githubCopilotOrchestrator");

const router = express.Router();

router.use("/webhook", express.raw({ type: "application/json" }));

router.post("/webhook", limiters.webhook, async (req, res) => {
  const signature = req.get("X-Hub-Signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const deliveryId = req.get("X-GitHub-Delivery");
  const event = req.get("X-GitHub-Event");

  if (!verifyGithubSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: "invalid webhook signature" });
  }

  if (!deliveryId) {
    return res.status(400).json({ error: "missing X-GitHub-Delivery header" });
  }
  if (markDeliveryProcessed(deliveryId)) {
    return res.status(200).json({ ok: true, deduplicated: true });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch (_err) {
    return res.status(400).json({ error: "invalid JSON payload" });
  }

  try {
    const action = payload.action;
    if (shouldAssignCopilot({ event, action, payload })) {
      const result = await assignCopilotToIssue(payload);
      logger.info("GitHub Copilot issue assignment completed", {
        event,
        action,
        deliveryId,
        repository: payload.repository?.full_name,
        issueNumber: payload.issue?.number,
        copilotLogin: result.copilotLogin,
      });
      return res.status(200).json({ ok: true, assigned: true, copilot: result.copilotLogin });
    }

    return res.status(200).json({ ok: true, ignored: true });
  } catch (err) {
    logger.error("GitHub webhook orchestration failed", {
      event,
      deliveryId,
      message: err.message,
    });
    return res.status(500).json({ error: "webhook handling failed" });
  }
});

module.exports = router;
