/**
 * Internationalization (i18n) Configuration
 * Supports 10 languages for global reach
 * @module config/i18n
 */

const i18nConfig = {
    defaultLanguage: "en",
    supportedLanguages: [
        "en", // English (US)
        "es", // Spanish (Latin America)
        "fr", // French (France)
        "de", // German (Germany)
        "zh", // Simplified Chinese
        "ja", // Japanese
        "pt", // Portuguese (Brazil)
        "ar", // Arabic
        "ru", // Russian
        "hi", // Hindi (India)
    ],

    // Language-specific configs
    translations: {
        en: {
            language: "English",
            region: "United States",
            timezone: "America/New_York",
            currency: "USD",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
        },
        es: {
            language: "Español",
            region: "América Latina",
            timezone: "America/Mexico_City",
            currency: "MXN",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "24h",
        },
        fr: {
            language: "Français",
            region: "France",
            timezone: "Europe/Paris",
            currency: "EUR",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "24h",
        },
        de: {
            language: "Deutsch",
            region: "Deutschland",
            timezone: "Europe/Berlin",
            currency: "EUR",
            dateFormat: "DD.MM.YYYY",
            timeFormat: "24h",
        },
        zh: {
            language: "简体中文",
            region: "中国",
            timezone: "Asia/Shanghai",
            currency: "CNY",
            dateFormat: "YYYY/MM/DD",
            timeFormat: "24h",
        },
        ja: {
            language: "日本語",
            region: "日本",
            timezone: "Asia/Tokyo",
            currency: "JPY",
            dateFormat: "YYYY/MM/DD",
            timeFormat: "24h",
        },
        pt: {
            language: "Português",
            region: "Brasil",
            timezone: "America/Sao_Paulo",
            currency: "BRL",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "24h",
        },
        ar: {
            language: "العربية",
            region: "السعودية",
            timezone: "Asia/Riyadh",
            currency: "SAR",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "24h",
            direction: "rtl",
        },
        ru: {
            language: "Русский",
            region: "Россия",
            timezone: "Europe/Moscow",
            currency: "RUB",
            dateFormat: "DD.MM.YYYY",
            timeFormat: "24h",
        },
        hi: {
            language: "हिन्दी",
            region: "भारत",
            timezone: "Asia/Kolkata",
            currency: "INR",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "24h",
        },
    },

    // Get language config
    getLanguageConfig: function (langCode) {
        return (
            this.translations[langCode] ||
            this.translations[this.defaultLanguage]
        );
    },

    // Validate language
    isSupported: function (langCode) {
        return this.supportedLanguages.includes(langCode);
    },

    // Get user language from Accept-Language header
    detectLanguage: function (acceptLanguageHeader) {
        if (!acceptLanguageHeader) return this.defaultLanguage;

        const preferred = acceptLanguageHeader
            .split(",")[0]
            .split("-")[0]
            .toLowerCase();

        return this.isSupported(preferred) ? preferred : this.defaultLanguage;
    },
};

module.exports = i18nConfig;
