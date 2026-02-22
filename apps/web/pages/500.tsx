import Head from "next/head";
import Link from "next/link";

export default function Custom500(): React.ReactElement {
  return (
    <>
      <Head>
        <title>500 - Server Error | Infamous Freight Enterprises</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-9xl font-bold text-red-400 mb-4">500</h1>
          <h2 className="text-4xl font-bold text-white mb-6">Server Error</h2>
          <p className="text-xl text-slate-300 mb-8">
            Oops! Something went wrong on our end. Our team has been notified and we're working to
            fix it.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Go Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
          <div className="mt-12 p-6 bg-slate-800 rounded-lg text-left">
            <h3 className="text-white font-semibold mb-2">What you can do:</h3>
            <ul className="text-slate-300 space-y-2 text-sm">
              <li>• Refresh the page and try again</li>
              <li>• Clear your browser cache and cookies</li>
              <li>• Try accessing the page in a few minutes</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
