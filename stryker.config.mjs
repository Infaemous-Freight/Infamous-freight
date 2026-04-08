/**
 * Mutation Testing with Stryker
 * Verify test suite quality by introducing code mutations
 * Ensure tests actually catch bugs
 */

// stryker.config.mjs
export default {
    packageManager: 'pnpm',
    testRunner: 'jest',
    coverageAnalysis: 'perTest',

    // Files to mutate
    mutate: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/**/__tests__/**',
        '!src/**/types.ts',
    ],

    // Test files
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
    ],

    // Mutation types
    mutators: [
        'ArithmeticOperator',    // + → -, * → /
        'ArrayDeclaration',      // [] → [1]
        'BlockStatement',        // {} → empty
        'BooleanLiteral',        // true → false
        'ConditionalExpression', // ? → :
        'EqualityOperator',      // == → !=
        'LogicalOperator',       // && → ||
        'MethodExpression',      // map → filter
        'ObjectLiteral',         // {} → {x:1}
        'OptionalChaining',      // ?. → .
        'StringLiteral',         // "foo" → ""
        'UnaryOperator',         // ! → empty
    ],

    // Reporters
    reporters: [
        'html',
        'clear-text',
        'progress',
        'dashboard',
    ],

    // HTML report output
    htmlReporter: {
        fileName: 'mutation-report.html',
    },

    // Thresholds (fail build if below)
    thresholds: {
        high: 80,
        low: 60,
        break: 50,
    },

    // Plugins
    plugins: [
        '@stryker-mutator/core',
        '@stryker-mutator/jest-runner',
        '@stryker-mutator/typescript-checker',
    ],

    // TypeScript checker
    checkers: ['typescript'],
    tsconfigFile: 'tsconfig.json',

    // Concurrency
    concurrency: 4,
    maxTestRunnerReuse: 4,

    // Timeout
    timeoutMS: 60000,
    timeoutFactor: 1.5,

    // Ignore patterns
    ignorePatterns: [
        'node_modules',
        'dist',
        'coverage',
        '.next',
        'build',
    ],

    // Dashboard reporter (optional)
    dashboard: {
        project: 'github.com/infamous-freight/infamous-freight-enterprises',
        version: process.env.GIT_COMMIT || 'main',
        module: 'API',
        baseUrl: 'https://dashboard.stryker-mutator.io',
        reportType: 'full',
    },

    // Incremental mode (faster for large codebases)
    incremental: true,
    incrementalFile: '.stryker-tmp/incremental.json',

    // Dry run (test without mutations)
    dryRunTimeoutMinutes: 5,

    // Clear console between runs
    clearTextReporter: {
        allowColor: true,
        logTests: false,
        maxTestsToLog: 3,
    },
};

/**
 * Example mutations and expected results
 */

// Original code
function calculateShippingCost(weight: number, distance: number): number {
    const baseRate = 10;
    const weightRate = 0.5;
    const distanceRate = 0.1;

    if (weight <= 0 || distance <= 0) {
        throw new Error('Invalid input');
    }

    return baseRate + (weight * weightRate) + (distance * distanceRate);
}

// Mutation 1: Change arithmetic operator
// MUTANT: weight * weightRate → weight / weightRate
// TEST SHOULD FAIL if tests don't verify calculation

// Mutation 2: Change conditional
// MUTANT: weight <= 0 → weight < 0
// TEST SHOULD FAIL if tests don't check boundary conditions

// Mutation 3: Change boolean
// MUTANT: weight <= 0 || distance <= 0 → weight <= 0 && distance <= 0
// TEST SHOULD FAIL if tests don't check all validation paths

/**
 * Strong test suite (will kill mutations)
 */
describe('calculateShippingCost', () => {
    it('calculates cost correctly', () => {
        const cost = calculateShippingCost(100, 500);
        expect(cost).toBe(10 + (100 * 0.5) + (500 * 0.1)); // 110
    });

    it('throws error for zero weight', () => {
        expect(() => calculateShippingCost(0, 500)).toThrow('Invalid input');
    });

    it('throws error for zero distance', () => {
        expect(() => calculateShippingCost(100, 0)).toThrow('Invalid input');
    });

    it('throws error for negative weight', () => {
        expect(() => calculateShippingCost(-10, 500)).toThrow('Invalid input');
    });

    it('throws error for negative distance', () => {
        expect(() => calculateShippingCost(100, -50)).toThrow('Invalid input');
    });
});

/**
 * Mutation score interpretation
 */
interface MutationScore {
    killed: number;      // Mutations caught by tests ✓
    survived: number;    // Mutations NOT caught by tests ✗
    timeout: number;     // Mutations that caused infinite loops
    noCoverage: number;  // Code not covered by tests
    error: number;       // Mutations that caused runtime errors
    total: number;       // Total mutations
    score: number;       // Percentage killed
}

// Example score
const exampleScore: MutationScore = {
    killed: 85,
    survived: 10,
    timeout: 2,
    noCoverage: 3,
    error: 0,
    total: 100,
    score: 85, // 85% mutation score
};

/**
 * CI/CD Integration
 */

// package.json scripts
{
    "scripts": {
        "test:mutation": "stryker run",
            "test:mutation:incremental": "stryker run --incremental",
                "test:mutation:watch": "stryker run --watch"
    }
}

// .github/workflows/mutation-testing.yml
export const mutationWorkflow = `
name: Mutation Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  mutation-testing:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # For incremental mode

      - uses: actions/setup-node@v3
        with:
          node-version: '24'

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run mutation tests
        run: pnpm test:mutation
        env:
          STRYKER_DASHBOARD_API_KEY: \${{ secrets.STRYKER_API_KEY }}

      - name: Upload mutation report
        uses: actions/upload-artifact@v3
        with:
          name: mutation-report
          path: reports/mutation/

      - name: Comment PR with results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json', 'utf8'));

            const comment = \\\`
            ## 🧬 Mutation Testing Results

            - **Score**: \${report.mutationScore}%
            - **Killed**: \${report.killed}
            - **Survived**: \${report.survived}
            - **Timeout**: \${report.timeout}

            [\📊 Full Report](https://github.com/\${context.repo.owner}/\${context.repo.repo}/actions/runs/\${context.runId})
            \\\`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
`;

/**
 * Mutation testing best practices
 */
export const bestPractices = {
    // 1. Start small
    firstRun: 'Run on single file to understand output',

    // 2. Use incremental mode
    incremental: 'Only test changed files in CI/CD',

    // 3. Set realistic thresholds
    thresholds: {
        initial: 50,
        good: 70,
        excellent: 85,
    },

    // 4. Exclude generated code
    exclude: [
        'migrations',
        'generated',
        'mocks',
        'fixtures',
    ],

    // 5. Parallelize
    concurrency: 'Use all CPU cores',

    // 6. Focus on critical paths
    priority: [
        'business logic',
        'security code',
        'payment processing',
    ],
};

/**
 * Common survived mutants and fixes
 */
export const survivedMutants = [
    {
        mutation: 'Boundary condition: <= to <',
        original: 'if (age >= 18)',
        mutant: 'if (age > 18)',
        fix: 'Add test for age === 18',
    },
    {
        mutation: 'Boolean operator: || to &&',
        original: 'if (isValid || isAdmin)',
        mutant: 'if (isValid && isAdmin)',
        fix: 'Test both conditions separately',
    },
    {
        mutation: 'Return value changed',
        original: 'return total * 1.1',
        mutant: 'return total * 1',
        fix: 'Verify exact calculation result',
    },
    {
        mutation: 'Array method changed',
        original: 'items.filter(x => x > 0)',
        mutant: 'items.map(x => x > 0)',
        fix: 'Verify array length and contents',
    },
];

/**
 * Usage:
 *
 * // Install Stryker
 * npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
 *
 * // Initialize config
 * npx stryker init
 *
 * // Run mutation tests
 * npm run test:mutation
 *
 * // View HTML report
 * open reports/mutation/mutation-report.html
 *
 * // Run on specific files
 * npx stryker run --mutate "src/services/shipping.ts"
 *
 * Benefits:
 * - Verify test quality
 * - Find weak tests
 * - Improve test coverage
 * - Catch edge cases
 * - Increase confidence
 *
 * Expected results:
 * - Mutation score: 80%+
 * - Strong test suite validation
 * - Better bug detection
 * - Higher code quality
 */
