import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Custom404() {
  useEffect(() => {
    // Track 404 errors in Sentry
    Sentry.captureMessage("404 - Page Not Found", {
      level: "warning",
      tags: {
        type: "404",
      },
      extra: {
        url: window.location.href,
        referrer: document.referrer,
      },
    });
  }, []);

  return (
    <>
      <Head>
        <title>404 - Page Not Found | Infamous Freight Enterprises</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-9xl font-bold text-blue-400 mb-4">404</h1>
          <h2 className="text-4xl font-bold text-white mb-6">Page Not Found</h2>
          <p className="text-xl text-slate-300 mb-8">
            Sorry, we couldn't find the page you're looking for. The page may have been moved or
            deleted.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/solutions"
              className="inline-block px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Solutions
            </Link>
          </div>
          <div className="mt-12 text-slate-400">
            <p className="text-sm">
              Need help?{" "}
              <Link href="/docs" className="text-blue-400 hover:underline">
                Check our documentation
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
