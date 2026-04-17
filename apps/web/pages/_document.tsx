import { Html, Head, Main, NextScript } from "next/document";
import { getOrganizationData, getWebSiteData, StructuredData } from "../lib/structured-data";

export default function Document(): React.ReactElement {
  return (
    <Html lang="en">
      <Head>
        {/* Structured Data for SEO */}
        <StructuredData data={getOrganizationData()} />
        <StructuredData data={getWebSiteData()} />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0b0f19" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Infamous Freight" />

        {/* Fonts and Performance
            Load Google Fonts via <link> (not CSS @import) so the stylesheet
            is discovered immediately by the preload scanner instead of being
            chained behind another CSS file. Pairing preconnect hints for
            googleapis.com (the CSS) and gstatic.com (the WOFF2 payloads)
            removes a DNS+TLS round trip for the font files themselves.
            `display=swap` keeps text visible on fallbacks while webfonts load. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
        />
        <link rel="dns-prefetch" href="https://api.fly.dev" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
