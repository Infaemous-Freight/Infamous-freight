module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
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
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  coverageReporters: ["text", "html", "json-summary"],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  // Allow Jest to transform ES modules from @infamous-freight/shared
  transformIgnorePatterns: ["node_modules/(?!(@infamous-freight)/)"],
  // Map @infamous-freight/shared to the built dist
  moduleNameMapper: {
    "^@infamous-freight/shared$": "<rootDir>/../../packages/shared/dist/index.js",
  },
};
