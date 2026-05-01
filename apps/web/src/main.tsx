import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const sentryDsn: string = import.meta.env.VITE_SENTRY_DSN ?? '';
const sentryEnabledEnv: string = import.meta.env.VITE_SENTRY_ENABLED ?? '';
const sentryEnvironment: string = import.meta.env.MODE;
const isProd = import.meta.env.PROD;

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT ?? '';

if (adsenseClient) {
  const adsScript = document.createElement('script');
  adsScript.async = true;
  adsScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
  adsScript.crossOrigin = 'anonymous';
  document.head.appendChild(adsScript);
}


const isValidSentryDsn = (dsn: string): boolean => {
  if (!dsn || /<[^>]+>/.test(dsn)) {
    return false;
  }

  try {
    const parsed = new URL(dsn);
    const hasValidHost = /^o\d+\.ingest(?:\.[a-z0-9-]+)?\.sentry\.io$/.test(parsed.hostname);
    const hasProjectId = /^\/\d+$/.test(parsed.pathname);
    const hasPublicKey = parsed.username.length > 0;

    return parsed.protocol === 'https:' && hasValidHost && hasProjectId && hasPublicKey;
  } catch {
    return false;
  }
};

if (!isValidSentryDsn(sentryDsn) && sentryDsn.length > 0 && sentryEnabledEnv !== 'false') {
  console.warn('Sentry is disabled because VITE_SENTRY_DSN is not a valid ingest DSN.');
}

// Sentry only loads in production with a valid DSN, and is dynamically imported
// so the SDK does not ship in development bundles.
const sentryEnabled =
  isValidSentryDsn(sentryDsn) &&
  sentryEnabledEnv !== 'false' &&
  (isProd || sentryEnabledEnv === 'true');

if (sentryEnabled) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: sentryEnvironment,
      sendDefaultPii: false,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
