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
import "../src/styles/navigation.css";

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command/Ctrl + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[aria-label="Search"]');
        searchInput?.focus();
      }

      // Command/Ctrl + /: Open help widget
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        const helpButton = document.querySelector<HTMLButtonElement>('[aria-label="Help Center"]');
        helpButton?.click();
      }

      // Escape: Close modals/dropdowns
      if (e.key === "Escape") {
        const activeDropdown = document.querySelector('[aria-expanded="true"]');
        if (activeDropdown instanceof HTMLElement) {
          activeDropdown.click();
        }
      }

      // g then d: Go to dashboard
      if (e.key === "d" && document.body.dataset.lastKey === "g") {
        router.push("/dashboard");
        delete document.body.dataset.lastKey;
      }

      // g then h: Go home
      if (e.key === "h" && document.body.dataset.lastKey === "g") {
        router.push("/");
        delete document.body.dataset.lastKey;
      }

      // Track 'g' key for Vim-style navigation
      if (e.key === "g") {
        document.body.dataset.lastKey = "g";
        setTimeout(() => delete document.body.dataset.lastKey, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
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
