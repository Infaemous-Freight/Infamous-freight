/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Docker Secrets Management
 */

const fs = require('fs');
const { logger } = require('../middleware/logger');

/**
 * Get secret from Docker secrets or environment variable
 * In Docker Swarm, secrets are files in /run/secrets/
 * In Docker Compose, we read from .env or files
 */
function getSecret(secretName, envVarName, defaultValue = null) {
    // First, try Docker secrets file (Swarm mode)
    const secretPath = `/run/secrets/${secretName}`;
    if (fs.existsSync(secretPath)) {
        try {
            return fs.readFileSync(secretPath, 'utf8').trim();
        } catch (error) {
            logger.warn({ secretPath, error: error.message }, 'Failed to read secret file');
        }
    }

    // Second, try environment variable FILE (Docker Compose)
    const envFileVar = `${envVarName}_FILE`;
    if (process.env[envFileVar]) {
        try {
            return fs.readFileSync(process.env[envFileVar], 'utf8').trim();
        } catch (error) {
            logger.warn({ envFileVar, error: error.message }, 'Failed to read secret file from env var');
        }
    }

    // Third, try direct environment variable
    if (process.env[envVarName]) {
        return process.env[envVarName];
    }

    // Finally, return default if all else fails
    if (defaultValue !== null) {
        return defaultValue;
    }

    throw new Error(`Secret not found: ${secretName} (${envVarName})`);
}

/**
 * Secrets configuration object
 * All sensitive values should go through this
 */
const secrets = {
    // JWT secrets
    jwtSecret: getSecret('jwt_secret', 'JWT_SECRET'),
    jwtRefreshSecret: getSecret('jwt_refresh_secret', 'JWT_REFRESH_SECRET'),

    // Database secrets
    databasePassword: getSecret('db_password', 'POSTGRES_PASSWORD'),
    databaseUrl: getSecret('database_url', 'DATABASE_URL'),

    // Redis secrets
    redisPassword: getSecret('redis_password', 'REDIS_PASSWORD'),
    redisUrl: getSecret('redis_url', 'REDIS_URL'),

    // Third-party API keys
    stripeSecretKey: getSecret('stripe_secret', 'STRIPE_SECRET_KEY', null),
    paypalClientId: getSecret('paypal_client_id', 'PAYPAL_CLIENT_ID', null),
    paypalSecret: getSecret('paypal_secret', 'PAYPAL_SECRET', null),

    // Email service
    sendgridApiKey: getSecret('sendgrid_api', 'SENDGRID_API_KEY', null),

    // AWS / Cloud credentials
    awsAccessKeyId: getSecret('aws_access_key', 'AWS_ACCESS_KEY_ID', null),
    awsSecretAccessKey: getSecret('aws_secret_key', 'AWS_SECRET_ACCESS_KEY', null),

    // Monitoring / Error tracking
    sentryDsn: process.env.SENTRY_DSN || null,
    datadog: {
        apiKey: getSecret('datadog_api', 'DD_API_KEY', null),
        appKey: getSecret('datadog_app', 'DD_APP_KEY', null)
    }
};

/**
 * Validate that all required secrets are present
 */
function validateSecrets() {
    const required = [
        'jwtSecret',
        'jwtRefreshSecret',
        'databasePassword',
        'databaseUrl',
        'redisPassword'
    ];

    const missing = required.filter(key => !secrets[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required secrets: ${missing.join(', ')}`);
    }

    logger.info('All required secrets loaded');
}

/**
 * Clear sensitive data from process (security best practice)
 */
function clearSensitiveEnvVars() {
    const sensitiveVars = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'POSTGRES_PASSWORD',
        'DATABASE_URL',
        'REDIS_PASSWORD',
        'STRIPE_SECRET_KEY',
        'PAYPAL_SECRET',
        'SENDGRID_API_KEY',
        'AWS_SECRET_ACCESS_KEY'
    ];

    sensitiveVars.forEach(varName => {
        if (process.env[varName]) {
            delete process.env[varName];
        }
    });
}

module.exports = {
    secrets,
    getSecret,
    validateSecrets,
    clearSensitiveEnvVars
};
