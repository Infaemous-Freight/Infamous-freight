module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/instrument.js",
    "!src/swagger.js",
    "!src/config/**",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 88,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  // Allow Jest to transform ES modules from @infamous/shared
  transformIgnorePatterns: ["node_modules/(?!(@infamous)/)"],
  // Map @infamous/shared to the built dist
  moduleNameMapper: {
    "^@infamous/shared$": "<rootDir>/../../packages/shared/dist/index.js",
  },
};
