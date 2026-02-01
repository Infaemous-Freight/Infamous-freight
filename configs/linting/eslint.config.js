import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "**/.next/**",
      "build/**",
      "coverage/**",
      "**/coverage/**",
      "**/dist/**",
      "**/build/**",
      "archive/**",
      "**/*.config.js",
      "**/*.config.ts",
      "apps/mobile/**",
      "**/*.test.js",
      "**/*.spec.js",
      "**/*.test.ts",
      "**/*.spec.ts",
      "pnpm-lock.yaml",
      "**/seed.js",
      "**/seedMarketplace.js",
      "**/mock-server.js",
      "**/__tests__/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Enterprise Standards - No console.log in production code
      // Using 'error' instead of ['error', { allow: [] }] for simplicity
      // All console methods are banned; use Pino logger instead
      "no-console": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "no-implicit-globals": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Enterprise Standards - TypeScript files
      // Using 'error' instead of ['error', { allow: [] }] for simplicity
      // All console methods are banned; use Pino logger instead
      "no-console": "error",
      "no-unused-vars": "off", // Handled by TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
    },
  },
  {
    files: ["apps/api/**/*.js", "packages/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  {
    files: [
      "apps/web/**/*.{js,jsx,ts,tsx}",
      "tests/e2e/**/*.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        self: "readonly",
        PerformanceObserver: "readonly",
      },
    },
  },
  {
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/*.{spec,test}.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        it: "readonly",
      },
    },
    rules: {
      // Allow console in tests for debugging
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
];
