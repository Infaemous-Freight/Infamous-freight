import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Infæmous Freight | Dispatcher",
    template: "%s | Infæmous Freight",
  },
  description:
    "AI-powered freight operations platform for dispatch, fleet intelligence, and shipment visibility.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://infamousfreight.com",
  ),
  openGraph: {
    type: "website",
    siteName: "Infæmous Freight",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
