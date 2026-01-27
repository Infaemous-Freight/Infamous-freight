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
      branches: 80,
      functions: 85,
      lines: 88,
      statements: 88,
    },
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  // Allow Jest to transform ES modules from @infamous-freight/shared
  transformIgnorePatterns: [
    "node_modules/(?!(@infamous-freight)/)",
  ],
};
