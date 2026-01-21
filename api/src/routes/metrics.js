const express = require('express');
const router = express.Router();
const prometheusMetrics = require('../lib/prometheusMetrics');
const { PrismaClient } = require('@prisma/client');
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');

const prisma = new PrismaClient();

// In-memory cache for metrics (use Redis in production)
let metricsCache = {
    data: null,
    timestamp: null,
    ttl: 60000, // 1 minute cache
};

// Prometheus metrics endpoint with histograms and latencies
// GET /api/metrics
router.get('/metrics', (_req, res) => {
    const output = prometheusMetrics.exportMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(output);
    // Revenue metrics endpoints
    // GET /api/metrics/revenue/live
    router.get('/metrics/revenue/live', limiters.general, authenticate, requireScope('metrics:read'), auditLog, async (_req, res, next) => {
        try {
            if (metricsCache.data && Date.now() - metricsCache.timestamp < metricsCache.ttl) {
                return res.json({
                    ...metricsCache.data,
                    cached: true,
                    lastUpdated: new Date(metricsCache.timestamp).toISOString(),
                });
            }

            const metrics = await calculateLiveMetrics();
            const mrrHistory = await getMRRHistory(12);
            const tierDistribution = await getTierDistribution();
            const alerts = await getRecentAlerts();

            const response = {
                current: metrics,
                mrrHistory,
                tierDistribution,
                alerts,
                cached: false,
                lastUpdated: new Date().toISOString(),
            };

            metricsCache = {
                data: response,
                timestamp: Date.now(),
                ttl: 60000,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    });

    // POST /api/metrics/revenue/clear-cache
    router.post('/metrics/revenue/clear-cache', limiters.general, authenticate, requireScope('admin'), auditLog, async (_req, res) => {
        metricsCache = { data: null, timestamp: null, ttl: 60000 };
        res.json({ success: true, message: 'Cache cleared' });
    });

    // GET /api/metrics/revenue/export
    router.get('/metrics/revenue/export', limiters.general, authenticate, requireScope('metrics:export'), auditLog, async (_req, res, next) => {
        try {
            const metrics = await calculateLiveMetrics();
            const mrrHistory = await getMRRHistory(12);

            const csv = [
                'Metric,Value',
                `MRR,${metrics.mrr}`,
                `ARR,${metrics.arr}`,
                `Churn Rate,${metrics.churn}`,
                `LTV,${metrics.ltv}`,
                `Customer Count,${metrics.customerCount}`,
                '',
                'Month,MRR,New MRR,Churned MRR',
                ...mrrHistory.map(h => `${h.month},${h.mrr},${h.newMRR},${h.churnedMRR}`),
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=revenue-metrics.csv');
            res.send(csv);
        } catch (error) {
            next(error);
        }
    });

    async function calculateLiveMetrics() {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            activeSubscriptions,
            customerCount,
            newCustomersToday,
            newCustomersThisWeek,
            newCustomersThisMonth,
            revenueToday,
            revenueThisWeek,
            revenueThisMonth,
            cancelledThisMonth,
            activeAtMonthStart,
        ] = await Promise.all([
            prisma.subscription.findMany({ where: { status: 'active' }, select: { monthlyValue: true, tier: true } }),
            prisma.customer.count({ where: { status: 'active' } }),
            prisma.customer.count({ where: { createdAt: { gte: startOfDay } } }),
            prisma.customer.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.payment.aggregate({ where: { createdAt: { gte: startOfDay }, status: 'succeeded' }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { createdAt: { gte: startOfWeek }, status: 'succeeded' }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { createdAt: { gte: startOfMonth }, status: 'succeeded' }, _sum: { amount: true } }),
            prisma.subscription.count({ where: { status: 'cancelled', cancelledAt: { gte: startOfMonth } } }),
            prisma.subscription.count({ where: { createdAt: { lt: startOfMonth }, OR: [{ status: 'active' }, { status: 'cancelled', cancelledAt: { gte: startOfMonth } }] } }),
        ]);

        const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.monthlyValue || 0), 0);
        const arr = mrr * 12;
        const churn = activeAtMonthStart > 0 ? cancelledThisMonth / activeAtMonthStart : 0;
        const avgRevenuePerCustomer = customerCount > 0 ? mrr / customerCount : 0;
        const avgLifetimeMonths = churn > 0 ? 1 / churn : 24;
        const ltv = avgRevenuePerCustomer * avgLifetimeMonths;
        const cac = 150;
        const nrr = 1.05;

        return {
            mrr,
            arr,
            churn,
            ltv,
            customerCount,
            newCustomersToday,
            newCustomersThisWeek,
            newCustomersThisMonth,
            revenueToday: revenueToday._sum.amount || 0,
            revenueThisWeek: revenueThisWeek._sum.amount || 0,
            revenueThisMonth: revenueThisMonth._sum.amount || 0,
            avgRevenuePerCustomer,
            cac,
            nrr,
        };
    }

    async function getMRRHistory(months = 12) {
        const history = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const monthName = date.toLocaleString('default', { month: 'short' });

            const subscriptions = await prisma.subscription.findMany({ where: { status: 'active', createdAt: { lte: monthEnd } }, select: { monthlyValue: true, createdAt: true } });
            const mrr = subscriptions.reduce((sum, sub) => sum + (sub.monthlyValue || 0), 0);
            const newSubs = subscriptions.filter(sub => sub.createdAt >= monthStart && sub.createdAt <= monthEnd);
            const newMRR = newSubs.reduce((sum, sub) => sum + (sub.monthlyValue || 0), 0);
            const churned = await prisma.subscription.aggregate({ where: { status: 'cancelled', cancelledAt: { gte: monthStart, lte: monthEnd } }, _sum: { monthlyValue: true } });
            const churnedMRR = churned._sum.monthlyValue || 0;

            history.push({ month: monthName, mrr, newMRR, churnedMRR });
        }
        return history;
    }

    async function getTierDistribution() {
        const tiers = await prisma.subscription.groupBy({ by: ['tier'], where: { status: 'active' }, _count: true, _sum: { monthlyValue: true } });
        return tiers.map(tier => ({ tier: tier.tier || 'Unknown', count: tier._count, revenue: tier._sum.monthlyValue || 0 }));
    }

    async function getRecentAlerts() {
        if (prisma.revenueAlert) {
            const alerts = await prisma.revenueAlert.findMany({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: 'desc' }, take: 5 });
            return alerts.map(alert => ({ id: alert.id, severity: alert.severity, title: alert.title, message: alert.message, timestamp: alert.createdAt.toISOString() }));
        }
        return [];
    }

    module.exports = router;
