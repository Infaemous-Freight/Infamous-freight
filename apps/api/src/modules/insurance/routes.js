const express = require("express");
const {
  limiters,
  authenticate,
  requireOrganization,
  requireScope,
  auditLog,
} = require("../../middleware/security");
const { param } = require("express-validator");
const { validateString, handleValidationErrors } = require("../../middleware/validation");
const {
  uploadCertificate,
  listCertificatesForOrg,
  verifyCertificate,
  rejectCertificate,
  getRequirements,
  setRequirements,
  evaluateCarrierCompliance,
  listCompliance,
  createQuote,
  evaluateOrgCompliance,
  getRiskScore,
} = require("./service");

const router = express.Router();

router.get(
  "/insurance/certificates",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:read"),
  auditLog,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const certificates = await listCertificatesForOrg({
        orgId: req.auth.organizationId,
        carrierId: req.query.carrierId,
      });
      res.json({ ok: true, certificates });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/certificates",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:write"),
  auditLog,
  [
    validateString("coverageType"),
    validateString("documentUrl"),
    validateString("carrierId").optional(),
    validateString("providerName").optional(),
    validateString("policyNumber").optional(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const certificate = await uploadCertificate({
        orgId: req.auth.organizationId,
        actorUserId: req.user?.sub,
        payload: req.body,
      });
      res.status(201).json({ ok: true, certificate });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/certificates/:id/verify",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:admin"),
  auditLog,
  param("id").isString().withMessage("Invalid certificate id"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const certificate = await verifyCertificate({
        orgId: req.auth.organizationId,
        id: req.params.id,
        actorUserId: req.user?.sub,
      });
      res.json({ ok: true, certificate });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/certificates/:id/reject",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:admin"),
  auditLog,
  [param("id").isString().withMessage("Invalid certificate id"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const certificate = await rejectCertificate({
        orgId: req.auth.organizationId,
        id: req.params.id,
        actorUserId: req.user?.sub,
        rejectionReason: req.body?.rejectionReason,
      });
      res.json({ ok: true, certificate });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/insurance/requirements",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:read"),
  auditLog,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const requirements = await getRequirements(req.auth.organizationId);
      res.json({ ok: true, requirements });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/insurance/requirements",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:admin"),
  auditLog,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const requirements = await setRequirements({
        orgId: req.auth.organizationId,
        actorUserId: req.user?.sub,
        requirements: req.body?.requirements || [],
      });
      res.json({ ok: true, requirements });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/insurance/compliance",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:read"),
  auditLog,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      if (req.query.carrierId) {
        const { result, evaluation } = await evaluateCarrierCompliance({
          orgId: req.auth.organizationId,
          carrierId: req.query.carrierId,
        });
        const risk = await getRiskScore({
          orgId: req.auth.organizationId,
          carrierId: req.query.carrierId,
        });
        return res.json({ ok: true, compliance: result, evaluation, risk });
      }

      const compliance = await listCompliance({
        orgId: req.auth.organizationId,
      });
      res.json({ ok: true, compliance });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/compliance/evaluate",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:admin"),
  auditLog,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const results = await evaluateOrgCompliance({
        orgId: req.auth.organizationId,
      });
      res.json({ ok: true, results });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/quotes/per-load",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:write"),
  auditLog,
  [
    validateString("loadId").optional(),
    validateString("carrierId").optional(),
    validateString("partner").optional(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const quote = await createQuote({
        orgId: req.auth.organizationId,
        userId: req.user?.sub,
        carrierId: req.body?.carrierId,
        loadId: req.body?.loadId,
        requestType: "PER_LOAD",
        partner: req.body?.partner,
        payloadJson: req.body?.payloadJson,
      });
      res.status(201).json({ ok: true, quote });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/insurance/quotes/business",
  limiters.general,
  authenticate,
  requireOrganization,
  requireScope("insurance:write"),
  auditLog,
  [
    validateString("carrierId").optional(),
    validateString("partner").optional(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const quote = await createQuote({
        orgId: req.auth.organizationId,
        userId: req.user?.sub,
        carrierId: req.body?.carrierId,
        requestType: "BUSINESS_POLICY",
        partner: req.body?.partner,
        payloadJson: req.body?.payloadJson,
      });
      res.status(201).json({ ok: true, quote });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
