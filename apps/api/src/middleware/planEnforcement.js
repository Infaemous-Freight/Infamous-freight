const { prisma, getPrisma } = require("../db/prisma");

const PLAN_ORDER = ["STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"];

function comparePlans(orgPlan, requiredPlan) {
  const a = PLAN_ORDER.indexOf(String(orgPlan || "STARTER").toUpperCase());
  const b = PLAN_ORDER.indexOf(String(requiredPlan || "STARTER").toUpperCase());
  return a >= b;
}

function requireActiveOrgPlan(requiredPlan = "STARTER") {
  return async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      if (!client) {
        return res.status(503).json({ ok: false, error: "Database not initialized" });
      }

      const orgId = req.auth?.organizationId;
      if (!orgId) {
        return res.status(401).json({ ok: false, error: "No organization (org_id missing)" });
      }

      const billing = await client.orgBilling.findUnique({ where: { organizationId: orgId } });

      const stripeStatus = String(billing?.stripeStatus || "incomplete").toLowerCase();
      const plan = String(billing?.plan || "STARTER").toUpperCase();

      const isActive = stripeStatus === "active" || stripeStatus === "trialing";
      const meetsPlan = comparePlans(plan, requiredPlan);

      if (requiredPlan === "STARTER" && !billing) {
        req.billing = { plan: "STARTER", stripeStatus: "none" };
        return next();
      }

      if (!isActive) {
        return res.status(402).json({
          ok: false,
          error: "Subscription required",
          code: "BILLING_INACTIVE",
          requiredPlan,
          stripeStatus,
        });
      }

      if (!meetsPlan) {
        return res.status(403).json({
          ok: false,
          error: "Plan upgrade required",
          code: "PLAN_TOO_LOW",
          requiredPlan,
          currentPlan: plan,
        });
      }

      req.billing = { plan, stripeStatus };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireActiveOrgPlan };
