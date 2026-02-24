/**
 * Phase 7 Tier 5: Localization Service
 * 
 * Provides advanced formatting for:
 * - Currency (with locale-specific symbols and formatting)
 * - Dates and times (with timezone support)
 * - Numbers (with locale-specific separators)
 * - Relative time (e.g., "2 hours ago")
 * - Regional pricing models
 */

const {
    LOCALE_TO_CURRENCY,
    TIMEZONE_BY_LOCALE,
    CURRENCY_CODES,
    DEFAULT_LOCALE,
} = require("@infamous-freight/shared");
const { formatCurrency, formatDate, formatDateTime, formatNumber, formatRelativeTime } = require("@infamous-freight/shared");
const logger = require("../middleware/logger");

/**
 * Regional pricing multipliers
 * Adjusts base USD prices for regional markets
 */
const REGIONAL_PRICING_MULTIPLIERS = {
    USD: 1.0, // Base (United States)
    EUR: 0.92, // European Union (slightly cheaper due to competition)
    GBP: 0.79, // United Kingdom
    JPY: 145.0, // Japan
    CNY: 7.2, // China
    KRW: 1320.0, // South Korea
    BRL: 5.0, // Brazil (higher due to import costs)
    MXN: 17.0, // Mexico
    CAD: 1.35, // Canada
    AUD: 1.52, // Australia
    INR: 83.0, // India (lower for market competitiveness)
    RUB: 92.0, // Russia
    AED: 3.67, // UAE
    SAR: 3.75, // Saudi Arabia
    ILS: 3.65, // Israel
};

/**
 * Get currency for locale
 * @param {string} locale - Locale code
 * @returns {string} Currency code (ISO 4217)
 */
function getCurrencyForLocale(locale = DEFAULT_LOCALE) {
    return LOCALE_TO_CURRENCY[locale] || "USD";
}

/**
 * Get timezone for locale
 * @param {string} locale - Locale code
 * @returns {string} Timezone (IANA identifier)
 */
function getTimezoneForLocale(locale = DEFAULT_LOCALE) {
    return TIMEZONE_BY_LOCALE[locale] || "America/New_York";
}

/**
 * Convert USD price to regional currency
 * @param {number} usdPrice - Price in USD cents
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Price in target currency (smallest unit)
 */
function convertCurrency(usdPrice, targetCurrency = "USD") {
    if (!REGIONAL_PRICING_MULTIPLIERS[targetCurrency]) {
        logger.warn(`Unknown currency: ${targetCurrency}, defaulting to USD`);
        return usdPrice;
    }

    const multiplier = REGIONAL_PRICING_MULTIPLIERS[targetCurrency];
    return Math.round(usdPrice * multiplier);
}

/**
 * Get regional price with automatic currency conversion
 * @param {number} baseUsdPrice - Base price in USD cents
 * @param {string} locale - User locale
 * @returns {Object} Formatted price with currency info
 */
function getRegionalPrice(baseUsdPrice, locale = DEFAULT_LOCALE) {
    const currency = getCurrencyForLocale(locale);
    const convertedPrice = convertCurrency(baseUsdPrice, currency);

    // Use BCP 47 locale format (e.g., en-US, fr-FR, ar-SA)
    const bcp47Locale = getBCP47Locale(locale);

    return {
        amount: convertedPrice,
        currency,
        formatted: formatCurrency(convertedPrice, bcp47Locale, currency),
        formattedWithoutSymbol: (convertedPrice / 100).toFixed(2),
    };
}

/**
 * Convert locale code to BCP 47 format
 * @param {string} locale - Simple locale code (e.g., 'en', 'es')
 * @returns {string} BCP 47 locale (e.g., 'en-US', 'es-ES')
 */
function getBCP47Locale(locale) {
    const localeMap = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        pt: "pt-BR",
        zh: "zh-CN",
        ja: "ja-JP",
        ko: "ko-KR",
        ar: "ar-SA",
        he: "he-IL",
        ru: "ru-RU",
        it: "it-IT",
    };
    return localeMap[locale] || "en-US";
}

/**
 * Format shipment delivery date with locale and timezone
 * @param {Date|string} date - Delivery date
 * @param {string} locale - User locale
 * @returns {string} Formatted date string
 */
function formatDeliveryDate(date, locale = DEFAULT_LOCALE) {
    const timezone = getTimezoneForLocale(locale);
    const bcp47Locale = getBCP47Locale(locale);
    return formatDate(date, bcp47Locale, timezone);
}

/**
 * Format shipment delivery time with locale and timezone
 * @param {Date|string} date - Delivery datetime
 * @param {string} locale - User locale
 * @returns {string} Formatted datetime string
 */
function formatDeliveryDateTime(date, locale = DEFAULT_LOCALE) {
    const timezone = getTimezoneForLocale(locale);
    const bcp47Locale = getBCP47Locale(locale);
    return formatDateTime(date, bcp47Locale, timezone);
}

/**
 * Format relative delivery time (e.g., "in 2 days", "3 hours ago")
 * @param {Date|string} date - Delivery date
 * @param {string} locale - User locale
 * @returns {string} Relative time string
 */
function formatRelativeDelivery(date, locale = DEFAULT_LOCALE) {
    const bcp47Locale = getBCP47Locale(locale);
    return formatRelativeTime(date, bcp47Locale);
}

/**
 * Format weight with locale-specific units
 * @param {number} weightKg - Weight in kilograms
 * @param {string} locale - User locale
 * @returns {Object} Formatted weight
 */
function formatWeight(weightKg, locale = DEFAULT_LOCALE) {
    const bcp47Locale = getBCP47Locale(locale);

    // US uses pounds, rest of world uses kilograms
    if (locale === "en") {
        const weightLbs = weightKg * 2.20462;
        return {
            value: weightLbs,
            unit: "lbs",
            formatted: `${formatNumber(weightLbs, bcp47Locale, { maximumFractionDigits: 2 })} lbs`,
        };
    }

    return {
        value: weightKg,
        unit: "kg",
        formatted: `${formatNumber(weightKg, bcp47Locale, { maximumFractionDigits: 2 })} kg`,
    };
}

/**
 * Format distance with locale-specific units
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} locale - User locale
 * @returns {Object} Formatted distance
 */
function formatDistance(distanceKm, locale = DEFAULT_LOCALE) {
    const bcp47Locale = getBCP47Locale(locale);

    // US uses miles, rest of world uses kilometers
    if (locale === "en") {
        const distanceMiles = distanceKm * 0.621371;
        return {
            value: distanceMiles,
            unit: "mi",
            formatted: `${formatNumber(distanceMiles, bcp47Locale, { maximumFractionDigits: 1 })} mi`,
        };
    }

    return {
        value: distanceKm,
        unit: "km",
        formatted: `${formatNumber(distanceKm, bcp47Locale, { maximumFractionDigits: 1 })} km`,
    };
}

/**
 * Get localized shipment status label
 * @param {string} status - Shipment status (e.g., 'IN_TRANSIT', 'DELIVERED')
 * @param {Function} t - Translation function from request
 * @returns {string} Localized status label
 */
function getLocalizedStatus(status, t) {
    return t(`shipments.statuses.${status}`);
}

/**
 * Initialize localization service
 */
function initializeLocalization() {
    try {
        logger.info("✓ Localization Service initialized successfully");
        logger.info(`  Default locale: ${DEFAULT_LOCALE}`);
        logger.info(`  Supported currencies: ${Object.keys(REGIONAL_PRICING_MULTIPLIERS).length}`);
        logger.info(`  Regional pricing enabled`);
    } catch (err) {
        logger.error("Failed to initialize Localization Service", { error: err.message });
        throw err;
    }
}

module.exports = {
    getCurrencyForLocale,
    getTimezoneForLocale,
    convertCurrency,
    getRegionalPrice,
    getBCP47Locale,
    formatDeliveryDate,
    formatDeliveryDateTime,
    formatRelativeDelivery,
    formatWeight,
    formatDistance,
    getLocalizedStatus,
    initializeLocalization,
};
