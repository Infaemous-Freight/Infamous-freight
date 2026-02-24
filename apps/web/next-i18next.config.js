// Phase 7 Tier 5: Next.js i18n Configuration
// Using next-i18next for React i18n support

const path = require('path');

module.exports = {
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'he', 'ru', 'it'],
        localeDetection: true,
        localePath: path.resolve('./public/locales'),
    },
    reloadOnPrerender: process.env.NODE_ENV === 'development',
    // Load all namespaces for all pages
    ns: ['common', 'auth', 'shipments', 'dashboard', 'gdpr', 'errors'],
    defaultNS: 'common',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
        escapeValue: false, // React already escapes
    },
    react: {
        useSuspense: false,
    },
};
