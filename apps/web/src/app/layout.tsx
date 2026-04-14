import React from "react";
import type { Metadata } from "next";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: { default: "Infamous Freight Enterprises", template: "%s | Infamous Freight" },
  description: "AI-powered freight and logistics automation platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
        }}
      >
        <Nav />
        {children}
      </body>
    </html>
  );
}
