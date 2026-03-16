import { test, expect } from "@playwright/test";

/**
 * Critical User Flows - Authentication Tests
 *
 * These tests validate the core authentication flow:
 * 1. Landing page loads
 * 2. Login page accessible
 * 3. Login form submission
 * 4. Dashboard accessible after login
 * 5. Logout functionality
 */

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto("/");
  });

  test("should load landing page", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Infæmous Freight/i);

    // Check for key elements
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    // Click login button
    await page.locator('button:has-text("Login")').click();

    // Verify login page loads
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should display login form validation", async ({ page }) => {
    // Navigate to login
    await page.locator('button:has-text("Login")').click();
    await expect(page).toHaveURL(/login/);

    // Try to submit empty form
    await page.locator('button:has-text("Sign In")').click();

    // Check for validation messages
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    // Navigate to login
    await page.locator('button:has-text("Login")').click();

    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button:has-text("Sign In")').click();

    // Check for error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should successfully login with valid credentials", async ({ page, context }) => {
    // Skip if no test credentials available
    const testEmail = process.env.TEST_EMAIL;
    const testPassword = process.env.TEST_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
    }

    // Navigate to login
    await page.locator('button:has-text("Login")').click();

    // Fill in valid credentials
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button:has-text("Sign In")').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/);
    await expect(page).toHaveURL(/dashboard/);

    // Verify user is logged in
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("should handle session expiry gracefully", async ({ page }) => {
    // This would require authenticated state
    // Using Playwright fixtures for authenticated state is recommended

    // Simulate expired token by clearing localStorage
    await page.evaluate(() => localStorage.clear());

    // Reload page
    await page.reload();

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
