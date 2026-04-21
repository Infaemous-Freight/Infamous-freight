import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
// Enable sourcemap generation and upload only when all Sentry CI vars are present,
// or when explicitly requested via SENTRY_SOURCEMAPS=1.
const enableSentryPlugin =
  Boolean(sentryAuthToken) && Boolean(sentryOrg) && Boolean(sentryProject);
const uploadSourcemaps =
  enableSentryPlugin || process.env.SENTRY_SOURCEMAPS === '1';

export default defineConfig({
  plugins: [
    react(),
    ...(enableSentryPlugin
      ? [
          sentryVitePlugin({
            org: sentryOrg as string,
            project: sentryProject as string,
            authToken: sentryAuthToken as string,
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts')) return 'charts';
          if (id.includes('@stripe/stripe-js') || id.includes('@stripe/react-stripe-js')) return 'stripe';
          if (id.includes('react')) return 'vendor';
        },
      },
    },
  },
});
