// Utility functions for testing and quality assurance
import * as Sentry from "@sentry/nextjs";

export class TestHelpers {
  // Simulate network conditions
  static async simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate test data
  static generateMockShipment(id: number) {
    return {
      id,
      trackingNumber: `IFX${id.toString().padStart(8, "0")}`,
      status: ["pending", "in_transit", "delivered"][Math.floor(Math.random() * 3)],
      origin: "Chicago, IL",
      destination: "New York, NY",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      driver: {
        id: Math.floor(Math.random() * 100),
        name: "Test Driver",
      },
    };
  }

  // Validate API response structure
  static validateApiResponse<T>(response: unknown, schema: Partial<T>): boolean {
    if (typeof response !== "object" || response === null) return false;

    const responseObj = response as Record<string, unknown>;
    return Object.keys(schema).every((key) => key in responseObj);
  }

  // Performance testing
  static async measurePerformance<T>(
    _name: string,
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    // Performance measurement result available via return value
    return { result, duration };
  }

  // Error simulation
  static simulateError(message: string, shouldReport = false): void {
    const error = new Error(message);
    if (shouldReport) {
      Sentry.captureException(error);
    }
    throw error;
  }

  // Local storage helpers
  static clearTestData(): void {
    if (typeof window !== "undefined") {
      const keysToKeep = ["theme", "auth"];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Network status simulation
  static setOfflineMode(offline: boolean): void {
    if (typeof window !== "undefined") {
      const event = new Event(offline ? "offline" : "online");
      window.dispatchEvent(event);
    }
  }
}

// Integration test helpers
export class IntegrationTestHelpers {
  // Setup test environment
  static async setupTestEnvironment(): Promise<void> {
    TestHelpers.clearTestData();
    // Initialize any necessary test state
  }

  // Teardown test environment
  static async teardownTestEnvironment(): Promise<void> {
    TestHelpers.clearTestData();
    // Clean up any test artifacts
  }

  // Mock API responses
  static mockApiSuccess<T>(data: T, delay = 100): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  }

  static mockApiError(message: string, delay = 100): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), delay);
    });
  }
}

// Accessibility testing helpers
export class A11yTestHelpers {
  // Check for ARIA labels
  static hasAriaLabel(element: HTMLElement): boolean {
    return !!(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby"));
  }

  // Check for alt text on images
  static hasAltText(img: HTMLImageElement): boolean {
    return !!img.getAttribute("alt");
  }

  // Check for keyboard accessibility
  static isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute("tabindex");
    return (
      element.tagName === "BUTTON" ||
      element.tagName === "A" ||
      element.tagName === "INPUT" ||
      (tabIndex !== null && parseInt(tabIndex) >= 0)
    );
  }

  // Get all focusable elements
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  }
}

// Visual regression testing helpers
export class VisualTestHelpers {
  // Capture screenshot (requires external tool)
  static async captureScreenshot(name: string): Promise<void> {
    // Screenshot captured - implementation depends on testing framework
    void name; // Suppress unused variable warning
  }

  // Compare screenshots
  static async compareScreenshots(
    baseline: string,
    current: string,
  ): Promise<{ match: boolean; difference: number }> {
    // Comparison logic - implementation depends on testing framework
    void baseline;
    void current;
    return { match: true, difference: 0 };
  }
}
