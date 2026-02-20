/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Environment Configuration Loader with Validation
 *
 * This module provides a single source of truth for all environment variables.
 * All runtime configuration should be loaded through this system.
 *
 * Usage:
 *   const config = require('./config/loadenv');
 *   const port = config.API_PORT;
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration schema with type validation and defaults
 */
const configSchema = {
    // Core Environment
    NODE_ENV: {
        default: 'development',
        enum: ['development', 'test', 'production'],
        validate: (v) => ['development', 'test', 'production'].includes(v),
        description: 'Application environment',
    },

    // API Configuration
    API_PORT: {
        default: 4000,
        type: 'number',
        validate: (v) => v > 0 && v < 65535,
        description: 'API server port',
    },
    API_BASE_URL: {
        default: 'http://localhost:4000',
        required: true,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'API base URL for clients',
    },
    WEB_PORT: {
        default: 3000,
        type: 'number',
        validate: (v) => v > 0 && v < 65535,
        description: 'Web server port',
    },
    WEB_BASE_URL: {
        default: 'http://localhost:3000',
        required: true,
        validate: (v) => /^https?:\/\/.+/.test(v),
        description: 'Web app base URL',
    },

    // Security
    JWT_SECRET: {
        required: process.env.NODE_ENV === 'production',
        validate: (v) => typeof v === 'string' && v.length > 32,
        description: 'JWT signing secret (min 32 chars)',
    },
    JWT_EXPIRY: {
        default: '1h',
        description: 'JWT token expiry',
    },
    CORS_ORIGINS: {
        default: 'http://localhost:3000',
        parse: (v) => v.split(',').map(s => s.trim()),
        description: 'Allowed CORS origins (comma-separated)',
    },

    // Database
    DATABASE_URL: {
        required: process.env.NODE_ENV !== 'test',
        validate: (v) => /^postgresql:\/\/.+/.test(v),
        description: 'PostgreSQL connection string',
    },

    // Logging
    LOG_LEVEL: {
        default: 'info',
        enum: ['debug', 'info', 'warn', 'error'],
        validate: (v) => ['debug', 'info', 'warn', 'error'].includes(v),
        description: 'Logging level',
    },
    PERF_WARN_THRESHOLD_MS: {
        default: 1000,
        type: 'number',
        validate: (v) => v > 0,
        description: 'Warn on queries/requests exceeding this duration (ms)',
    },
    PERF_ERROR_THRESHOLD_MS: {
        default: 5000,
        type: 'number',
        validate: (v) => v > 0,
        description: 'Error on queries/requests exceeding this duration (ms)',
    },

    // Rate Limiting
    RATE_LIMIT_GENERAL_MAX: {
        default: 100,
        type: 'number',
        description: 'General rate limit (requests per 15 minutes)',
    },
    RATE_LIMIT_AUTH_MAX: {
        default: 5,
        type: 'number',
        description: 'Auth rate limit (requests per 15 minutes)',
    },
    RATE_LIMIT_AI_MAX: {
        default: 20,
        type: 'number',
        description: 'AI rate limit (requests per minute)',
    },
    RATE_LIMIT_BILLING_MAX: {
        default: 30,
        type: 'number',
        description: 'Billing rate limit (requests per 15 minutes)',
    },
    RATE_LIMIT_VOICE_MAX: {
        default: 10,
        type: 'number',
        description: 'Voice upload rate limit (per minute)',
    },
    RATE_LIMIT_SMS_USER_MAX: {
        default: 20,
        type: 'number',
        description: 'SMS per user rate limit (per hour)',
    },
    RATE_LIMIT_SMS_ORG_MAX: {
        default: 200,
        type: 'number',
        description: 'SMS per organization rate limit (per 24 hours)',
    },
    RATE_LIMIT_EXPORT_MAX: {
        default: 5,
        type: 'number',
        description: 'Export rate limit (per hour)',
    },
    RATE_LIMIT_PASSWORD_RESET_MAX: {
        default: 3,
        type: 'number',
        description: 'Password reset attempts (per 24 hours)',
    },
    RATE_LIMIT_WEBHOOK_MAX: {
        default: 100,
        type: 'number',
        description: 'Webhook rate limit (per minute)',
    },

    // AI Configuration
    AI_PROVIDER: {
        default: 'synthetic',
        enum: ['openai', 'anthropic', 'synthetic'],
        validate: (v) => ['openai', 'anthropic', 'synthetic'].includes(v),
        description: 'AI provider (openai|anthropic|synthetic)',
    },
    OPENAI_API_KEY: {
        required: process.env.AI_PROVIDER === 'openai',
        description: 'OpenAI API key',
    },
    ANTHROPIC_API_KEY: {
        required: process.env.AI_PROVIDER === 'anthropic',
        description: 'Anthropic API key',
    },

    // Caching
    REDIS_URL: {
        default: null,
        description: 'Redis connection URL (optional)',
    },
    CACHE_TTL_SECONDS: {
        default: 300,
        type: 'number',
        validate: (v) => v > 0,
        description: 'Cache TTL in seconds',
    },
    SLOW_QUERY_MS: {
        default: 500,
        type: 'number',
        description: 'Threshold for slow query warnings (ms)',
    },

    // File Uploads
    VOICE_MAX_FILE_SIZE_MB: {
        default: 10,
        type: 'number',
        validate: (v) => v > 0 && v <= 100,
        description: 'Max voice file upload size (MB)',
    },

    // Monitoring & Analytics
    SENTRY_DSN: {
        default: null,
        description: 'Sentry error tracking DSN',
    },
    DATADOG_APP_ID: {
        default: null,
        description: 'Datadog app ID for RUM',
    },
    DATADOG_CLIENT_TOKEN: {
        default: null,
        description: 'Datadog client token for RUM',
    },
    DATADOG_SITE: {
        default: 'datadoghq.com',
        enum: ['datadoghq.com', 'datadoghq.eu'],
        description: 'Datadog site',
    },

    // Webhooks
    WEBHOOK_SECRET: {
        required: process.env.NODE_ENV === 'production',
        validate: (v) => typeof v === 'string' && v.length > 32,
        description: 'Webhook signing secret',
    },

    // Feature Flags
    ALLOW_X_USER_ID: {
        default: false,
        type: 'boolean',
        description: 'Allow x-user-id header for development',
    },
    ENABLE_QUERY_LOGGING: {
        default: false,
        type: 'boolean',
        description: 'Enable detailed query logging',
    },

    // Auth0 / JWKS (Optional)
    AUTH_JWKS_URI: {
        default: null,
        description: 'JWKS URI for JWT key rotation',
    },
    AUTH_AUDIENCE: {
        default: null,
        description: 'Auth audience claim',
    },
    AUTH_ISSUER: {
        default: null,
        description: 'Auth issuer claim',
    },
};

/**
 * Load and validate configuration
 */
function loadConfig() {
    const config = {};
    const errors = [];
    const warnings = [];

    for (const [key, schema] of Object.entries(configSchema)) {
        const envValue = process.env[key];
        let value;

        // Check if required but missing
        if (schema.required && !envValue) {
            errors.push(`❌ ${key}: Required but not set`);
            continue;
        }

        // Use default if not provided
        if (!envValue) {
            value = schema.default;
            if (schema.default !== null) {
                if (process.env.NODE_ENV !== 'production') {
                    warnings.push(`ℹ ${key}: Using default "${schema.default}"`);
                }
            }
        } else {
            value = envValue;
        }

        // Parse if needed
        if (value && schema.parse) {
            value = schema.parse(value);
        }

        // Convert to correct type
        if (schema.type === 'number' && typeof value === 'string') {
            value = parseInt(value, 10);
        } else if (schema.type === 'boolean' && typeof value === 'string') {
            value = ['true', '1', 'yes'].includes(value.toLowerCase());
        }

        // Enum validation
        if (schema.enum && value && !schema.enum.includes(value)) {
            errors.push(
                `❌ ${key}: "${value}" not in allowed values: ${schema.enum.join(', ')}`
            );
            continue;
        }

        // Custom validation
        if (schema.validate && value && !schema.validate(value)) {
            errors.push(`❌ ${key}: Failed custom validation`);
            continue;
        }

        config[key] = value;
    }

    // Report errors and warnings
    if (errors.length > 0) {
        console.error('\n❌ Configuration Validation Errors:');
        errors.forEach((err) => console.error('  ' + err));
        throw new Error(`Configuration validation failed: ${errors.length} error(s)`);
    }

    if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
        console.warn('\n⚠️  Configuration Warnings:');
        warnings.forEach((warn) => console.warn('  ' + warn));
    }

    return config;
}

/**
 * Generate .env.example file
 */
function generateEnvExample() {
    const lines = [
        '# Infamous Freight Enterprises - Configuration Example',
        '# Copy this to .env and fill in the values',
        '# Generated: ' + new Date().toISOString(),
        '',
    ];

    let currentCategory = null;
    for (const [key, schema] of Object.entries(configSchema)) {
        // Add category comments
        const category = key.split('_')[0];
        if (category !== currentCategory) {
            currentCategory = category;
            lines.push(`# ${category.toUpperCase()}`);
        }

        // Add description
        if (schema.description) {
            lines.push(`# ${schema.description}`);
        }

        // Add enum options
        if (schema.enum) {
            lines.push(`# Options: ${schema.enum.join(', ')}`);
        }

        // Add value
        const placeholder = schema.default !== null ? schema.default : 'your-value-here';
        lines.push(`${key}=${placeholder}`);
        lines.push('');
    }

    return lines.join('\n');
}

// Load and export configuration
const config = loadConfig();

// Export helper to regenerate .env.example
config.generateEnvExample = () => {
    const example = generateEnvExample();
    const envExamplePath = path.join(__dirname, '../../.env.example');
    fs.writeFileSync(envExamplePath, example);
    console.log('✅ Generated .env.example');
    return example;
};

// Regenerate on first load if in development
if (process.env.NODE_ENV === 'development' && !process.env.SKIP_ENV_GEN) {
    try {
        config.generateEnvExample();
    } catch (err) {
        console.warn('⚠️  Could not generate .env.example:', err.message);
    }
}

module.exports = config;
