import dotenv from 'dotenv';
import express from 'express';
import { createApp } from './app';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.Database_URL ?? process.env.database_url ?? '';
}

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`Infamous Freight API listening on ${host}:${port}`);
  });
} catch (error) {
  const startupError = error instanceof Error ? error.message : 'unknown_startup_error';
  console.error(`API startup failed: ${startupError}`);

  const fallback = express();

  fallback.get('/health', (_req, res) => {
    res.status(503).json({
      status: 'degraded',
      error: 'api_startup_failed',
      message: startupError,
      timestamp: new Date().toISOString(),
    });
  });

  fallback.get('/api/health', (_req, res) => {
    res.status(503).json({
      status: 'degraded',
      error: 'api_startup_failed',
      message: startupError,
      timestamp: new Date().toISOString(),
    });
  });

  fallback.listen(port, host, () => {
    console.log(`Fallback health server listening on ${host}:${port}`);
  });
}
