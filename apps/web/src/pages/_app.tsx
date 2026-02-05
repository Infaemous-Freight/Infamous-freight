import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";
import GlobalLayout from "../components/GlobalLayout";
import { initDatadogRUM } from "../src/lib/datadog";
import SentryErrorBoundary from "../components/SentryErrorBoundary";
import { AuthProvider } from "../src/context/AuthContext";
// Modern Design System (New)
import "../src/styles/design-tokens.css";
import "../src/styles/modern-design-system.css";

// Legacy styles (can be removed after migration)
// import "../src/styles/design-system.css";
// import "../src/styles/tokens.css";
// import "../src/styles/god-mode.css";

// Initialize Sentry is handled by next.config.mjs automatically
// No manual initialization needed here

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  // Initialize monitoring on app mount
  useEffect(() => {
    // Track route changes
    const handleRouteChange = (url: string) => {
      Sentry.addBreadcrumb({
        message: `Navigated to ${url}`,
        category: "navigation",
        level: "info",
      });
    };

    router.events.on("routeChangeStart", handleRouteChange);

    // Track page views
    const handleRouteComplete = (url: string) => {
      Sentry.captureMessage(`Page View: ${url}`, "info");
    };

    router.events.on("routeChangeComplete", handleRouteComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
      router.events.off("routeChangeComplete", handleRouteComplete);
    };
  }, [router]);

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
        // eslint-disable-next-line no-console
        console.warn("Datadog RUM not initialized: missing NEXT_PUBLIC_DD_* configuration");
      }
    }
  }, [isProduction]);

  return (
    <SentryErrorBoundary>
      <AuthProvider>
        <GlobalLayout>
          <Component {...pageProps} />
          <Analytics />
          {isProduction ? <SpeedInsights /> : null}
        </GlobalLayout>
      </AuthProvider>
    </SentryErrorBoundary>
  );
}
