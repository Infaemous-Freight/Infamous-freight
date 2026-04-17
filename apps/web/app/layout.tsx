import type { Metadata, Viewport } from "next";
import "./globals.css";
import WebVitalsReporter from "../components/WebVitalsReporter";

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
  openGraph: {
    type: "website",
    siteName: "Infæmous Freight",
  },
};

// Mobile-first viewport. Without this, App Router pages render at desktop width
// on phones, which blocks LCP and breaks layout for drivers on cellular.
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
    <html lang="en">
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
