import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getLocaleFromRouter, t } from "../lib/i18n/t";

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          content="Infamous Freight Enterprises — AI Dispatch Operator + Avatars + Ops Intelligence."
        />
      </Head>

      {/* Skip link (a11y) */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="site-header">
        <nav aria-label="Primary" className="site-nav">
          <strong className="site-brand">{t(locale, "appName")}</strong>

          <div className="site-nav-links">
            <Link href="/" locale={locale} className="nav-link">
              Home
            </Link>
            <Link href="/product" locale={locale} className="nav-link">
              Product
            </Link>
            <Link href="/solutions" locale={locale} className="nav-link">
              Solutions
            </Link>
            <Link href="/pricing" locale={locale} className="nav-link">
              Pricing
            </Link>
            <Link href="/security" locale={locale} className="nav-link">
              Security
            </Link>
          </div>

          <span className="nav-actions">
            <Link href="/login" locale={locale} className="btn btn-tertiary">
              Request Demo
            </Link>
            <Link href="/signup" locale={locale} className="btn btn-secondary">
              Start Free
            </Link>
          </span>
        </nav>
      </header>

      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container">
          Global UX baseline: i18n (EN/ES), a11y skip-link, SEO defaults, locale
          formatting.
        </div>
      </footer>
    </>
  );
}
