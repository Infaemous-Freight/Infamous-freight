/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Analytics Service - Business metrics and reporting
 */

const { prisma } = require('../database');
const logger = require('../lib/structuredLogging');

class AnalyticsService {
    /**
     * Get daily job metrics
     */
    async getDailyJobMetrics(startDate, endDate) {
        try {
            const metrics = await prisma.job.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
                _count: true,
                _avg: {
                    distance: true,
                    price: true,
                },
            });

            return metrics.map((m) => ({
                date: m.createdAt,
                jobCount: m._count,
                avgDistance: m._avg.distance || 0,
                avgPrice: m._avg.price || 0,
            }));
        } catch (error) {
            logger.error('Failed to get daily job metrics', { error: error.message });
            return [];
        }
    }

    /**
     * Get daily revenue
     */
    async getDailyRevenue(startDate, endDate) {
        try {
            const revenue = await prisma.jobPayment.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                    status: 'COMPLETED',
                },
                _sum: {
                    amount: true,
                },
                _count: true,
            });

            return revenue.map((r) => ({
                date: r.createdAt,
                revenue: (r._sum.amount || 0) / 100, // Convert cents to dollars
                transactions: r._count,
            }));
        } catch (error) {
            logger.error('Failed to get daily revenue', { error: error.message });
            return [];
        }
    }

    /**
     * Get driver performance metrics
     */
    async getDriverMetrics(limit = 100) {
        try {
            const drivers = await prisma.driverProfile.findMany({
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    rating: true,
                    acceptanceRate: true,
                    completionRate: true,
                    createdAt: true,
                },
                orderBy: {
                    rating: 'desc',
                },
                take: limit,
            });

            return drivers.map((d) => ({
                driverId: d.userId,
                status: d.status,
                rating: d.rating || 0,
                acceptanceRate: d.acceptanceRate || 0,
                completionRate: d.completionRate || 0,
                joinedAt: d.createdAt,
            }));
        } catch (error) {
            logger.error('Failed to get driver metrics', { error: error.message });
            return [];
        }
    }

    /**
     * Get average delivery time
     */
    async getAverageDeliveryTime(startDate, endDate) {
        try {
            const jobs = await prisma.job.findMany({
                where: {
                    status: 'COMPLETED',
                    updatedAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    distance: true,
                    timeMinutes: true,
                },
            });

            if (jobs.length === 0) {
                return { avgDeliveryTime: 0, avgDistance: 0, count: 0 };
            }

            let totalTime = 0;
            let totalDistance = 0;

            jobs.forEach((job) => {
                const deliveryTime = (job.updatedAt - job.createdAt) / (1000 * 60); // In minutes
                totalTime += deliveryTime;
                totalDistance += job.distance || 0;
            });

            return {
                avgDeliveryTime: Math.round(totalTime / jobs.length),
                avgDistance: (totalDistance / jobs.length).toFixed(2),
                count: jobs.length,
            };
        } catch (error) {
            logger.error('Failed to get average delivery time', { error: error.message });
            return { avgDeliveryTime: 0, avgDistance: 0, count: 0 };
        }
    }

    /**
     * Get job acceptance rate
     */
    async getJobAcceptanceRate(startDate, endDate) {
        try {
            const total = await prisma.job.count({
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
            });

            const accepted = await prisma.job.count({
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                    status: {
                        in: ['ACCEPTED', 'PICKED_UP', 'DELIVERED', 'COMPLETED'],
                    },
                },
            });

            const rate = total > 0 ? ((accepted / total) * 100).toFixed(2) : 0;

            return {
                total,
                accepted,
                acceptanceRate: parseFloat(rate),
            };
        } catch (error) {
            logger.error('Failed to get acceptance rate', { error: error.message });
            return { total: 0, accepted: 0, acceptanceRate: 0 };
        }
    }

    /**
     * Get subscription metrics
     */
    async getSubscriptionMetrics() {
        try {
            const plans = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
            const metrics = {};

            for (const plan of plans) {
                const count = await prisma.subscription.count({
                    where: {
                        plan,
                        status: 'ACTIVE',
                    },
                });
                metrics[plan] = count;
            }

            const total = Object.values(metrics).reduce((a, b) => a + b, 0);

            return {
                total,
                byPlan: metrics,
                mrr: total * 29, // Approximate MRR (would need actual pricing)
            };
        } catch (error) {
            logger.error('Failed to get subscription metrics', { error: error.message });
            return { total: 0, byPlan: {}, mrr: 0 };
        }
    }

    /**
     * Get top performing drivers
     */
    async getTopDrivers(limit = 10) {
        try {
            const drivers = await prisma.driverProfile.findMany({
                select: {
                    userId: true,
                    rating: true,
                    acceptanceRate: true,
                    completionRate: true,
                    totalEarnings: true,
                },
                orderBy: {
                    rating: 'desc',
                },
                take: limit,
            });

            return drivers.map((d, index) => ({
                rank: index + 1,
                driverId: d.userId,
                rating: d.rating || 0,
                acceptanceRate: d.acceptanceRate || 0,
                completionRate: d.completionRate || 0,
                earnings: (d.totalEarnings || 0) / 100,
            }));
        } catch (error) {
            logger.error('Failed to get top drivers', { error: error.message });
            return [];
        }
    }

    /**
     * Get job status distribution
     */
    async getJobStatusDistribution(startDate, endDate) {
        try {
            const distribution = await prisma.job.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
                _count: true,
            });

            const total = distribution.reduce((sum, d) => sum + d._count, 0);

            return {
                total,
                byStatus: distribution.reduce((acc, d) => {
                    acc[d.status] = {
                        count: d._count,
                        percentage: total > 0 ? ((d._count / total) * 100).toFixed(2) : 0,
                    };
                    return acc;
                }, {}),
            };
        } catch (error) {
            logger.error('Failed to get job status distribution', { error: error.message });
            return { total: 0, byStatus: {} };
        }
    }

    /**
     * Get hourly job volume
     */
    async getHourlyJobVolume(date) {
        try {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const jobs = await prisma.job.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                select: {
                    createdAt: true,
                },
            });

            const hourly = new Array(24).fill(0);

            jobs.forEach((job) => {
                const hour = job.createdAt.getHours();
                hourly[hour]++;
            });

            return hourly;
        } catch (error) {
            logger.error('Failed to get hourly job volume', { error: error.message });
            return new Array(24).fill(0);
        }
    }

    /**
     * Get revenue by plan type
     */
    async getRevenueByPlan(startDate, endDate) {
        try {
            const revenue = await prisma.jobPayment.groupBy({
                by: ['userSubscriptionPlan'],
                where: {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                    status: 'COMPLETED',
                },
                _sum: {
                    amount: true,
                },
                _count: true,
            });

            return revenue.map((r) => ({
                plan: r.userSubscriptionPlan || 'BASIC',
                revenue: (r._sum.amount || 0) / 100,
                transactions: r._count,
            }));
        } catch (error) {
            logger.error('Failed to get revenue by plan', { error: error.message });
            return [];
        }
    }

    /**
     * Get comprehensive dashboard data
     */
    async getDashboardData(startDate, endDate) {
        try {
            const [
                dailyJobs,
                dailyRevenue,
                acceptanceRate,
                deliveryTime,
                statusDist,
                topDrivers,
                subscriptions,
            ] = await Promise.all([
                this.getDailyJobMetrics(startDate, endDate),
                this.getDailyRevenue(startDate, endDate),
                this.getJobAcceptanceRate(startDate, endDate),
                this.getAverageDeliveryTime(startDate, endDate),
                this.getJobStatusDistribution(startDate, endDate),
                this.getTopDrivers(10),
                this.getSubscriptionMetrics(),
            ]);

            return {
                period: { startDate, endDate },
                summary: {
                    totalRevenue: dailyRevenue.reduce((sum, d) => sum + d.revenue, 0),
                    totalJobs: dailyJobs.reduce((sum, d) => sum + d.jobCount, 0),
                    acceptanceRate: acceptanceRate.acceptanceRate,
                    avgDeliveryTime: deliveryTime.avgDeliveryTime,
                },
                dailyJobs,
                dailyRevenue,
                jobStatusDistribution: statusDist,
                topDrivers,
                subscriptions,
            };
        } catch (error) {
            logger.error('Failed to get dashboard data', { error: error.message });
            return {
                period: { startDate, endDate },
                summary: {},
                dailyJobs: [],
                dailyRevenue: [],
            };
        }
    }
}

// Singleton
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new AnalyticsService();
    }
    return instance;
}

module.exports = {
    getInstance,
    AnalyticsService,
};
