import dotenv from 'dotenv';
import express from 'express';
import { createApp } from './app';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.Database_URL ?? process.env.database_url ?? '';
}

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const vercelRedirectTarget =
  process.env.VERCEL_REDIRECT_TARGET ??
  (process.env.VERCEL === '1' ? 'https://www.infamousfreight.com/' : '');

if (vercelRedirectTarget) {
  const redirectApp = express();

  redirectApp.use((_req, res) => {
    res.redirect(308, vercelRedirectTarget);
  });

  redirectApp.listen(port, host, () => {
    console.log(`Redirect server listening on ${host}:${port} -> ${vercelRedirectTarget}`);
  });
} else {
  try {
    const app = createApp();
    app.listen(port, host, () => {
      console.log(`Infamous Freight API listening on ${host}:${port}`);
    });
  } catch (error) {
    const startupError = error instanceof Error ? error.message : 'unknown_startup_error';
    // Log the underlying error server-side only. Do not return it to clients
    // in the /health response body to avoid leaking config or stack details.
    console.error(`API startup failed: ${startupError}`);

    const fallback = express();

    const degradedResponse = () => ({
      status: 'degraded' as const,
      error: 'api_startup_failed',
      message: 'API failed to start. Check server logs for details.',
      timestamp: new Date().toISOString(),
    });

    fallback.get('/health', (_req, res) => {
      res.status(503).json(degradedResponse());
    });

    fallback.get('/api/health', (_req, res) => {
      res.status(503).json(degradedResponse());
    });

    fallback.listen(port, host, () => {
      console.log(`Fallback health server listening on ${host}:${port}`);
    });
  }
}
