/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Marketplace Queue Metrics API Routes
 */

const express = require("express");
const { getMetricsService } = require("../services/metricsService");
const { authenticate, requireScope } = require("../middleware/security");

const router = express.Router();

/**
 * GET /api/marketplace/metrics
 * Get marketplace queue metrics in JSON format
 * Requires admin scope
 */
router.get("/", authenticate, requireScope("admin"), async (req, res) => {
  try {
    const metricsService = getMetricsService();
    const metrics = metricsService.getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve metrics",
      message: error.message,
    });
  }
});

/**
 * GET /api/marketplace/dashboard
 * Get dashboard-friendly metrics summary with success rates
 * Requires admin scope
 */
router.get(
  "/dashboard",
  authenticate,
  requireScope("admin"),
  async (req, res) => {
    try {
      const metricsService = getMetricsService();
      const summary = metricsService.getDashboardSummary();

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve dashboard metrics",
        message: error.message,
      });
    }
  },
);

/**
 * GET /api/marketplace/metrics/prometheus
 * Get metrics in Prometheus exposition format
 * Public endpoint for Prometheus scraping
 */
router.get("/prometheus", async (req, res) => {
  try {
    const metricsService = getMetricsService();
    const prometheusMetrics = metricsService.getPrometheusMetrics();

    res.set("Content-Type", "text/plain; version=0.0.4");
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    res.status(500).send(`# Error: ${error.message}`);
  }
});

/**
 * GET /api/marketplace/health
 * Health check for marketplace metrics service
 */
router.get("/health", async (req, res) => {
  const metricsService = getMetricsService();
  res.status(200).json({
    status: "ok",
    enabled: metricsService.enabled,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
