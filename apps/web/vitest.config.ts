import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "security-tests",
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", ".next", "tests/unit/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
