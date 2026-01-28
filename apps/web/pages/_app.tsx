import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import GlobalLayout from "../components/GlobalLayout";
import { GodModeProvider } from "../components/god/GodModeProvider";
import { initDatadogRUM } from "../src/lib/datadog";
import "../src/styles/tailwind.css";
import "../src/styles/design-system.css";
import "../src/styles/tokens.css";

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
        console.warn(
          "Datadog RUM not initialized: missing NEXT_PUBLIC_DD_* configuration",
        );
      }
    }
  }, [isProduction]);

  return (
    <GodModeProvider>
      <GlobalLayout>
        <Component {...pageProps} />
        <Analytics />
        {isProduction ? <SpeedInsights /> : null}
      </GlobalLayout>
    </GodModeProvider>
  );
}
