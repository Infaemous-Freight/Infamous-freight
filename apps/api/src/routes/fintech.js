/**
 * Fintech Integration Routes
 * Early payment, invoice financing, fuel cards, insurance
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { body, param } = require("express-validator");
const logger = require("../middleware/logger");
const { ApiResponse, HTTP_STATUS } = require("@infamous/shared");
const fintechService = require("../services/fintechService");
const { ipKeyGenerator } = require("express-rate-limit");

// Fintech rate limiter
const fintechRateLimiter = require("express-rate-limit")({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req),
});

/**
 * POST /api/fintech/early-pay
 * Request early payment for invoice
 */
router.post(
  "/early-pay",
  fintechRateLimiter,
  authenticate,
  requireScope("driver:manage_payments"),
  [
    body("invoiceId").isUUID().withMessage("Invalid invoice ID"),
    body("optionType").isIn(["standard", "expedited", "scheduled"]).withMessage("Invalid option"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { invoiceId, optionType } = req.body;

      const result = await fintechService.requestEarlyPayment(driverId, invoiceId, optionType);

      logger.info("Early payment requested", {
        driverId,
        invoiceId,
        optionType,
        netAmount: result.netAmount,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/fintech/early-pay/options
 * Get early payment options
 */
router.get(
  "/early-pay/options",
  authenticate,
  requireScope("driver:manage_payments"),
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { invoiceAmount } = req.query;

      if (!invoiceAmount || isNaN(invoiceAmount)) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(new ApiResponse({ success: false, error: "Invalid invoice amount" }));
      }

      const options = await fintechService.getEarlyPaymentOptions(
        driverId,
        parseFloat(invoiceAmount),
      );

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: options,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/fintech/fuel-cards
 * Get available fuel card programs
 */
router.get(
  "/fuel-cards",
  authenticate,
  requireScope("driver:view_partnerships"),
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;

      const options = await fintechService.getFuelCardOptions(driverId);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: {
            options,
            availableCount: options.length,
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/fintech/fuel-cards/enroll
 * Enroll in fuel card program
 */
router.post(
  "/fuel-cards/enroll",
  fintechRateLimiter,
  authenticate,
  requireScope("driver:manage_partnerships"),
  [body("provider").trim().notEmpty().withMessage("Provider required"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { provider } = req.body;

      const result = await fintechService.enrollFuelCard(driverId, provider);

      logger.info("Fuel card enrollment requested", {
        driverId,
        provider,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/fintech/invoice-financing/options
 * Get invoice financing options
 */
router.get(
  "/invoice-financing/options",
  authenticate,
  requireScope("driver:manage_payments"),
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { totalAmount } = req.query;

      if (!totalAmount || isNaN(totalAmount)) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(new ApiResponse({ success: false, error: "Invalid total amount" }));
      }

      const options = await fintechService.getInvoiceFinancingOptions(
        driverId,
        parseFloat(totalAmount),
      );

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: options,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/fintech/invoice-financing
 * Request invoice financing
 */
router.post(
  "/invoice-financing",
  fintechRateLimiter,
  authenticate,
  requireScope("driver:manage_payments"),
  [
    body("invoiceIds").isArray().withMessage("Invalid invoice IDs"),
    body("term").isIn(["biweekly", "monthly", "extended"]).withMessage("Invalid term"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { invoiceIds, term } = req.body;

      // Mock invoices fetch
      const invoices = invoiceIds.map((id, i) => ({
        id,
        amount: 1500 + i * 100,
      }));

      const result = await fintechService.requestInvoiceFinancing(driverId, invoices, term);

      logger.info("Invoice financing requested", {
        driverId,
        refundCount: invoiceIds.length,
        term,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/fintech/insurance
 * Get insurance offerings
 */
router.get(
  "/insurance",
  authenticate,
  requireScope("driver:view_partnerships"),
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;

      const options = await fintechService.getInsuranceOptions(driverId);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: {
            plans: options,
            count: Object.keys(options).length,
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/fintech/insurance/enroll
 * Enroll in insurance plan
 */
router.post(
  "/insurance/enroll",
  fintechRateLimiter,
  authenticate,
  requireScope("driver:manage_partnerships"),
  [
    body("type")
      .isIn(["liability", "cargo", "physical", "comprehensive"])
      .withMessage("Invalid plan"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;
      const { type } = req.body;

      const result = await fintechService.enrollInsurance(driverId, type);

      logger.info("Insurance enrollment requested", {
        driverId,
        type,
      });

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/fintech/dashboard
 * Get fintech dashboard summary
 */
router.get(
  "/dashboard",
  authenticate,
  requireScope("driver:view_payments"),
  async (req, res, next) => {
    try {
      const driverId = req.user.sub;

      const dashboard = await fintechService.getFintechDashboard(driverId);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: dashboard,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/fintech/early-pay/approve (admin only)
 * Approve early payment request
 */
router.post(
  "/early-pay/approve",
  fintechRateLimiter,
  authenticate,
  requireScope("admin:manage_payments"),
  [body("requestId").isUUID().withMessage("Invalid request ID"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { requestId } = req.body;

      const result = await fintechService.approveEarlyPayment(requestId);

      logger.info("Early payment approved by admin", { requestId });

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
