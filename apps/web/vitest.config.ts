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
    exclude: ["node_modules", "dist", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
