import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
// Enable Sentry uploads when credentials exist, but allow CI to opt out
// and avoid hard build failures on auth issues.
const hasSentryCredentials =
  Boolean(sentryAuthToken) && Boolean(sentryOrg) && Boolean(sentryProject);
const disableSentryUpload =
  process.env.SENTRY_DISABLE_UPLOAD === '1' ||
  process.env.SENTRY_DISABLE_UPLOAD === 'true';
const enableSentryUpload = hasSentryCredentials && !disableSentryUpload;
const uploadSourcemaps =
  enableSentryUpload || process.env.SENTRY_SOURCEMAPS === '1';

export default defineConfig({
  plugins: [
    react(),
    ...(enableSentryUpload
      ? [
          sentryVitePlugin({
            org: sentryOrg as string,
            project: sentryProject as string,
            authToken: sentryAuthToken as string,
            errorHandler: (error) => {
              const message = error.message ?? String(error);
              console.warn('[sentry-vite-plugin] source-map upload skipped:', message);
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: uploadSourcemaps,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('/@stripe/')) return 'stripe';
          if (id.includes('/@sentry/')) return 'vendor-sentry';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/socket.io-client/') || id.includes('/engine.io-client/')) return 'vendor-socket';
          if (id.includes('/react-router-dom/') || id.includes('/react-router/')) return 'vendor-router';
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
