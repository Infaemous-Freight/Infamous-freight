import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import GlobalLayout from "../components/GlobalLayout";
import { initDatadogRUM } from "../src/lib/datadog";

export default function App({ Component, pageProps }: AppProps) {
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  // Initialize Datadog RUM on app mount
  useEffect(() => {
    if (isProduction) {
      initDatadogRUM();
    }
  }, [isProduction]);

  return (
    <GlobalLayout>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </GlobalLayout>
  );
}
