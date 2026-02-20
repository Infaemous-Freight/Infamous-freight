/**
 * White-Label Configuration Service
 * Enables customers to customize platform branding and features
 * 
 * Features:
 * - Custom branding (logos, colors, fonts)
 * - Domain customization
 * - Feature toggles per tenant
 * - Email template customization
 * - Custom dashboard layouts
 * - API rate limit configuration
 * - Billing and pricing customization
 * 
 * @module services/whiteLabelConfig
 */

const { PrismaClient } = require('@prisma/client');
const { logger } = require('../middleware/logger');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Default branding configuration
 */
const DEFAULT_BRANDING = {
  primaryColor: '#4F46E5', // Indigo
  secondaryColor: '#10B981', // Green
  accentColor: '#EF4444', // Red
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  fontFamily: 'Inter, system-ui, sans-serif',
  logoUrl: null,
  faviconUrl: null,
  darkMode: false,
};

/**
 * Feature flags available for white-label customization
 */
const AVAILABLE_FEATURES = {
  // Core Features
  SHIPMENT_MANAGEMENT: { key: 'shipment_management', default: true, tier: 'basic' },
  DRIVER_MANAGEMENT: { key: 'driver_management', default: true, tier: 'basic' },
  BASIC_ANALYTICS: { key: 'basic_analytics', default: true, tier: 'basic' },
  
  // Advanced Features
  AI_COMMANDS: { key: 'ai_commands', default: false, tier: 'professional' },
  VOICE_COMMANDS: { key: 'voice_commands', default: false, tier: 'professional' },
  ADVANCED_ANALYTICS: { key: 'advanced_analytics', default: false, tier: 'professional' },
  REAL_TIME_TRACKING: { key: 'real_time_tracking', default: false, tier: 'professional' },
  
  // Enterprise Features
  GRAPHQL_API: { key: 'graphql_api', default: false, tier: 'enterprise' },
  WEBHOOK_SUPPORT: { key: 'webhook_support', default: false, tier: 'enterprise' },
  CUSTOM_INTEGRATIONS: { key: 'custom_integrations', default: false, tier: 'enterprise' },
  PREDICTIVE_ANALYTICS: { key: 'predictive_analytics', default: false, tier: 'enterprise' },
  WHITE_LABEL_BRANDING: { key: 'white_label_branding', default: false, tier: 'enterprise' },
  MULTI_TENANT: { key: 'multi_tenant', default: false, tier: 'enterprise' },
  ADVANCED_REPORTING: { key: 'advanced_reporting', default: false, tier: 'enterprise' },
  API_MARKETPLACE: { key: 'api_marketplace', default: false, tier: 'enterprise' },
};

/**
 * Pricing tiers
 */
const PRICING_TIERS = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom',
};

/**
 * White-Label Configuration Service
 */
class WhiteLabelConfigService {
  constructor() {
    this.availableFeatures = AVAILABLE_FEATURES;
    this.pricingTiers = PRICING_TIERS;
    this.configCache = new Map();
  }

  /**
   * Create white-label configuration for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} config - Configuration options
   * @returns {Promise<Object>} Created configuration
   */
  async createWhiteLabelConfig(organizationId, config = {}) {
    logger.info('Creating white-label configuration', { organizationId });

    const whiteLabelConfig = {
      id: crypto.randomUUID(),
      organizationId,
      tier: config.tier || PRICING_TIERS.BASIC,
      branding: { ...DEFAULT_BRANDING, ...config.branding },
      domain: {
        customDomain: config.customDomain || null,
        subdomain: config.subdomain || organizationId.toLowerCase(),
        sslEnabled: true,
      },
      features: this._initializeFeatures(config.tier || PRICING_TIERS.BASIC, config.features),
      emailTemplates: this._getDefaultEmailTemplates(config.branding),
      apiConfig: {
        rateLimit: config.rateLimit || this._getDefaultRateLimit(config.tier),
        webhookUrl: config.webhookUrl || null,
        apiKeys: [],
      },
      billing: {
        monthlyPrice: this._getPriceForTier(config.tier || PRICING_TIERS.BASIC),
        currency: 'USD',
        billingCycle: 'monthly',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
    };

    // In real implementation:
    // await prisma.whiteLabelConfig.create({ data: whiteLabelConfig });

    // Cache configuration
    this.configCache.set(organizationId, whiteLabelConfig);

    logger.info('White-label configuration created', { 
      organizationId, 
      configId: whiteLabelConfig.id,
      tier: whiteLabelConfig.tier,
    });

    return whiteLabelConfig;
  }

  /**
   * Get white-label configuration for organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Organization configuration
   */
  async getWhiteLabelConfig(organizationId) {
    // Check cache first
    if (this.configCache.has(organizationId)) {
      return this.configCache.get(organizationId);
    }

    logger.info('Fetching white-label configuration', { organizationId });

    // In real implementation:
    // const config = await prisma.whiteLabelConfig.findUnique({
    //   where: { organizationId }
    // });

    // Return default config if not found
    const defaultConfig = await this.createWhiteLabelConfig(organizationId, {});
    return defaultConfig;
  }

  /**
   * Update branding configuration
   * @param {string} organizationId - Organization ID
   * @param {Object} branding - Branding updates
   * @returns {Promise<Object>} Updated configuration
   */
  async updateBranding(organizationId, branding) {
    logger.info('Updating branding configuration', { organizationId });

    const config = await this.getWhiteLabelConfig(organizationId);

    // Validate branding
    this._validateBranding(branding);

    config.branding = { ...config.branding, ...branding };
    config.updatedAt = new Date();

    // Update email templates with new branding
    config.emailTemplates = this._getDefaultEmailTemplates(config.branding);

    // In real implementation:
    // await prisma.whiteLabelConfig.update({
    //   where: { organizationId },
    //   data: { branding: config.branding, updatedAt: config.updatedAt }
    // });

    this.configCache.set(organizationId, config);

    return config;
  }

  /**
   * Update feature flags
   * @param {string} organizationId - Organization ID
   * @param {Object} features - Feature updates
   * @returns {Promise<Object>} Updated configuration
   */
  async updateFeatures(organizationId, features) {
    logger.info('Updating feature flags', { organizationId });

    const config = await this.getWhiteLabelConfig(organizationId);

    // Validate features against tier
    this._validateFeatures(features, config.tier);

    config.features = { ...config.features, ...features };
    config.updatedAt = new Date();

    // In real implementation:
    // await prisma.whiteLabelConfig.update({
    //   where: { organizationId },
    //   data: { features: config.features, updatedAt: config.updatedAt }
    // });

    this.configCache.set(organizationId, config);

    return config;
  }

  /**
   * Update custom domain
   * @param {string} organizationId - Organization ID
   * @param {string} customDomain - Custom domain
   * @returns {Promise<Object>} Updated configuration
   */
  async updateCustomDomain(organizationId, customDomain) {
    logger.info('Updating custom domain', { organizationId, customDomain });

    const config = await this.getWhiteLabelConfig(organizationId);

    // Validate domain
    if (!this._isValidDomain(customDomain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is available
    const available = await this._isDomainAvailable(customDomain);
    if (!available) {
      throw new Error('Domain is already in use');
    }

    config.domain.customDomain = customDomain;
    config.domain.verificationStatus = 'pending';
    config.domain.verificationToken = crypto.randomBytes(32).toString('hex');
    config.updatedAt = new Date();

    // In real implementation:
    // await prisma.whiteLabelConfig.update({
    //   where: { organizationId },
    //   data: { domain: config.domain, updatedAt: config.updatedAt }
    // });

    this.configCache.set(organizationId, config);

    return {
      ...config,
      verificationInstructions: this._getDomainVerificationInstructions(config.domain.verificationToken),
    };
  }

  /**
   * Upgrade tier
   * @param {string} organizationId - Organization ID
   * @param {string} newTier - New pricing tier
   * @returns {Promise<Object>} Updated configuration
   */
  async upgradeTier(organizationId, newTier) {
    logger.info('Upgrading tier', { organizationId, newTier });

    const config = await this.getWhiteLabelConfig(organizationId);

    // Validate tier
    if (!Object.values(PRICING_TIERS).includes(newTier)) {
      throw new Error('Invalid tier');
    }

    // Update tier and enable tier-appropriate features
    config.tier = newTier;
    config.features = this._initializeFeatures(newTier, config.features);
    config.billing.monthlyPrice = this._getPriceForTier(newTier);
    config.apiConfig.rateLimit = this._getDefaultRateLimit(newTier);
    config.updatedAt = new Date();

    // In real implementation:
    // await prisma.whiteLabelConfig.update({
    //   where: { organizationId },
    //   data: {
    //     tier: config.tier,
    //     features: config.features,
    //     billing: config.billing,
    //     apiConfig: config.apiConfig,
    //     updatedAt: config.updatedAt
    //   }
    // });

    this.configCache.set(organizationId, config);

    logger.info('Tier upgraded successfully', { organizationId, newTier });

    return config;
  }

  /**
   * Generate API key for organization
   * @param {string} organizationId - Organization ID
   * @param {string} keyName - Name for the API key
   * @returns {Promise<Object>} API key details
   */
  async generateApiKey(organizationId, keyName = 'Default') {
    logger.info('Generating API key', { organizationId, keyName });

    const config = await this.getWhiteLabelConfig(organizationId);

    const apiKey = {
      id: crypto.randomUUID(),
      key: `wl_${crypto.randomBytes(32).toString('hex')}`,
      name: keyName,
      organizationId,
      createdAt: new Date(),
      lastUsed: null,
      active: true,
    };

    config.apiConfig.apiKeys.push(apiKey);

    // In real implementation:
    // await prisma.apiKey.create({ data: apiKey });

    this.configCache.set(organizationId, config);

    return apiKey;
  }

  /**
   * Get preview of white-label configuration
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Preview data
   */
  async getConfigPreview(organizationId) {
    const config = await this.getWhiteLabelConfig(organizationId);

    return {
      branding: config.branding,
      domain: config.domain.customDomain || `${config.domain.subdomain}.infamousfreight.com`,
      features: Object.entries(config.features)
        .filter(([key, enabled]) => enabled)
        .map(([key]) => key),
      tier: config.tier,
      samplePages: {
        login: `https://${config.domain.customDomain || config.domain.subdomain + '.infamousfreight.com'}/login`,
        dashboard: `https://${config.domain.customDomain || config.domain.subdomain + '.infamousfreight.com'}/dashboard`,
        api: `https://api.${config.domain.customDomain || config.domain.subdomain + '.infamousfreight.com'}`,
      },
    };
  }

  /**
   * Get available tiers and features
   * @returns {Object} Tiers and features
   */
  getAvailableTiersAndFeatures() {
    return {
      tiers: {
        basic: {
          name: 'Basic',
          price: this._getPriceForTier('basic'),
          features: Object.entries(AVAILABLE_FEATURES)
            .filter(([key, info]) => info.tier === 'basic')
            .map(([key, info]) => info.key),
        },
        professional: {
          name: 'Professional',
          price: this._getPriceForTier('professional'),
          features: Object.entries(AVAILABLE_FEATURES)
            .filter(([key, info]) => info.tier === 'basic' || info.tier === 'professional')
            .map(([key, info]) => info.key),
        },
        enterprise: {
          name: 'Enterprise',
          price: this._getPriceForTier('enterprise'),
          features: Object.keys(AVAILABLE_FEATURES),
          customPricing: true,
        },
      },
      allFeatures: Object.entries(AVAILABLE_FEATURES).map(([key, info]) => ({
        key: info.key,
        name: key.replace(/_/g, ' ').toLowerCase(),
        tier: info.tier,
        default: info.default,
      })),
    };
  }

  // ================== Private Helper Methods ==================

  _initializeFeatures(tier, customFeatures = {}) {
    const features = {};

    Object.entries(AVAILABLE_FEATURES).forEach(([key, info]) => {
      // Enable features based on tier
      if (tier === 'enterprise') {
        features[info.key] = customFeatures[info.key] !== undefined ? customFeatures[info.key] : true;
      } else if (tier === 'professional') {
        features[info.key] = info.tier === 'basic' || info.tier === 'professional'
          ? (customFeatures[info.key] !== undefined ? customFeatures[info.key] : info.default)
          : false;
      } else {
        features[info.key] = info.tier === 'basic'
          ? (customFeatures[info.key] !== undefined ? customFeatures[info.key] : info.default)
          : false;
      }
    });

    return features;
  }

  _getDefaultEmailTemplates(branding) {
    const { primaryColor, fontFamily } = branding;

    return {
      welcome: {
        subject: 'Welcome to {{company_name}}',
        html: `
          <div style="font-family: ${fontFamily}; color: #333;">
            <h1 style="color: ${primaryColor};">Welcome!</h1>
            <p>Thank you for choosing {{company_name}} for your freight management needs.</p>
            <p>Get started by logging in to your dashboard.</p>
          </div>
        `,
      },
      shipment_created: {
        subject: 'Shipment Created - {{tracking_number}}',
        html: `
          <div style="font-family: ${fontFamily}; color: #333;">
            <h2 style="color: ${primaryColor};">Shipment Created</h2>
            <p>Your shipment {{tracking_number}} has been created successfully.</p>
            <p><strong>Origin:</strong> {{origin}}</p>
            <p><strong>Destination:</strong> {{destination}}</p>
          </div>
        `,
      },
      delivery_complete: {
        subject: 'Delivery Complete - {{tracking_number}}',
        html: `
          <div style="font-family: ${fontFamily}; color: #333;">
            <h2 style="color: ${primaryColor};">Delivery Complete</h2>
            <p>Your shipment {{tracking_number}} has been delivered successfully.</p>
            <p>Thank you for using {{company_name}}!</p>
          </div>
        `,
      },
    };
  }

  _getDefaultRateLimit(tier) {
    const rateLimits = {
      basic: { requests: 100, window: '1h' },
      professional: { requests: 500, window: '1h' },
      enterprise: { requests: 10000, window: '1h' },
    };

    return rateLimits[tier] || rateLimits.basic;
  }

  _getPriceForTier(tier) {
    const prices = {
      basic: 99,
      professional: 299,
      enterprise: 999,
      custom: null,
    };

    return prices[tier] || prices.basic;
  }

  _validateBranding(branding) {
    if (branding.primaryColor && !this._isValidColor(branding.primaryColor)) {
      throw new Error('Invalid primary color format');
    }
    if (branding.secondaryColor && !this._isValidColor(branding.secondaryColor)) {
      throw new Error('Invalid secondary color format');
    }
    if (branding.logoUrl && !this._isValidUrl(branding.logoUrl)) {
      throw new Error('Invalid logo URL');
    }
  }

  _validateFeatures(features, tier) {
    Object.entries(features).forEach(([key, enabled]) => {
      const feature = Object.values(AVAILABLE_FEATURES).find(f => f.key === key);
      
      if (!feature) {
        throw new Error(`Unknown feature: ${key}`);
      }

      if (enabled && !this._isFatureAllowedForTier(feature.tier, tier)) {
        throw new Error(`Feature ${key} is not available in tier ${tier}`);
      }
    });
  }

  _isFatureAllowedForTier(featureTier, currentTier) {
    const tierHierarchy = { basic: 1, professional: 2, enterprise: 3 };
    return tierHierarchy[currentTier] >= tierHierarchy[featureTier];
  }

  _isValidColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  _isValidDomain(domain) {
    const domainRegex = /^[a-z0-9]+([-.]{ 1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  async _isDomainAvailable(domain) {
    // In real implementation, check against database
    return true;
  }

  _getDomainVerificationInstructions(token) {
    return {
      method1: {
        type: 'DNS TXT Record',
        instructions: [
          `Add a TXT record to your domain's DNS settings`,
          `Host: _infamous-freight-verify`,
          `Value: ${token}`,
          `TTL: 3600`,
        ],
      },
      method2: {
        type: 'HTML File Upload',
        instructions: [
          `Create a file named: infamous-freight-verify.html`,
          `Content: ${token}`,
          `Upload to: https://yourdomain.com/infamous-freight-verify.html`,
        ],
      },
    };
  }

  /**
   * Clear cache for organization
   * @param {string} organizationId - Organization ID
   */
  clearCache(organizationId) {
    this.configCache.delete(organizationId);
    logger.info('Cache cleared', { organizationId });
  }

  /**
   * Get statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      cachedConfigs: this.configCache.size,
      availableFeatures: Object.keys(AVAILABLE_FEATURES).length,
      pricingTiers: Object.keys(PRICING_TIERS).length,
    };
  }
}

module.exports = new WhiteLabelConfigService();
