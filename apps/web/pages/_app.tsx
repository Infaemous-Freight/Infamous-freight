import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import GlobalLayout from "../components/GlobalLayout";
import { initDatadogRUM } from "../src/lib/datadog";
import { initSentry } from "../src/lib/sentry.client.config";
import { AuthProvider } from "../src/context/AuthContext";
import "../src/styles/design-system.css";
import "../src/styles/tokens.css";
import "../src/styles/god-mode.css";

// Initialize Sentry on app load (before any errors can occur)
if (typeof window !== "undefined") {
  initSentry();
}

export default function App({ Component, pageProps }: AppProps) {
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  // Initialize Datadog RUM on app mount
  useEffect(() => {
    if (isProduction) {
      const hasDDConfig =
        !!process.env.NEXT_PUBLIC_DD_APP_ID &&
        !!process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN &&
        !!process.env.NEXT_PUBLIC_DD_SITE;
      if (hasDDConfig) {
        initDatadogRUM();
      } else {
        // Avoid client-side errors when env is missing; log once in dev tools
        console.warn("Datadog RUM not initialized: missing NEXT_PUBLIC_DD_* configuration");
      }
    }
  }, [isProduction]);

  return (
    <AuthProvider>
      <GlobalLayout>
        <Component {...pageProps} />
        <Analytics />
        {isProduction ? <SpeedInsights /> : null}
      </GlobalLayout>
    </AuthProvider>
  );
}
