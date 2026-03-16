import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getLocaleFromRouter, t } from "../lib/i18n/t";
import NavigationBar from "./NavigationBar";
import Breadcrumb from "./Breadcrumb";
import HelpWidget from "./HelpWidget";
import KeyboardShortcuts from "./KeyboardShortcuts";

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = getLocaleFromRouter(router.locale);

  return (
    <>
      <Head>
        <title>{t(locale, "appName")}</title>
        <meta
          name="description"
          content="AI-powered freight management platform with avatars and operations intelligence."
        />
        <meta property="og:title" content={t(locale, "appName")} />
        <meta
          property="og:description"
          content="Infæmous Freight Enterprises — AI Dispatch Operator + Avatars + Ops Intelligence."
        />
      </Head>

      {/* Skip link (a11y) */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Enhanced Navigation Bar */}
      <NavigationBar />

      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container">
          Global UX baseline: i18n (EN/ES), a11y skip-link, SEO defaults, locale formatting.
        </div>
      </footer>

      {/* Floating Help Widget */}
      <HelpWidget />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts />
    </>
  );
}
