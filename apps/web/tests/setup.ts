/**
 * Vitest Setup File
 *
 * Configures testing environment, mocks, and globals for all tests
 */

import React from "react";
import { expect, afterEach, vi, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

/**
 * Cleanup after each test
 */
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Mock environment variables
 */
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
  process.env.NEXT_PUBLIC_ENV = "test";
});

/**
 * Mock Next.js Router
 */
vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    route: "/",
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

/**
 * Mock Next.js Image
 */
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => React.createElement("img", { src, alt, ...props }),
}));

/**
 * Mock fetch globally
 */
global.fetch = vi.fn();

/**
 * Mock window.matchMedia
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Suppress console errors in tests (optional)
 */
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
});

/**
 * Custom matchers
 */
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});
