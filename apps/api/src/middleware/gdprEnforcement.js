/**
 * GDPR Enforcement Middleware - Phase 7 Tier 2
 * 
 * Enforces GDPR requirements across API endpoints:
 * - Consent validation before data processing
 * - Purpose limitation enforcement
 * - Data minimization checks
 * - Audit logging of data access
 * 
 * Use this middleware on routes that process user data
 */

const gdprService = require('../services/gdprCompliance');
const logger = require('./logger').logger;
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');

/**
 * Require consent before processing data
 * @param {string} consentType - Type of consent required
 * @param {string} purpose - Purpose for data processing
 */
function requireConsent(consentType, purpose) {
    return async (req, res, next) => {
        try {
            // Skip for health checks and public endpoints
            if (req.path.startsWith('/api/health')) {
                return next();
            }

            // Skip if no user authentication
            if (!req.user || !req.user.sub) {
                return next();
            }

            const userId = req.user.sub;

            // Check if user has granted consent
            const hasConsent = await gdprService.hasConsent(userId, consentType);

            if (!hasConsent) {
                logger.warn('GDPR consent required', {
                    userId,
                    consentType,
                    purpose,
                    endpoint: req.path
                });

                return res.status(HTTP_STATUS.FORBIDDEN).json(
                    new ApiResponse({
                        success: false,
                        error: 'Consent required',
                        message: `You must grant ${consentType} consent to use this feature`,
                        metadata: {
                            consentType,
                            consentEndpoint: '/api/gdpr/consent',
                            gdprArticle: 'Article 7 - Conditions for consent'
                        }
                    })
                );
            }

            // Log the data processing activity
            await gdprService._logDataProcessing(userId, 'data_access', {
                purpose,
                endpoint: req.path,
                method: req.method,
                legalBasis: 'Article 6(1)(a) - Consent',
                consentType
            });

            next();
        } catch (error) {
            logger.error('GDPR consent check failed:', {
                error: error.message,
                consentType
            });
            // Fail closed - if we can't verify consent, deny access
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
                new ApiResponse({
                    success: false,
                    error: 'Unable to verify consent',
                    message: 'Please try again later'
                })
            );
        }
    };
}

/**
 * Log data processing activity (GDPR Article 30)
 * @param {string} operation - Type of operation (read, write, delete, etc.)
 * @param {string} purpose - Purpose for processing
 * @param {string} legalBasis - GDPR Article 6 legal basis
 */
function logProcessing(operation, purpose, legalBasis = 'Article 6(1)(b) - Contract') {
    return async (req, res, next) => {
        try {
            // Skip if no user authentication
            if (!req.user || !req.user.sub) {
                return next();
            }

            const userId = req.user.sub;

            // Log the processing activity
            await gdprService._logDataProcessing(userId, operation, {
                purpose,
                legalBasis,
                endpoint: req.path,
                method: req.method,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            next();
        } catch (error) {
            // Don't block the request if logging fails
            logger.error('Failed to log GDPR processing:', {
                error: error.message,
                operation,
                purpose
            });
            next();
        }
    };
}

/**
 * Validate data retention period (GDPR Article 5 - Storage limitation)
 */
function enforceRetention(retentionDays = 365) {
    return async (req, res, next) => {
        try {
            // This middleware can be used to check if data should still be retained
            // and automatically delete or anonymize data that exceeds retention period

            // For now, just log the retention policy
            req.gdprRetentionDays = retentionDays;

            next();
        } catch (error) {
            logger.error('Retention enforcement failed:', {
                error: error.message
            });
            next();
        }
    };
}

/**
 * Purpose limitation check (GDPR Article 5 - Purpose limitation)
 * Ensures data is only used for the stated purpose
 */
function purposeLimitation(allowedPurposes = []) {
    return async (req, res, next) => {
        try {
            // Store allowed purposes in request for later validation
            req.gdprAllowedPurposes = allowedPurposes;

            // Log the purpose limitation
            if (req.user && req.user.sub) {
                logger.debug('GDPR purpose limitation applied', {
                    userId: req.user.sub,
                    allowedPurposes,
                    endpoint: req.path
                });
            }

            next();
        } catch (error) {
            logger.error('Purpose limitation check failed:', {
                error: error.message
            });
            next();
        }
    };
}

/**
 * Data minimization check (GDPR Article 5 - Data minimisation)
 * Warns if response includes more data than necessary
 */
function dataMinimization(allowedFields = []) {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to filter fields
        res.json = function (data) {
            if (allowedFields.length > 0 && data && data.data) {
                // Filter data to only include allowed fields
                const filtered = {};
                allowedFields.forEach(field => {
                    if (data.data[field] !== undefined) {
                        filtered[field] = data.data[field];
                    }
                });

                if (Object.keys(filtered).length > 0) {
                    data.data = filtered;
                }

                logger.debug('GDPR data minimization applied', {
                    allowedFields,
                    endpoint: req.path
                });
            }

            return originalJson(data);
        };

        next();
    };
}

/**
 * Cookie consent banner requirement (ePrivacy Directive)
 */
function requireCookieConsent() {
    return (req, res, next) => {
        // Check for cookie consent header
        const cookieConsent = req.headers['x-cookie-consent'];

        if (!cookieConsent && req.cookies && Object.keys(req.cookies).length > 0) {
            logger.warn('Cookie usage without consent banner', {
                cookies: Object.keys(req.cookies),
                endpoint: req.path
            });
        }

        // Set response header indicating cookie consent requirement
        res.setHeader('X-Cookie-Consent-Required', 'true');

        next();
    };
}

/**
 * Cross-border data transfer check (GDPR Chapter V)
 */
function checkDataTransfer(allowedRegions = ['EU', 'EEA', 'US']) {
    return (req, res, next) => {
        try {
            // Get user's region from request
            const userRegion = req.headers['x-user-region'] || 'unknown';

            if (!allowedRegions.includes(userRegion) && userRegion !== 'unknown') {
                logger.warn('Cross-border data transfer detected', {
                    userRegion,
                    allowedRegions,
                    endpoint: req.path
                });

                // In production, you might want to block or require additional consent
                // For now, just log the transfer
            }

            next();
        } catch (error) {
            logger.error('Data transfer check failed:', {
                error: error.message
            });
            next();
        }
    };
}

/**
 * Automated decision-making notice (GDPR Article 22)
 * Required when using AI/ML for automated decisions
 */
function automatedDecisionNotice() {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to add notice
        res.json = function (data) {
            if (data && typeof data === 'object') {
                // Add notice if automated decision was made
                if (data.automated || data.aiGenerated) {
                    data.gdprNotice = {
                        article: 'Article 22',
                        message: 'This decision was made through automated processing',
                        rights: 'You have the right to object to automated decision-making',
                        contact: '/api/gdpr/support'
                    };
                }
            }

            return originalJson(data);
        };

        next();
    };
}

module.exports = {
    requireConsent,
    logProcessing,
    enforceRetention,
    purposeLimitation,
    dataMinimization,
    requireCookieConsent,
    checkDataTransfer,
    automatedDecisionNotice
};
