/**
 * Mobile App: Jest Configuration
 *
 * Testing setup for React Native / Expo app
 */

module.exports = {
    // Test environment
    preset: 'react-native',
    testEnvironment: 'node',

    // Setup
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

    // Test discovery
    testMatch: [
        '**/__tests__/**/*.test.ts?(x)',
        '**/?(*.)+(spec|test).ts?(x)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

    // Module mapping
    moduleNameMapper: {
        '@/(.*)': '<rootDir>/src/$1',
        '@tests/(.*)': '<rootDir>/tests/$1',
        // Mock non-JS modules
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },

    // Setup paths
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/build/',
    ],

    // Transform
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },

    // Coverage
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/types/**',
        '!src/**/*.stories.tsx',
        '!src/**/__mocks__/**',
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Coverage reporters
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json',
    ],

    // Globals
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.jest.json',
            isolatedModules: true,
        },
    },

    // Timeout
    testTimeout: 10000,

    // Verbose output
    verbose: true,
};
