"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/design-tokens.css";
import "@/styles/modern-design-system.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <header className="site-header">
            <nav aria-label="Primary" className="site-nav">
              <strong className="site-brand">Infamous Freight</strong>
              <div className="site-nav-links">
                <Link href="/onboarding" className="nav-link">
                  Onboarding
                </Link>
                <Link href="/dispatch" className="nav-link">
                  Dispatch
                </Link>
                <Link href="/pricing" className="nav-link">
                  Pricing
                </Link>
              </div>
            </nav>
          </header>
          <main id="main" tabIndex={-1} style={{ outline: "none" }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
