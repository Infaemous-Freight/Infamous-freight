/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone', // Enable standalone output for Docker/Fly.io
    compress: true,
    poweredByHeader: false,

    // Experimental: Edge runtime for geolocation
    experimental: {
        serverActions: true,
    },

    // Performance Optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Image optimization
    images: {
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

export default nextConfig;
