import { withSentryConfig } from '@sentry/nextjs';

// Netlify deploys go through @netlify/plugin-nextjs, which requires a
// standard Next.js server build (not `output: 'export'`). Only force a
// static export for explicit static-hosting targets.
const isStaticHosting =
    process.env.BUILD_TARGET === 'firebase' ||
    process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // turbopack: {},  // Disabled for static export compatibility
    typescript: {
        // Allow temporary TypeScript error bypass via env flag
        ignoreBuildErrors: process.env.ALLOW_WEB_TS_ERRORS === 'true',
    },
    reactStrictMode: true,
    // Static hosting targets require export output
    output: isStaticHosting ? 'export' : 'standalone',
    compress: true,
    poweredByHeader: false,
    trailingSlash: false,

    // Phase 7 Tier 5: Internationalization (i18n)
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'he', 'ru', 'it'],
        localeDetection: true,
    },

    // Enable instrumentation hook for Sentry
    experimental: {
        instrumentationHook: true,
        serverActions: {
            bodySizeLimit: '2mb'
        }
    },

    // Performance Optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Image optimization
    images: {
        // Disable optimization for static export targets
        unoptimized: isStaticHosting,
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        // Remote patterns for optimized external images
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'infamous-freight-api.fly.dev',
                pathname: '/api/uploads/**',
            },
            // Production backend on app.infamousfreight.com
            {
                protocol: 'https',
                hostname: 'app.infamousfreight.com',
                pathname: '/api/uploads/**',
            },
        ],
    },

    // Bundle optimization
    webpack: (config, { isServer }) => {
        // Code splitting optimization
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Core vendor chunk (React, Next.js essentials)
                        core: {
                            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
                            name: 'core-vendors',
                            priority: 20,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                        // Stripe and payment vendors
                        payments: {
                            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
                            name: 'payment-vendors',
                            priority: 15,
                            reuseExistingChunk: true,
                        },
                        // Chart libraries (recharts)
                        charts: {
                            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
                            name: 'chart-vendors',
                            priority: 10,
                            reuseExistingChunk: true,
                        },
                        // All other vendors
                        commons: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'common-vendors',
                            priority: 5,
                            minChunks: 2,
                            reuseExistingChunk: true,
                        },
                        // Shared app components
                        shared: {
                            minChunks: 2,
                            priority: 3,
                            reuseExistingChunk: true,
                            name(module, chunks) {
                                const hash = require('crypto')
                                    .createHash('sha1')
                                    .update(chunks.map((c) => c.name).join('_'))
                                    .digest('hex');
                                return `shared-${hash.substring(0, 8)}`;
                            },
                        },
                    },
                },
            };
        }
        return config;
    },
};

export default withSentryConfig(nextConfig, {
    // For an instrumentation hook to work, you must enable the `instrumentationHook` setting
    org: 'infamous-freight-enterprise',
    project: 'javascript-nextjs',

    // An auth token is required for uploading source maps.
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    silent: false, // Changed to false for better debugging during build

    // Enable tunnel route to bypass ad blockers (CRITICAL for production)
    // This creates a /monitoring route that proxies Sentry events
    tunnelRoute: '/monitoring',

    // Uploads source maps to Sentry for native debugging
    sourceMaps: {
        disable: false,
        deleteSourcemapsAfterUpload: true,
        rewriteSourcesContent: process.env.NODE_ENV === 'development' ? true : false,
    },

    // Widens the URL prefix the rewrite rule matches on, preventing consecutive slashes in the tunneled request URL. Defaults to false.
    widenClientFileUpload: false,

    // Routes browser requests to Sentry through a Next.js rewrite instead of directing to Sentry's servers directly. Prevents ad blockers from blocking Sentry requests. Defaults to true.
    hideSourceMaps: true,

    // Release tracking configuration
    release: {
        name: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
        dist: process.env.VERCEL_ENV || 'development',
    },

    // Additional Sentry CLI options
    url: 'https://sentry.io/',
});
