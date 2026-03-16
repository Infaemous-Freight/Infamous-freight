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
        <meta name="apple-mobile-web-app-title" content="Infæmous Freight" />

        {/* Fonts and Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
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
