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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
  },
});
