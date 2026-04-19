import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import * as Sentry from "@sentry/nextjs";
import { appWithTranslation } from "next-i18next/pages";
import GlobalLayout from "../components/GlobalLayout";
import { initDatadogRUM } from "../src/lib/datadog";
import SentryErrorBoundary from "../components/SentryErrorBoundary";
import { AuthProvider } from "../src/context/AuthContext";
// Modern Design System (New)
import "../src/styles/design-tokens.css";
import "../src/styles/modern-design-system.css";
import "../src/styles/navigation.css";
// Phase 7 Tier 5: RTL Support
import "../src/styles/rtl.css";

// Legacy styles (can be removed after migration)
// import "../src/styles/design-system.css";
// import "../src/styles/tokens.css";
// import "../src/styles/god-mode.css";

// Initialize Sentry is handled by next.config.mjs automatically
// No manual initialization needed here

// RTL Locales (Arabic, Hebrew)
const RTL_LOCALES = ["ar", "he"];

function App({ Component, pageProps }: AppProps): React.ReactElement {
  const router = useRouter();
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";
  const gaMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const gaEnabled = Boolean(isProduction && gaMeasurementId);

  // Phase 7 Tier 5: Set document direction based on locale
  useEffect(() => {
    const locale = router.locale || "en";
    const isRTL = RTL_LOCALES.includes(locale);

    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = locale;

    // Update HTML class for RTL-specific styling
    if (isRTL) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [router.locale]);

  // Initialize monitoring on app mount
  useEffect(() => {
    // Track route changes as breadcrumbs only; sending a Sentry event per
    // navigation created avoidable network + CPU work on mobile.
    const handleRouteChange = (url: string) => {
      Sentry.addBreadcrumb({
        message: `Navigated to ${url}`,
        category: "navigation",
        level: "info",
      });
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  // Track page views with Google Analytics (GA4)
  useEffect(() => {
    if (!gaEnabled || !gaMeasurementId) return;

    const trackPageView = (url: string) => {
      const gtag = (window as typeof window & {
        gtag?: (command: string, targetId: string, params: Record<string, unknown>) => void;
      }).gtag;

      if (!gtag) return;
      gtag("config", gaMeasurementId, { page_path: url });
    };

    router.events.on("routeChangeComplete", trackPageView);
    return () => router.events.off("routeChangeComplete", trackPageView);
  }, [gaEnabled, gaMeasurementId, router.events]);

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
    // @ts-ignore - Sentry ErrorBoundary type incompatibility with React 19
    <SentryErrorBoundary>
      {gaEnabled ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      ) : null}
      <AuthProvider>
        <GlobalLayout>
          <Component {...pageProps} />
        </GlobalLayout>
      </AuthProvider>
    </SentryErrorBoundary>
  );
}

// Phase 7 Tier 5: Wrap with i18next translation provider
export default appWithTranslation(App);
