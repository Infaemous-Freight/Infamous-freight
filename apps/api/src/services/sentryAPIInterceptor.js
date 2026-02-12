/**
 * Sentry API Response Interceptor
 * 
 * Comprehensive tracking of API errors, responses, and performance
 * Integrates with fetch/axios for automatic error capture
 * 
 * @version 1.0.0
 * @author Error Tracking Team
 */

const Sentry = require("@sentry/node");
const logger = require("../utils/logger");

/**
 * Enhanced API Response Interceptor
 * Tracks external API calls, responses, and errors
 */
class SentryAPIInterceptor {
    constructor() {
        this.apiCalls = [];
        this.errorPatterns = {};
        this.enableTracking = process.env.SENTRY_API_TRACKING !== "false";
    }

    /**
     * Track external API call
     * @param {Object} config - API call configuration
     * @param {string} config.method - HTTP method
     * @param {string} config.url - API endpoint URL
     * @param {Object} config.headers - Request headers
     * @param {any} config.data - Request body
     * @returns {Object} Tracking context
     */
    trackAPICall(config) {
        if (!this.enableTracking) return null;

        const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const call = {
            id: callId,
            timestamp: Date.now(),
            method: config.method || "GET",
            url: this.sanitizeURL(config.url),
            headers: this.sanitizeHeaders(config.headers || {}),
            body: this.sanitizeBody(config.data),
            status: null,
            duration: null,
            error: null,
        };

        this.apiCalls.push(call);
        if (this.apiCalls.length > 100) {
            this.apiCalls.shift();
        }

        return call;
    }

    /**
     * Record API response
     * @param {string} callId - Call tracking ID
     * @param {Object} response - Response details
     * @param {number} response.status - HTTP status code
     * @param {Object} response.headers - Response headers
     * @param {any} response.data - Response body
     * @param {number} duration - Request duration in ms
     */
    recordResponse(callId, response, duration) {
        const call = this.apiCalls.find((c) => c.id === callId);
        if (!call) return;

        call.status = response.status;
        call.duration = duration;
        call.responseSize = JSON.stringify(response.data || {}).length;

        if (response.status >= 400) {
            call.error = {
                status: response.status,
                statusText: response.statusText,
                data: this.sanitizeBody(response.data),
            };

            this.trackErrorPattern(call);
            this.logAPIError(call);
        }

        // Track slow API calls
        if (duration > 5000) {
            logger.warn(`Slow external API call: ${call.method} ${call.url}`, {
                duration,
                status: response.status,
                url: call.url,
            });
        }
    }

    /**
     * Track error patterns
     * @private
     */
    trackErrorPattern(call) {
        const pattern = `${call.method} ${call.url.split("?")[0]}: ${call.error.status}`;

        if (!this.errorPatterns[pattern]) {
            this.errorPatterns[pattern] = {
                count: 0,
                lastOccurred: null,
                examples: [],
            };
        }

        const patternInfo = this.errorPatterns[pattern];
        patternInfo.count++;
        patternInfo.lastOccurred = new Date().toISOString();
        if (patternInfo.examples.length < 3) {
            patternInfo.examples.push({
                timestamp: call.timestamp,
                error: call.error,
            });
        }
    }

    /**
     * Log API error to Sentry
     * @private
     */
    logAPIError(call) {
        const isClientError = call.error.status >= 400 && call.error.status < 500;
        const isServerError = call.error.status >= 500;

        Sentry.captureMessage(
            `External API Error: ${call.method} ${call.url}`,
            {
                level: isServerError ? "error" : "warning",
                tags: {
                    apiUrl: call.url,
                    method: call.method,
                    status: call.error.status,
                    type: isClientError ? "client_error" : "server_error",
                },
                contexts: {
                    api: {
                        method: call.method,
                        url: call.url,
                        status: call.error.status,
                        duration: call.duration,
                        requestData: call.body,
                        responseData: call.error.data,
                    },
                },
            }
        );

        logger.error(`API call failed: ${call.method} ${call.url}`, {
            status: call.error.status,
            duration: call.duration,
            url: call.url,
            error: call.error.data,
        });
    }

    /**
     * Sanitize URL (remove sensitive params)
     * @private
     */
    sanitizeURL(url) {
        try {
            const urlObj = new URL(url);
            const sensitiveParams = ["api_key", "token", "password", "secret"];

            sensitiveParams.forEach((param) => {
                if (urlObj.searchParams.has(param)) {
                    urlObj.searchParams.set(param, "[REDACTED]");
                }
            });

            return urlObj.toString();
        } catch (e) {
            return url;
        }
    }

    /**
     * Sanitize headers
     * @private
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ["authorization", "x-api-key", "x-token"];

        sensitiveHeaders.forEach((header) => {
            Object.keys(sanitized).forEach((key) => {
                if (key.toLowerCase().includes(header)) {
                    sanitized[key] = "[REDACTED]";
                }
            });
        });

        return sanitized;
    }

    /**
     * Sanitize request/response body
     * @private
     */
    sanitizeBody(data) {
        if (!data) return null;
        if (typeof data !== "object") return String(data).substring(0, 200);

        const sanitized = JSON.parse(JSON.stringify(data));
        const sensitiveFields = ["password", "token", "creditCard", "ssn", "apiKey"];

        const sanitizeObj = (obj) => {
            if (!obj || typeof obj !== "object") return;

            Object.keys(obj).forEach((key) => {
                if (sensitiveFields.some((sf) => key.toLowerCase().includes(sf))) {
                    obj[key] = "[REDACTED]";
                } else if (typeof obj[key] === "object") {
                    sanitizeObj(obj[key]);
                } else if (typeof obj[key] === "string" && obj[key].length > 500) {
                    obj[key] = obj[key].substring(0, 500) + "...";
                }
            });
        };

        sanitizeObj(sanitized);
        return sanitized;
    }

    /**
     * Get API call statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        if (this.apiCalls.length === 0) {
            return { status: "No API calls tracked" };
        }

        const byURL = {};
        const byStatus = {};
        let totalDuration = 0;
        let errorCount = 0;

        this.apiCalls.forEach((call) => {
            const url = call.url.split("?")[0];
            if (!byURL[url]) {
                byURL[url] = { count: 0, totalDuration: 0, errors: 0 };
            }
            byURL[url].count++;
            byURL[url].totalDuration += call.duration;
            if (call.error) {
                byURL[url].errors++;
                errorCount++;
            }

            const status = call.status || "pending";
            byStatus[status] = (byStatus[status] || 0) + 1;

            totalDuration += call.duration;
        });

        return {
            totalCalls: this.apiCalls.length,
            averageDuration: Math.round(totalDuration / this.apiCalls.length),
            totalDuration,
            errorCount,
            errorRate: ((errorCount / this.apiCalls.length) * 100).toFixed(2) + "%",
            byURL,
            byStatus,
            errorPatterns: this.errorPatterns,
        };
    }

    /**
     * Create Sentry middleware for Express
     * @param {Express.App} app - Express application
     */
    static createExpressMiddleware() {
        return (req, res, next) => {
            const interceptor = new SentryAPIInterceptor();
            req.apiInterceptor = interceptor;
            next();
        };
    }
}

module.exports = SentryAPIInterceptor;
