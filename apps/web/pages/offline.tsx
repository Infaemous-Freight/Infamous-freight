import { useEffect, useState } from "react";
import Head from "next/head";

export default function OfflinePage(): React.ReactElement {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Redirect to home when connection is restored
      window.location.href = "/";
    }
  }, [isOnline]);

  return (
    <>
      <Head>
        <title>Offline | Infæmous Freight Enterprises</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">You're Offline</h1>
          <p className="text-xl text-slate-300 mb-8">
            It looks like you've lost your internet connection. Some features may be unavailable
            until you're back online.
          </p>
          <div className="bg-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-white font-semibold mb-4">What you can do:</h2>
            <ul className="text-slate-300 space-y-2 text-left">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Check your internet connection</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Try disabling airplane mode if it's on</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Restart your router or modem</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Contact your internet service provider</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <p className="mt-4 text-sm text-slate-400">
            This page will automatically refresh when your connection is restored
          </p>
        </div>
      </div>
    </>
  );
}
