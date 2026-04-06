import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

// Custom rule: prevent direct imports from @infamous-freight/shared/src
const noDirectSharedImportsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent direct imports from @infamous-freight/shared/src, use @infamous-freight/shared instead",
      category: "Best Practices",
      recommended: true,
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        if (importSource && importSource.includes("@infamous-freight/shared/src")) {
          context.report({
            node,
            message: `Import from '@infamous-freight/shared' instead of '@infamous-freight/shared/src'. This bypasses the build process.`,
          });
        }
      },
    };
  },
};

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "**/.next/**",
      ".netlify/**",
      "**/.netlify/**",
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
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
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
      eqeqeq: ["error", "always"],
      "no-implicit-globals": "error",
    },
  },
  // Apply custom rule globally
  {
    plugins: {
      local: {
        rules: {
          "no-direct-shared-imports": noDirectSharedImportsRule,
        },
      },
    },
    rules: {
      // Custom rule for shared package imports
      "local/no-direct-shared-imports": "error",
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
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
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
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
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
    files: ["apps/api/**/*.{js,jsx,mjs,cjs}"],
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["apps/api/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}", "tests/e2e/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        self: "readonly",
        PerformanceObserver: "readonly",
      },
    },
    rules: {
      // Allow console in web/frontend for browser debugging
      "no-console": "off",
    },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{spec,test}.{js,jsx,ts,tsx}"],
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
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
];
