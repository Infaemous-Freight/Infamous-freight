import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

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

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      '**/.next/**',
      'build/**',
      'coverage/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      'archive/**',
      'apps/mobile/**',
      'pnpm-lock.yaml',
      '**/seed.js',
      '**/seedMarketplace.js',
      '**/mock-server.js',
      '**/__tests__/**',
      '**/*.config.cjs',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Apply custom rule globally
  {
    plugins: {
      local: {
        rules: {
          'no-direct-shared-imports': noDirectSharedImportsRule,
        },
      },
    },
    rules: {
      'local/no-direct-shared-imports': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{js,jsx,ts,tsx}', 'tests/e2e/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        self: 'readonly',
        PerformanceObserver: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        it: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
];
