// Cost Optimization Service
// Tracks AWS/GCP spending and identifies cost reduction opportunities

const logger = require('./logger');
const {
    CostExplorerClient,
    GetCostAndUsageCommand,
} = require('@aws-sdk/client-cost-explorer');
const {
    CloudWatchClient,
    GetMetricStatisticsCommand,
} = require('@aws-sdk/client-cloudwatch');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { RDSClient } = require('@aws-sdk/client-rds');

class CostOptimizationService {
    constructor(config = {}) {
        this.awsRegion = config.awsRegion || process.env.AWS_REGION || 'us-east-1';
        this.costThreshold = config.costThreshold || 5000; // Alert if daily cost exceeds $5000
        this.forecastingEnabled = config.forecastingEnabled !== false;
        this.anomalyThreshold = config.anomalyThreshold || 1.2; // 20% increase triggers alert

        const credentials =
            process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                ? {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN,
                }
                : undefined;

        const clientOptions = {
            region: this.awsRegion,
            ...(credentials ? { credentials } : {}),
        };

        this.costExplorer = new CostExplorerClient(clientOptions);
        this.cloudWatch = new CloudWatchClient(clientOptions);
        this.ec2 = new EC2Client(clientOptions);
        this.rds = new RDSClient(clientOptions);
    }

    /**
     * Get AWS cost and usage data
     */
    async getCostAndUsage(startDate, endDate) {
        try {
            const params = {
                TimePeriod: {
                    Start: startDate,
                    End: endDate,
                },
                Granularity: 'DAILY',
                Metrics: ['UnblendedCost', 'BlendedCost'],
                GroupBy: [
                    { Type: 'DIMENSION', Key: 'SERVICE' },
                    { Type: 'DIMENSION', Key: 'REGION' },
                ],
            };

            const response = await this.costExplorer.send(
                new GetCostAndUsageCommand(params)
            );

            const costs = {
                total: 0,
                byService: {},
                byRegion: {},
                daily: [],
            };

            for (const result of response.ResultsByTime) {
                const date = result.TimePeriod.Start;
                let dailyTotal = 0;

                for (const group of result.Groups) {
                    const service = group.Keys[0];
                    const region = group.Keys[1];
                    const cost = parseFloat(group.Metrics.UnblendedCost.Amount);

                    // Service breakdown
                    if (!costs.byService[service]) {
                        costs.byService[service] = 0;
                    }
                    costs.byService[service] += cost;

                    // Region breakdown
                    if (!costs.byRegion[region]) {
                        costs.byRegion[region] = 0;
                    }
                    costs.byRegion[region] += cost;

                    dailyTotal += cost;
                    costs.total += cost;
                }

                costs.daily.push({
                    date,
                    amount: dailyTotal,
                });
            }

            logger.info('Cost and usage retrieved', {
                period: `${startDate} to ${endDate}`,
                totalCost: costs.total.toFixed(2),
                services: Object.keys(costs.byService).length,
            });

            return costs;
        } catch (error) {
            logger.error('Failed to get cost and usage', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Forecast future costs using trend analysis
     */
    async forecastCosts(historicalDays = 30) {
        try {
            const today = new Date();
            const startDate = new Date(today.getTime() - historicalDays * 24 * 60 * 60 * 1000);

            const costs = await this.getCostAndUsage(
                startDate.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );

            // Calculate trend
            const dailyCosts = costs.daily.map((d) => d.amount);
            const avgDailyCost = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
            const trend =
                (dailyCosts[dailyCosts.length - 1] - dailyCosts[0]) / dailyCosts.length;

            // Project next 30 days
            const forecast = {
                projectedDaily: avgDailyCost + trend,
                projectedMonthly: (avgDailyCost + trend) * 30,
                trend: trend > 0 ? 'increasing' : 'decreasing',
                confidence: 0.85,
            };

            logger.info('Cost forecast calculated', {
                avgDaily: avgDailyCost.toFixed(2),
                projectedDaily: forecast.projectedDaily.toFixed(2),
                projectedMonthly: forecast.projectedMonthly.toFixed(2),
            });

            return forecast;
        } catch (error) {
            logger.error('Failed to forecast costs', {
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Detect cost anomalies
     */
    async detectAnomalies(baselineDays = 30) {
        try {
            const today = new Date();
            const startDate = new Date(today.getTime() - baselineDays * 24 * 60 * 60 * 1000);

            const costs = await this.getCostAndUsage(
                startDate.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );

            const dailyCosts = costs.daily.map((d) => d.amount);

            // Calculate mean and std dev
            const mean = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
            const variance =
                dailyCosts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyCosts.length;
            const stdDev = Math.sqrt(variance);

            // Find anomalies (> 2 std dev from mean)
            const anomalies = dailyCosts
                .map((cost, index) => ({
                    date: costs.daily[index].date,
                    amount: cost,
                    deviation: (cost - mean) / stdDev,
                    isAnomaly: Math.abs((cost - mean) / stdDev) > 2,
                }))
                .filter((a) => a.isAnomaly);

            logger.info('Anomalies detected', {
                baseline: mean.toFixed(2),
                stdDev: stdDev.toFixed(2),
                anomalies: anomalies.length,
            });

            return {
                mean: mean.toFixed(2),
                stdDev: stdDev.toFixed(2),
                anomalies,
            };
        } catch (error) {
            logger.error('Failed to detect anomalies', {
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Identify underutilized resources
     */
    async identifyUnderutilizedResources() {
        try {
            const recommendations = [];

            // Check EC2 instances
            const ec2Instances = await this.ec2.send(new DescribeInstancesCommand({}));

            for (const reservation of ec2Instances.Reservations) {
                for (const instance of reservation.Instances) {
                    const stats = await this.getInstanceUtilization(instance.InstanceId);

                    if (stats.cpuUtilization < 5 && stats.networkIn < 1000) {
                        recommendations.push({
                            type: 'EC2',
                            id: instance.InstanceId,
                            currentType: instance.InstanceType,
                            monthlyEstimate: this.estimateEC2Cost(instance.InstanceType),
                            action: 'Consider terminating or right-sizing',
                            cpuUtilization: stats.cpuUtilization,
                            networkUsage: stats.networkIn,
                        });
                    }
                }
            }

            logger.info('Underutilized resources identified', {
                count: recommendations.length,
            });

            return recommendations;
        } catch (error) {
            logger.error('Failed to identify underutilized resources', {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * Get instance utilization metrics
     */
    async getInstanceUtilization(instanceId) {
        try {
            const params = {
                MetricName: 'CPUUtilization',
                Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
                StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
                EndTime: new Date(),
                Period: 3600,
                Statistics: ['Average'],
            };

            const cpuResponse = await this.cloudWatch.send(
                new GetMetricStatisticsCommand(params)
            );

            // Network metrics
            params.MetricName = 'NetworkIn';
            const networkResponse = await this.cloudWatch.send(
                new GetMetricStatisticsCommand(params)
            );

            const cpuValues = cpuResponse.Datapoints.map((d) => d.Average);
            const networkValues = networkResponse.Datapoints.map((d) => d.Average);

            return {
                cpuUtilization:
                    cpuValues.length > 0
                        ? cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length
                        : 0,
                networkIn:
                    networkValues.length > 0
                        ? networkValues.reduce((a, b) => a + b, 0) / networkValues.length
                        : 0,
            };
        } catch (error) {
            logger.error('Failed to get instance utilization', {
                instanceId,
                error: error.message,
            });
            return { cpuUtilization: 0, networkIn: 0 };
        }
    }

    /**
     * Estimate EC2 monthly cost
     */
    estimateEC2Cost(instanceType) {
        const pricing = {
            't2.micro': 8.5,
            't2.small': 17,
            't2.medium': 34,
            't3.micro': 7.5,
            't3.small': 15,
            't3.medium': 30,
            'm5.large': 85,
            'm5.xlarge': 170,
            'c5.large': 70,
            'c5.xlarge': 140,
        };

        return pricing[instanceType] || 0;
    }

    /**
     * Generate cost optimization recommendations
     */
    async generateRecommendations() {
        const recommendations = [];

        // RI opportunities
        recommendations.push({
            priority: 'high',
            title: 'Reserved Instances',
            description: 'Purchase 1-year or 3-year reserved instances',
            potentialSavings: '25-40%',
            implementation: 'Review usage patterns and purchase RIs for steady-state capacity',
        });

        // Spot instances
        recommendations.push({
            priority: 'high',
            title: 'Spot Instances',
            description: 'Use spot instances for non-critical workloads',
            potentialSavings: '70-90%',
            implementation: 'Configure auto-scaling groups with spot instances',
        });

        // Unused resources
        const underutilized = await this.identifyUnderutilizedResources();
        if (underutilized.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Terminate Underutilized Resources',
                description: `Remove ${underutilized.length} underutilized instances`,
                potentialSavings: `$${underutilized
                    .reduce((sum, r) => sum + (r.monthlyEstimate || 0), 0)
                    .toFixed(2)}/month`,
                implementation: 'Review and terminate instances with <5% CPU utilization',
            });
        }

        // Data transfer costs
        recommendations.push({
            priority: 'medium',
            title: 'CDN Optimization',
            description: 'Use CloudFront to reduce data transfer costs',
            potentialSavings: '20-30%',
            implementation: 'Enable CloudFront for all static assets and cache optimizations',
        });

        logger.info('Cost recommendations generated', {
            count: recommendations.length,
        });

        return recommendations;
    }

    /**
     * Generate cost report
     */
    async generateReport() {
        const today = new Date();
        const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const costs = await this.getCostAndUsage(
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
        );

        const forecast = await this.forecastCosts(30);
        const recommendations = await this.generateRecommendations();

        const report = {
            period: {
                start: startDate.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0],
            },
            summary: {
                totalCost: costs.total.toFixed(2),
                averageDailyCost: (costs.total / 30).toFixed(2),
                topService: Object.keys(costs.byService).reduce((a, b) =>
                    costs.byService[a] > costs.byService[b] ? a : b
                ),
                topServiceCost: Math.max(...Object.values(costs.byService)).toFixed(2),
            },
            forecast,
            costsByService: Object.entries(costs.byService).map(([service, cost]) => ({
                service,
                cost: cost.toFixed(2),
                percentage: ((cost / costs.total) * 100).toFixed(2),
            })),
            recommendations,
        };

        logger.info('Cost report generated', {
            totalCost: report.summary.totalCost,
            recommendations: recommendations.length,
        });

        return report;
    }
}

module.exports = new CostOptimizationService();
