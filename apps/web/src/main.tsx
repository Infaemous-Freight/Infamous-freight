import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

const sentryDsn: string = import.meta.env.VITE_SENTRY_DSN ?? '';
const sentryEnabledEnv: string = import.meta.env.VITE_SENTRY_ENABLED ?? '';
const sentryEnvironment: string = import.meta.env.MODE;
const isProd = sentryEnvironment === 'production';

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

// Sentry is active when a DSN is present and not explicitly disabled.
// Set VITE_SENTRY_ENABLED=false to opt out even if a DSN is configured.
const sentryEnabled =
  isValidSentryDsn(sentryDsn) &&
  sentryEnabledEnv !== 'false' &&
  (isProd || sentryEnabledEnv === 'true');

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Capture 20% of transactions for performance monitoring.
    // Increase toward 1.0 in development / decrease in high-traffic production.
    tracesSampleRate: 0.2,
    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
