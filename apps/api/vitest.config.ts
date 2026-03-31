import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@infamous-freight/shared': path.resolve(dirname, '../../packages/shared/dist/index.js'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/modules/auth/routes.test.ts'],
    passWithNoTests: true,
  },
});
