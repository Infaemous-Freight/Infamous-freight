// Revenue Monitoring & Automation Service
// React to revenue drops in minutes, not days
// Automatic alerts for anomalies and trends

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RevenueMonitor {
    constructor(options = {}) {
        this.thresholds = {
            dailyMin: options.dailyMin || 1000,      // $1K/day minimum
            weeklyGrowth: options.weeklyGrowth || 0.05,  // 5% week-over-week growth
            monthlyGrowth: options.monthlyGrowth || 0.10, // 10% month-over-month growth
            churnMax: options.churnMax || 0.05,      // 5% monthly churn max
            dropPercent: options.dropPercent || 20,  // Alert on 20%+ drops
        };

        this.alertChannel = options.alertChannel || console.log;
    }

    /**
     * Check daily revenue and alert if below threshold
     */
    async checkDailyRevenue() {
        const today = await this.getRevenueForDate(new Date());
        const yesterday = await this.getRevenueForDate(
            new Date(Date.now() - 86400000)
        );
        const lastWeekToday = await this.getRevenueForDate(
            new Date(Date.now() - 7 * 86400000)
        );

        console.log(`📊 Daily Revenue Check: $${today}`);

        // Alert if below minimum threshold
        if (today < this.thresholds.dailyMin) {
            await this.sendAlert({
                severity: 'critical',
                title: '🚨 Daily Revenue Below Threshold',
                message: `Revenue today: $${today} (expected >$${this.thresholds.dailyMin})`,
                metrics: {
                    today,
                    yesterday,
                    lastWeekToday,
                    threshold: this.thresholds.dailyMin,
                },
            });
        }

        // Alert on significant drop from yesterday
        if (yesterday > 0) {
            const dropPercent = ((yesterday - today) / yesterday) * 100;
            if (dropPercent > this.thresholds.dropPercent) {
                await this.sendAlert({
                    severity: 'warning',
                    title: '⚠️ Significant Revenue Drop',
                    message: `Revenue dropped ${dropPercent.toFixed(1)}% from yesterday`,
                    metrics: {
                        today,
                        yesterday,
                        dropPercent,
                        dropAmount: yesterday - today,
                    },
                });
            }
        }

        // Compare to last week
        if (lastWeekToday > 0) {
            const weekOverWeekGrowth = ((today - lastWeekToday) / lastWeekToday) * 100;
            if (weekOverWeekGrowth < 0) {
                await this.sendAlert({
                    severity: 'info',
                    title: '📉 Week-over-Week Decline',
                    message: `Revenue ${weekOverWeekGrowth.toFixed(1)}% vs last week`,
                    metrics: {
                        today,
                        lastWeekToday,
                        growth: weekOverWeekGrowth,
                    },
                });
            }
        }

        return { today, yesterday, lastWeekToday };
    }

    /**
     * Check weekly revenue growth
     */
    async checkWeeklyGrowth() {
        const thisWeek = await this.getWeeklyRevenue(0);
        const lastWeek = await this.getWeeklyRevenue(1);
        const fourWeeksAgo = await this.getWeeklyRevenue(4);

        if (lastWeek === 0) return;

        const growth = (thisWeek - lastWeek) / lastWeek;
        const fourWeekGrowth = fourWeeksAgo > 0 ? (thisWeek - fourWeeksAgo) / fourWeeksAgo : 0;

        console.log(`📊 Weekly Revenue: $${thisWeek} (${(growth * 100).toFixed(1)}% growth)`);

        // Alert if below growth target
        if (growth < this.thresholds.weeklyGrowth) {
            await this.sendAlert({
                severity: 'warning',
                title: '📉 Weekly Growth Below Target',
                message: `Growth at ${(growth * 100).toFixed(1)}% (target: ${(this.thresholds.weeklyGrowth * 100)}%)`,
                metrics: {
                    thisWeek,
                    lastWeek,
                    growth: growth * 100,
                    target: this.thresholds.weeklyGrowth * 100,
                    fourWeekGrowth: fourWeekGrowth * 100,
                },
            });
        } else {
            // Positive growth - send encouragement
            await this.sendAlert({
                severity: 'success',
                title: '📈 Strong Weekly Growth',
                message: `Revenue up ${(growth * 100).toFixed(1)}% this week!`,
                metrics: { thisWeek, lastWeek, growth: growth * 100 },
            });
        }

        return { thisWeek, lastWeek, growth };
    }

    /**
     * Check monthly churn rate
     */
    async checkChurnRate() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Cancelled subscriptions this month
        const cancelledThisMonth = await prisma.subscription.count({
            where: {
                status: 'cancelled',
                cancelledAt: { gte: startOfMonth },
            },
        });

        // Active subscriptions at start of month
        const activeAtMonthStart = await prisma.subscription.count({
            where: {
                createdAt: { lt: startOfMonth },
                OR: [
                    { status: 'active' },
                    { status: 'cancelled', cancelledAt: { gte: startOfMonth } },
                ],
            },
        });

        const churnRate = activeAtMonthStart > 0
            ? cancelledThisMonth / activeAtMonthStart
            : 0;

        console.log(`📊 Churn Rate: ${(churnRate * 100).toFixed(2)}%`);

        // Alert if churn exceeds threshold
        if (churnRate > this.thresholds.churnMax) {
            await this.sendAlert({
                severity: 'critical',
                title: '🚨 High Churn Rate Alert',
                message: `Churn at ${(churnRate * 100).toFixed(2)}% (max: ${(this.thresholds.churnMax * 100)}%)`,
                metrics: {
                    cancelled: cancelledThisMonth,
                    active: activeAtMonthStart,
                    churnRate: churnRate * 100,
                    threshold: this.thresholds.churnMax * 100,
                },
                actions: [
                    'Review cancellation reasons',
                    'Increase customer success outreach',
                    'Check product issues',
                    'Review recent pricing changes',
                ],
            });
        }

        return { churnRate, cancelledThisMonth, activeAtMonthStart };
    }

    /**
     * Check MRR (Monthly Recurring Revenue) trend
     */
    async checkMRRTrend() {
        const currentMRR = await this.getCurrentMRR();
        const lastMonthMRR = await this.getMRRForMonth(1);
        const twoMonthsAgoMRR = await this.getMRRForMonth(2);

        const mrrGrowth = lastMonthMRR > 0
            ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100
            : 0;

        console.log(`📊 MRR: $${currentMRR} (${mrrGrowth > 0 ? '+' : ''}${mrrGrowth.toFixed(1)}%)`);

        // Alert on MRR decline
        if (mrrGrowth < 0) {
            await this.sendAlert({
                severity: 'warning',
                title: '⚠️ MRR Declining',
                message: `MRR decreased ${Math.abs(mrrGrowth).toFixed(1)}% this month`,
                metrics: {
                    currentMRR,
                    lastMonthMRR,
                    twoMonthsAgoMRR,
                    mrrGrowth,
                    decline: lastMonthMRR - currentMRR,
                },
            });
        } else if (mrrGrowth > 10) {
            await this.sendAlert({
                severity: 'success',
                title: '🎉 Strong MRR Growth',
                message: `MRR increased ${mrrGrowth.toFixed(1)}% this month!`,
                metrics: { currentMRR, lastMonthMRR, mrrGrowth },
            });
        }

        return { currentMRR, lastMonthMRR, mrrGrowth };
    }

    /**
     * Check for payment failures
     */
    async checkPaymentFailures() {
        const last24Hours = new Date(Date.now() - 24 * 3600000);

        const failures = await prisma.payment.findMany({
            where: {
                status: 'failed',
                createdAt: { gte: last24Hours },
            },
            include: {
                customer: {
                    select: { id: true, email: true, tier: true },
                },
            },
        });

        if (failures.length > 0) {
            const totalLost = failures.reduce((sum, p) => sum + p.amount, 0);

            await this.sendAlert({
                severity: 'warning',
                title: '⚠️ Payment Failures Detected',
                message: `${failures.length} failed payments in last 24h ($${totalLost} lost)`,
                metrics: {
                    count: failures.length,
                    totalLost,
                    avgAmount: totalLost / failures.length,
                },
                actions: [
                    'Contact customers to update payment methods',
                    'Review decline reasons',
                    'Consider retry strategy',
                ],
            });
        }

        return failures;
    }

    /**
     * Comprehensive daily health check
     */
    async runDailyHealthCheck() {
        console.log('\n🚀 Running Daily Revenue Health Check...\n');

        try {
            const [
                revenueCheck,
                weeklyGrowth,
                churnCheck,
                mrrTrend,
                paymentFailures,
            ] = await Promise.all([
                this.checkDailyRevenue(),
                this.checkWeeklyGrowth(),
                this.checkChurnRate(),
                this.checkMRRTrend(),
                this.checkPaymentFailures(),
            ]);

            // Generate summary report
            const summary = {
                timestamp: new Date().toISOString(),
                revenue: revenueCheck,
                growth: weeklyGrowth,
                churn: churnCheck,
                mrr: mrrTrend,
                failures: paymentFailures.length,
                status: this.determineOverallHealth({
                    revenue: revenueCheck.today,
                    growth: weeklyGrowth.growth,
                    churn: churnCheck.churnRate,
                    mrr: mrrTrend.mrrGrowth,
                }),
            };

            console.log('\n✅ Daily Health Check Complete\n');
            return summary;
        } catch (error) {
            console.error('❌ Error in daily health check:', error);
            throw error;
        }
    }

    /**
     * Helper: Determine overall health status
     */
    determineOverallHealth(metrics) {
        let score = 100;

        // Deduct points for issues
        if (metrics.revenue < this.thresholds.dailyMin) score -= 30;
        if (metrics.growth < 0) score -= 20;
        if (metrics.churn > this.thresholds.churnMax) score -= 25;
        if (metrics.mrr < 0) score -= 25;

        if (score >= 80) return 'healthy';
        if (score >= 60) return 'warning';
        return 'critical';
    }

    /**
     * Helper: Get revenue for specific date
     */
    async getRevenueForDate(date) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const result = await prisma.payment.aggregate({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
                status: 'succeeded',
            },
            _sum: { amount: true },
        });

        return result._sum.amount || 0;
    }

    /**
     * Helper: Get weekly revenue
     */
    async getWeeklyRevenue(weeksAgo = 0) {
        const endDate = new Date(Date.now() - (weeksAgo * 7 * 86400000));
        const startDate = new Date(endDate.getTime() - (7 * 86400000));

        const result = await prisma.payment.aggregate({
            where: {
                createdAt: { gte: startDate, lt: endDate },
                status: 'succeeded',
            },
            _sum: { amount: true },
        });

        return result._sum.amount || 0;
    }

    /**
     * Helper: Get current MRR
     */
    async getCurrentMRR() {
        const result = await prisma.subscription.aggregate({
            where: { status: 'active' },
            _sum: { monthlyValue: true },
        });

        return result._sum.monthlyValue || 0;
    }

    /**
     * Helper: Get MRR for specific month
     */
    async getMRRForMonth(monthsAgo = 0) {
        const now = new Date();
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);

        const result = await prisma.subscription.aggregate({
            where: {
                status: 'active',
                createdAt: { lt: nextMonth },
                OR: [
                    { cancelledAt: null },
                    { cancelledAt: { gte: targetMonth } },
                ],
            },
            _sum: { monthlyValue: true },
        });

        return result._sum.monthlyValue || 0;
    }

    /**
     * Send alert (override this in production)
     */
    async sendAlert(alert) {
        const emoji = {
            critical: '🚨',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅',
        };

        const message = `
${emoji[alert.severity]} ${alert.title}

${alert.message}

Metrics:
${JSON.stringify(alert.metrics, null, 2)}

${alert.actions ? '\nRecommended Actions:\n' + alert.actions.map(a => `• ${a}`).join('\n') : ''}
    `.trim();

        // In production, replace with Slack/Discord/Email
        this.alertChannel(message);

        // Store alert in database
        if (prisma.revenueAlert) {
            await prisma.revenueAlert.create({
                data: {
                    severity: alert.severity,
                    title: alert.title,
                    message: alert.message,
                    metrics: alert.metrics,
                    actions: alert.actions || [],
                },
            });
        }
    }
}

// Schedule automated checks with node-cron
function scheduleRevenueMonitoring(options = {}) {
    const cron = require('node-cron');
    const monitor = new RevenueMonitor(options);

    // Daily health check at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running scheduled daily health check...');
        await monitor.runDailyHealthCheck();
    });

    // Weekly growth check on Mondays at 10 AM
    cron.schedule('0 10 * * 1', async () => {
        console.log('⏰ Running weekly growth check...');
        await monitor.checkWeeklyGrowth();
    });

    // Monthly churn check on 1st of month at 11 AM
    cron.schedule('0 11 1 * *', async () => {
        console.log('⏰ Running monthly churn check...');
        await monitor.checkChurnRate();
    });

    // Payment failure check every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        console.log('⏰ Checking payment failures...');
        await monitor.checkPaymentFailures();
    });

    console.log('✅ Revenue monitoring scheduled');
    return monitor;
}

module.exports = {
    RevenueMonitor,
    scheduleRevenueMonitoring,
};

// Usage in server.js:
/*
const { scheduleRevenueMonitoring } = require('./services/revenueMonitor');

scheduleRevenueMonitoring({
  dailyMin: 1000,
  weeklyGrowth: 0.05,
  churnMax: 0.05,
  alertChannel: async (message) => {
    // Send to Slack
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  },
});
*/
