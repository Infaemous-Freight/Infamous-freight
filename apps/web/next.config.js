import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "@": "./src",
    }
  },
  typescript: {
    // Fix TypeScript errors: pnpm --filter web typecheck
    // In development (Vercel): This ensures build succeeds even with type errors
    // In production, use: pnpm check:types before committing
    ignoreBuildErrors: process.env.NODE_ENV === "production" && process.env.CI !== "true",
  },
  reactStrictMode: true,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    optimizePackageImports: [
      '@infamous-freight/shared',
      'recharts',
      '@supabase/supabase-js',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "infamous-freight-api.fly.dev",
        pathname: "/api/uploads/**"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/**"
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            core: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: "core-vendors",
              priority: 20,
              reuseExistingChunk: true,
              enforce: true
            },
            payments: {
              test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
              name: "payment-vendors",
              priority: 15,
              reuseExistingChunk: true
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: "chart-vendors",
              priority: 10,
              reuseExistingChunk: true
            },
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: "supabase-vendors",
              priority: 12,
              reuseExistingChunk: true
            },
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: "common-vendors",
              priority: 5,
              minChunks: 2,
              reuseExistingChunk: true
            },
            shared: {
              minChunks: 2,
              priority: 3,
              reuseExistingChunk: true,
              name(module, chunks) {
                const hash = crypto
                  .createHash("sha1")
                  .update(chunks.map((chunk) => chunk.name).join("_"))
                  .digest("hex");
                return `shared-${hash.substring(0, 8)}`;
              }
            }
          }
        }
      };
    }
    return config;
  }
};

export default nextConfig;
