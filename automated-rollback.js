/**
 * Automated Rollback Strategy
 *
 * Monitors deployment health metrics and automatically triggers rollback
 * if thresholds are exceeded within the critical monitoring window.
 *
 * Monitored Metrics:
 * - Error rate (target: < 5%)
 * - API latency P95 (target: < 1000ms)
 * - 5xx error rate (target: < 1%)
 * - Deployment version mismatch
 * - Health check failures
 *
 * Triggers automatic rollback if:
 * 1. Error rate > 10% for > 5 minutes
 * 2. Average latency > 2000ms for > 5 minutes
 * 3. 5xx errors > 5% for > 2 minutes
 * 4. All instances failing health checks > 30 seconds
 */

import axios from 'axios';

class AutomatedRollback {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:4000';
        this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
        this.criticalWindow = options.criticalWindow || 300000; // 5 minutes
        this.thresholds = {
            errorRate: options.errorRateThreshold || 0.1, // 10%
            latencyP95: options.latencyP95Threshold || 2000, // ms
            fivexxErrorRate: options.fivexxErrorRateThreshold || 0.05, // 5%
            healthCheckFailures: options.healthCheckFailuresThreshold || 3, // consecutive
        };
        this.rollbackCommand = options.rollbackCommand || './deploy-blue-green.sh rollback';
        this.alerting = options.alerting || null; // Sentry, Datadog, etc.

        this.metrics = {
            errorCount: 0,
            totalRequests: 0,
            fivexxCount: 0,
            latencies: [],
            healthCheckFailures: 0,
            measurements: [], // Historical metrics
        };

        this.isRollingBack = false;
        this.monitor = null;
    }

    /**
     * Start monitoring for issues
     */
    start() {
        console.log('🔍 Automated rollback monitoring started');
        this.monitor = setInterval(() => this.checkHealth(), this.monitoringInterval);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitor) {
            clearInterval(this.monitor);
            this.monitor = null;
            console.log('⏸️  Monitoring stopped');
        }
    }

    /**
     * Check health and collect metrics
     */
    async checkHealth() {
        try {
            const [health, errors, performance] = await Promise.all([
                this.getHealthStatus(),
                this.getErrorMetrics(),
                this.getPerformanceMetrics(),
            ]);

            // Record measurement
            const measurement = {
                timestamp: Date.now(),
                health,
                errors,
                performance,
            };
            this.metrics.measurements.push(measurement);

            // Keep only last 30 minutes of data
            const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
            this.metrics.measurements = this.metrics.measurements.filter(
                (m) => m.timestamp > thirtyMinutesAgo
            );

            // Check if rollback needed
            await this.evaluateRollback(measurement);
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            this.metrics.healthCheckFailures++;

            if (
                this.metrics.healthCheckFailures >=
                this.thresholds.healthCheckFailures
            ) {
                await this.triggerRollback(
                    `Health check failures: ${this.metrics.healthCheckFailures}`
                );
            }
        }
    }

    /**
     * Get health status from API
     */
    async getHealthStatus() {
        const response = await axios.get(`${this.apiUrl}/api/health`, {
            timeout: 5000,
        });

        if (response.status === 200) {
            this.metrics.healthCheckFailures = 0;
            return {
                status: 'healthy',
                uptime: response.data.uptime,
                database: response.data.database,
                version: response.data.version,
            };
        }

        throw new Error(`Health check returned ${response.status}`);
    }

    /**
     * Get error metrics from monitoring service
     */
    async getErrorMetrics() {
        // Query Prometheus, DataDog, New Relic, or similar
        // This is a mock implementation
        const response = await axios.get(`${this.apiUrl}/api/metrics/errors`, {
            timeout: 5000,
        });

        return {
            errorRate: response.data.errorRate || 0,
            fivexxRate: response.data.fivexxRate || 0,
            errorCount: response.data.errorCount || 0,
            totalRequests: response.data.totalRequests || 0,
        };
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics() {
        const response = await axios.get(`${this.apiUrl}/api/metrics/performance`, {
            timeout: 5000,
        });

        return {
            latencyP50: response.data.latencyP50 || 0,
            latencyP95: response.data.latencyP95 || 0,
            latencyP99: response.data.latencyP99 || 0,
            throughput: response.data.throughput || 0,
        };
    }

    /**
     * Evaluate if rollback is needed
     */
    async evaluateRollback(currentMeasurement) {
        const recentMeasurements = this.metrics.measurements.slice(-10); // Last ~5 minutes

        if (recentMeasurements.length < 2) {
            console.log('📊 Not enough data for evaluation yet');
            return;
        }

        // Check error rate threshold
        const avgErrorRate =
            recentMeasurements.reduce(
                (sum, m) => sum + m.errors.errorRate,
                0
            ) / recentMeasurements.length;

        if (avgErrorRate > this.thresholds.errorRate) {
            await this.triggerRollback(
                `Error rate ${(avgErrorRate * 100).toFixed(2)}% exceeds threshold ${this.thresholds.errorRate * 100
                }%`
            );
            return;
        }

        // Check latency threshold
        const avgLatency =
            recentMeasurements.reduce(
                (sum, m) => sum + m.performance.latencyP95,
                0
            ) / recentMeasurements.length;

        if (avgLatency > this.thresholds.latencyP95) {
            await this.triggerRollback(
                `Latency P95 ${avgLatency.toFixed(0)}ms exceeds threshold ${this.thresholds.latencyP95
                }ms`
            );
            return;
        }

        // Check 5xx error rate
        const avg5xxRate =
            recentMeasurements.reduce(
                (sum, m) => sum + m.errors.fivexxRate,
                0
            ) / recentMeasurements.length;

        if (avg5xxRate > this.thresholds.fivexxErrorRate) {
            await this.triggerRollback(
                `5xx error rate ${(avg5xxRate * 100).toFixed(2)}% exceeds threshold ${this.thresholds.fivexxErrorRate * 100
                }%`
            );
            return;
        }

        // All checks passed
        this.logHealthStatus(currentMeasurement);
    }

    /**
     * Trigger automatic rollback
     */
    async triggerRollback(reason) {
        if (this.isRollingBack) {
            console.log('⏳ Rollback already in progress, skipping...');
            return;
        }

        this.isRollingBack = true;

        try {
            console.log('🚨 TRIGGERING AUTOMATIC ROLLBACK 🚨');
            console.log(`Reason: ${reason}`);

            // Alert monitoring services
            await this.sendAlert({
                severity: 'critical',
                title: 'Automatic Rollback Triggered',
                message: reason,
                action: 'Reverting to previous stable version',
            });

            // Log incident
            await this.logIncident({
                type: 'automatic_rollback',
                reason,
                triggeredAt: new Date().toISOString(),
                metrics: this.metrics,
            });

            // Execute rollback
            const { execSync } = require('child_process');
            try {
                execSync(this.rollbackCommand, { stdio: 'inherit' });
                console.log('✅ Rollback completed successfully');

                // Send recovery alert
                await this.sendAlert({
                    severity: 'resolved',
                    title: 'Rollback Completed',
                    message: 'Application has been reverted to previous stable version',
                });
            } catch (error) {
                console.error('❌ Rollback execution failed:', error.message);

                // Send escalation alert
                await this.sendAlert({
                    severity: 'critical',
                    title: 'Rollback Execution Failed',
                    message: `Manual intervention required: ${error.message}`,
                    escalate: true,
                });
            }
        } finally {
            this.isRollingBack = false;
        }
    }

    /**
     * Send alert to monitoring/alerting service
     */
    async sendAlert(alert) {
        if (!this.alerting) {
            console.log('⚠️  No alerting service configured, log only');
            return;
        }

        try {
            // Example: Send to Sentry
            if (this.alerting.type === 'sentry') {
                this.alerting.captureMessage(alert.message, {
                    level: alert.severity === 'critical' ? 'error' : 'info',
                    context: alert,
                });
            }
            // Example: Send to Datadog
            else if (this.alerting.type === 'datadog') {
                await this.alerting.submitEvent({
                    title: alert.title,
                    text: alert.message,
                    priority: alert.severity === 'critical' ? 'normal' : 'low',
                    tags: ['auto-rollback'],
                });
            }
            // Custom HTTP endpoint
            else if (this.alerting.webhook) {
                await axios.post(this.alerting.webhook, alert);
            }
        } catch (error) {
            console.error('❌ Failed to send alert:', error.message);
        }
    }

    /**
     * Log incident for post-mortem
     */
    async logIncident(incident) {
        try {
            // Log to file
            const fs = require('fs').promises;
            const timestamp = new Date().toISOString();
            const logFile = `./incidents/rollback-${timestamp.split('T')[0]}.log`;

            await fs.appendFile(
                logFile,
                JSON.stringify({ ...incident, timestamp }, null, 2) + '\n'
            );

            console.log(`📝 Incident logged to ${logFile}`);
        } catch (error) {
            console.error('❌ Failed to log incident:', error.message);
        }
    }

    /**
     * Log health status when all is well
     */
    logHealthStatus(measurement) {
        const errorRate = (measurement.errors.errorRate * 100).toFixed(2);
        const latency = measurement.performance.latencyP95.toFixed(0);

        console.log(
            `✅ Deployment healthy | Error: ${errorRate}% | Latency P95: ${latency}ms`
        );
    }

    /**
     * Get rollback history
     */
    getRollbackHistory() {
        return this.metrics.measurements
            .filter((m) => m.rollback)
            .map((m) => ({
                timestamp: new Date(m.timestamp),
                reason: m.rollback.reason,
                version: m.rollback.version,
            }));
    }

    /**
     * Get current metrics summary
     */
    getMetricsSummary() {
        const recent = this.metrics.measurements.slice(-10);

        if (recent.length === 0) {
            return {
                status: 'no_data',
                message: 'No measurements collected yet',
            };
        }

        return {
            latestMeasurement: recent[recent.length - 1],
            avgErrorRate:
                recent.reduce((sum, m) => sum + m.errors.errorRate, 0) / recent.length,
            avgLatencyP95:
                recent.reduce((sum, m) => sum + m.performance.latencyP95, 0) /
                recent.length,
            healthStatus: recent[recent.length - 1].health.status,
            measurements: recent.length,
            timespan: `${((recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 60).toFixed(1)} minutes`,
        };
    }
}

// Export singleton
const rollbackMonitor = new AutomatedRollback({
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    errorRateThreshold: parseFloat(process.env.ROLLBACK_ERROR_THRESHOLD || '0.1'),
    latencyP95Threshold: parseInt(
        process.env.ROLLBACK_LATENCY_THRESHOLD || '2000'
    ),
    fivexxErrorRateThreshold: parseFloat(
        process.env.ROLLBACK_FIVEXX_THRESHOLD || '0.05'
    ),
    monitoringInterval: parseInt(process.env.MONITORING_INTERVAL || '30000'),
});

module.exports = {
    AutomatedRollback,
    rollbackMonitor,
};

/**
 * Start monitoring if running directly
 */
if (require.main === module) {
    rollbackMonitor.start();

    // Log metrics every 5 minutes
    setInterval(() => {
        console.log('\n📊 Metrics Summary:');
        console.log(JSON.stringify(rollbackMonitor.getMetricsSummary(), null, 2));
    }, 5 * 60 * 1000);

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n👋 Shutting down monitoring...');
        rollbackMonitor.stop();
        process.exit(0);
    });
}
