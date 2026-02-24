/**
 * Phase 7 Tier 5: Internationalization (i18n) Middleware
 * 
 * Detects user locale from:
 * 1. Query parameter: ?locale=es
 * 2. Request header: Accept-Language
 * 3. JWT token (user.locale)
 * 4. Cookie: locale=fr
 * 5. Default: en
 * 
 * Attaches locale context to request object and provides translation functions.
 */

const { SUPPORTED_LOCALES, DEFAULT_LOCALE, RTL_LOCALES } = require("@infamous-freight/shared");
const { parseAcceptLanguage } = require("@infamous-freight/shared");
const logger = require("./logger");

// In-memory translation cache
const translations = new Map();

/**
 * Load translations for a specific locale
 * @param {string} locale - Locale code (e.g., 'en', 'es')
 * @returns {Object} Translation object
 */
function loadTranslations(locale) {
    if (translations.has(locale)) {
        return translations.get(locale);
    }

    try {
        // Load from file system
        const fs = require("fs");
        const path = require("path");
        const localesDir = path.join(__dirname, "..", "locales");
        const filePath = path.join(localesDir, `${locale}.json`);

        if (!fs.existsSync(filePath)) {
            logger.warn(`Translation file not found for locale: ${locale}, falling back to ${DEFAULT_LOCALE}`);
            return loadTranslations(DEFAULT_LOCALE);
        }

        const data = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(data);
        translations.set(locale, parsed);
        return parsed;
    } catch (err) {
        logger.error(`Failed to load translations for locale: ${locale}`, { error: err.message });
        return translations.get(DEFAULT_LOCALE) || {};
    }
}

/**
 * Get nested translation value by key path
 * @param {Object} obj - Translation object
 * @param {string} path - Dot-notation key path (e.g., 'errors.notFound')
 * @returns {string|undefined} Translation value
 */
function getByPath(obj, path) {
    const keys = path.split(".");
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
            result = result[key];
        } else {
            return undefined;
        }
    }
    return result;
}

/**
 * Translation function with variable interpolation
 * @param {Object} translations - Translation object
 * @param {string} locale - Current locale
 * @param {string} key - Translation key (e.g., 'greeting', 'errors.notFound')
 * @param {Object} vars - Variables for interpolation (e.g., { name: 'John' })
 * @returns {string} Translated string
 */
function translate(translations, locale, key, vars = {}) {
    let text = getByPath(translations, key) || key;

    // Interpolate variables (e.g., "Hello {{name}}" -> "Hello John")
    if (typeof text === "string") {
        Object.keys(vars).forEach((varKey) => {
            const placeholder = new RegExp(`{{\\s*${varKey}\\s*}}`, "g");
            text = text.replace(placeholder, String(vars[varKey]));
        });
    }

    return text;
}

/**
 * Middleware: Detect and attach locale to request
 * Usage: app.use(detectLocale)
 */
function detectLocale(req, res, next) {
    let locale = DEFAULT_LOCALE;

    // Priority 1: Query parameter (?locale=es)
    if (req.query.locale && Object.values(SUPPORTED_LOCALES).includes(req.query.locale)) {
        locale = req.query.locale;
    }
    // Priority 2: Cookie (locale=fr)
    else if (req.cookies?.locale && Object.values(SUPPORTED_LOCALES).includes(req.cookies.locale)) {
        locale = req.cookies.locale;
    }
    // Priority 3: JWT token (user.locale)
    else if (req.user?.locale && Object.values(SUPPORTED_LOCALES).includes(req.user.locale)) {
        locale = req.user.locale;
    }
    // Priority 4: Accept-Language header
    else if (req.headers["accept-language"]) {
        locale = parseAcceptLanguage(
            req.headers["accept-language"],
            Object.values(SUPPORTED_LOCALES),
            DEFAULT_LOCALE,
        );
    }

    // Attach locale context to request
    req.locale = locale;
    req.isRTL = RTL_LOCALES.includes(locale);

    // Load translations for this locale
    const localeTranslations = loadTranslations(locale);

    // Attach translation function to request
    req.t = (key, vars = {}) => translate(localeTranslations, locale, key, vars);

    // Set Content-Language header in response
    res.setHeader("Content-Language", locale);

    logger.debug(`Request locale detected: ${locale}`, {
        path: req.path,
        method: req.method,
    });

    next();
}

/**
 * Middleware: Require specific locale
 * Usage: router.get('/es-only', requireLocale('es'), handler)
 */
function requireLocale(requiredLocale) {
    return (req, res, next) => {
        if (req.locale !== requiredLocale) {
            return res.status(403).json({
                success: false,
                error: req.t("errors.localeNotAllowed", { locale: requiredLocale }),
            });
        }
        next();
    };
}

/**
 * Middleware: Set locale cookie
 * Usage: router.post('/locale', setLocaleCookie)
 */
function setLocaleCookie(req, res, next) {
    const { locale } = req.body;

    if (!locale || !Object.values(SUPPORTED_LOCALES).includes(locale)) {
        return res.status(400).json({
            success: false,
            error: req.t("errors.invalidLocale"),
        });
    }

    // Set cookie for 1 year
    res.cookie("locale", locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.json({
        success: true,
        message: req.t("messages.localeUpdated"),
        data: { locale },
    });
}

/**
 * Get all supported locales with metadata
 * Usage: GET /api/locales
 */
function getSupportedLocales(req, res) {
    const locales = Object.entries(SUPPORTED_LOCALES).map(([key, code]) => ({
        code,
        name: req.t(`locales.${code}`),
        nativeName: getLocaleName(code),
        isRTL: RTL_LOCALES.includes(code),
    }));

    res.json({
        success: true,
        data: {
            locales,
            current: req.locale,
            default: DEFAULT_LOCALE,
        },
    });
}

/**
 * Get native name for locale
 * @param {string} locale - Locale code
 * @returns {string} Native locale name
 */
function getLocaleName(locale) {
    const names = {
        en: "English",
        es: "Español",
        fr: "Français",
        de: "Deutsch",
        pt: "Português",
        zh: "中文",
        ja: "日本語",
        ko: "한국어",
        ar: "العربية",
        he: "עברית",
        ru: "Русский",
        it: "Italiano",
    };
    return names[locale] || locale;
}

/**
 * Initialize translations on server startup
 */
function initializeI18n() {
    try {
        // Preload default locale
        loadTranslations(DEFAULT_LOCALE);
        logger.info(`✓ i18n initialized with default locale: ${DEFAULT_LOCALE}`);
        logger.info(`  Supported locales: ${Object.values(SUPPORTED_LOCALES).join(", ")}`);
    } catch (err) {
        logger.error("Failed to initialize i18n", { error: err.message });
        throw err;
    }
}

module.exports = {
    detectLocale,
    requireLocale,
    setLocaleCookie,
    getSupportedLocales,
    initializeI18n,
    loadTranslations,
    translate,
};
