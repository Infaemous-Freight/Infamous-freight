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
      <a
        href="#main"
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          padding: 10,
          background: "white",
          border: "2px solid rgba(255,0,0,0.7)",
          borderRadius: 10,
        }}
        onFocus={(e) => {
          (e.target as HTMLAnchorElement).style.left = "12px";
        }}
        onBlur={(e) => {
          (e.target as HTMLAnchorElement).style.left = "-9999px";
        }}
      >
        Skip to content
      </a>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid rgba(255,0,0,0.20)",
        }}
      >
        <nav
          aria-label="Primary"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <strong style={{ color: "rgb(180,0,0)" }}>
            {t(locale, "appName")}
          </strong>

          <Link
            href="/settings/avatar"
            locale={locale}
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,0,0,0.25)",
            }}
          >
            {t(locale, "nav.avatar")}
          </Link>

          <Link
            href="/genesis"
            locale={locale}
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,0,0,0.25)",
            }}
          >
            {t(locale, "nav.genesis")}
          </Link>

          <Link
            href="/ops"
            locale={locale}
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,0,0,0.25)",
            }}
          >
            {t(locale, "nav.ops")}
          </Link>

          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Link
              href={router.asPath}
              locale="en"
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,0,0,0.25)",
                opacity: locale === "en" ? 1 : 0.6,
              }}
            >
              EN
            </Link>
            <Link
              href={router.asPath}
              locale="es"
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,0,0,0.25)",
                opacity: locale === "es" ? 1 : 0.6,
              }}
            >
              ES
            </Link>
          </span>
        </nav>
      </header>

      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>

      <footer
        style={{
          borderTop: "1px solid rgba(255,0,0,0.20)",
          marginTop: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: 16,
            opacity: 0.75,
            fontSize: 12,
          }}
        >
          Global UX baseline: i18n (EN/ES), a11y skip-link, SEO defaults, locale
          formatting.
        </div>
      </footer>

      {/* Focus style */}
      <style jsx global>{`
        :focus-visible {
          outline: 3px solid rgba(255, 0, 0, 0.55);
          outline-offset: 2px;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
