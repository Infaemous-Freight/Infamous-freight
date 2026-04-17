import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "Infæmous Freight | Dispatcher",
    template: "%s | Infæmous Freight",
  },
  description:
    "AI-powered freight operations platform for dispatch, fleet intelligence, and shipment visibility.",
  // Primary frontend domain is www.infamousfreight.com (Netlify).
  // Set NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com in Netlify env vars.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infamousfreight.com",
  ),
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    siteName: "Infæmous Freight",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            var registerServiceWorker = function () {
              navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch(function () {});
            };

            if (document.readyState === 'complete') {
              registerServiceWorker();
            } else {
              window.addEventListener('load', registerServiceWorker);
            }
          }`}
        </Script>
      </body>
    </html>
  );
}
