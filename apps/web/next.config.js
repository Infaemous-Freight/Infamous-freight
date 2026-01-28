import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import nextPWA from "next-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
    rootDirectory: path.join(__dirname, "..", "..")
  },
  turbo: {
    rootDirectory: path.join(__dirname, "..", "..")
  },
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en"
  },
  experimental: {
    serverActions: true
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

export default withPWA(nextConfig);
