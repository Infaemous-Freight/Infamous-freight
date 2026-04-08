/**
 * Vitest Setup File
 *
 * Configures testing environment, mocks, and globals for all tests
 */

import React from "react";
import { expect, afterEach, afterAll, vi, beforeAll } from "vitest";
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
 * Mock window.matchMedia (only when browser globals exist)
 */
if (typeof window !== "undefined") {
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
}

/**
 * Suppress console errors in tests (optional)
 */
const originalError = console.error;
const originalWarn = console.warn;
const originalStderrWrite = process.stderr.write.bind(process.stderr);

const suppressedMessages = [
  "Warning: ReactDOM.render",
  "Not implemented: HTMLFormElement.prototype.submit",
  "Not implemented: navigation to another Document",
];

beforeAll(() => {
  const shouldSuppress = (...args: unknown[]) => {
    const firstArg = args[0];
    const firstMessage =
      typeof firstArg === "string"
        ? firstArg
        : firstArg instanceof Error
          ? firstArg.message
          : "";

    if (
      firstMessage &&
      suppressedMessages.some((message) => firstMessage.includes(message))
    ) {
      return true;
    }
    return false;
  };

  console.error = vi.fn((...args) => {
    if (shouldSuppress(...args)) return;
    originalError.call(console, ...args);
  });

  console.warn = vi.fn((...args) => {
    if (shouldSuppress(...args)) return;
    originalWarn.call(console, ...args);
  });

  process.stderr.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding, cb?: (err?: Error) => void) => {
    const text = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    if (suppressedMessages.some((message) => text.includes(message))) {
      if (typeof cb === "function") cb();
      return true;
    }
    return originalStderrWrite(chunk as never, encoding as never, cb as never);
  }) as typeof process.stderr.write;
});

afterAll(() => {
  process.stderr.write = originalStderrWrite;
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
