/**
 * Web Bundle Optimization Guide
 *
 * Target metrics:
 * - First Load JS: < 150KB
 * - Total bundle: < 500KB
 * - LCP: < 2.5s
 * - FID: < 100ms
 * - CLS: < 0.1
 */

import dynamic from "next/dynamic";
import React from "react";
import type { AppProps } from "next/app";

// ✅ Code splitting: Dynamic imports for heavy components
// apps/web/pages/dashboard.tsx
const ShipmentChart = dynamic(() => import("../components/ShipmentChart"), {
  loading: () => React.createElement("div", { className: "skeleton" }),
  ssr: false,
});

const ReportGenerator = dynamic(() => import("../components/ReportGenerator"), {
  loading: () => React.createElement("div", null, "Loading report generator..."),
});

void ShipmentChart;
void ReportGenerator;

// ✅ Tree-shaking: Export named exports instead of default
// apps/web/lib/utils.ts
export const formatDate = (date: Date) => date.toLocaleDateString();
export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
export const sanitizeEmail = (email: string) => email.toLowerCase().trim();

// Consumers can then import only what they need:
// import { formatDate } from '../lib/utils';

// ✅ Compression: Enable gzip in next.config.mjs
// next.config.mjs
/** @type {import('next').NextConfig} */
const config = {
  compress: true,
  swcMinify: true,
  reactStrictMode: true,
  optimizeFonts: true,
  experimental: {
    esmExternals: true,
    isrMemoryCacheSize: 52 * 1024 * 1024, // 52MB
  },
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
};

// ✅ Image optimization: Use next/image everywhere
// apps/web/components/ShipmentCard.tsx
import Image from "next/image";

interface Shipment {
  id: string;
  trackingId: string;
  image?: string;
}

interface ShipmentCardProps {
  shipment: Shipment;
}

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  return React.createElement(
    "div",
    null,
    shipment.image &&
      React.createElement(Image, {
        src: shipment.image,
        alt: `Shipment ${shipment.id}`,
        width: 400,
        height: 300,
        priority: false,
        placeholder: "blur",
      }),
    React.createElement("h3", null, shipment.trackingId),
  );
}

// ✅ Route-based code splitting (automatic in Next.js)
// Each route automatically gets its own bundle chunk:
// - pages/dashboard -> dashboard.js
// - pages/shipments -> shipments.js
// - pages/billing -> billing.js

// ✅ Lazy load expensive libraries
// apps/web/lib/chartLibrary.ts
export async function loadChartLibrary(): Promise<typeof import("recharts")> {
  return import("recharts");
}

// ✅ Preload critical resources in _app.tsx
// apps/web/pages/_app.tsx
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Head,
      null,
      React.createElement("link", {
        rel: "preload",
        href: "/fonts/inter.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      }),
      React.createElement("link", {
        rel: "preconnect",
        href: "https://infamous-freight-api.fly.dev",
      }),
      React.createElement("link", {
        rel: "dns-prefetch",
        href: "https://cdn.stripe.com",
      }),
    ),
    React.createElement(Component, pageProps),
  );
}

// ✅ Run bundle analyzer
// ANALYZE=true pnpm --filter web build

// ✅ Monitor with Lighthouse CI (configured in .lighthouserc.json)
// Results tracked in .github/workflows/lighthouse-ci.yml

module.exports = {
  config,
};
