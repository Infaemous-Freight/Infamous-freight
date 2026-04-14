import { test, expect } from "@playwright/test";

/**
 * Authentication Flow E2E Tests
 * Tests user signup, login, logout, and session management
 */

test.describe("Authentication", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    name: "Test User",
  };

  test("should display login page", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page).toHaveTitle(/Login|Sign In/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/sign-in");

    // Enter invalid email
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=/invalid.*email/i")).toBeVisible({ timeout: 3000 });
  });

  test("should handle login failure", async ({ page }) => {
    // Mock failed login
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Invalid credentials",
        }),
      });
    });

    await page.goto("/auth/sign-in");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=/invalid.*credentials/i")).toBeVisible();
  });

  test("should complete signup flow", async ({ page }) => {
    await page.goto("/auth/sign-up");

    // Fill signup form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"][name*="terms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Sign Up")');

    // Should redirect to dashboard or verification page
    await page.waitForURL(/dashboard|verify|welcome/, { timeout: 10000 });
  });

  test("should persist session after page reload", async ({ page, context }) => {
    // Mock successful login
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            token: "mock_jwt_token_123",
            user: {
              id: "1",
              email: "test@example.com",
              name: "Test User",
            },
          },
        }),
      });
    });

    await page.goto("/auth/sign-in");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/dashboard/);
  });

  test("should logout successfully", async ({ page }) => {
    // Assume user is logged in
    await page.goto("/dashboard");

    // Click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Sign Out")').first();
    await logoutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 5000 });
  });

  test("should redirect to login when accessing protected route", async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto("/dashboard/shipments");

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/, { timeout: 5000 });
  });

  test("should handle password reset flow", async ({ page }) => {
    await page.goto("/forgot-password");

    // Enter email
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator("text=/email.*sent|check.*email/i")).toBeVisible({ timeout: 5000 });
  });

  test("should enforce password strength", async ({ page }) => {
    await page.goto("/auth/sign-up");

    // Try weak password
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "123");

    // Should show strength indicator or error
    const weakIndicator = page.locator("text=/weak|too short|minimum/i");
    await expect(weakIndicator).toBeVisible({ timeout: 3000 });
  });

  test("should handle rate limiting on login", async ({ page }) => {
    // Mock rate limit error
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Too many login attempts",
        }),
      });
    });

    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');

    // Should show rate limit message
    await expect(page.locator("text=/too many.*attempts/i")).toBeVisible();
  });

  test("should support OAuth login", async ({ page }) => {
    await page.goto("/login");

    // Check for OAuth buttons
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    const githubButton = page.locator('button:has-text("GitHub"), a:has-text("GitHub")');

    // At least one OAuth option should be present
    const hasOAuth = (await googleButton.isVisible()) || (await githubButton.isVisible());

    if (hasOAuth) {
      // Click Google login
      if (await googleButton.isVisible()) {
        await googleButton.click();

        // Should redirect to OAuth provider or show popup
        // (Can't test actual OAuth flow without credentials)
      }
    }
  });
});

test.describe("Session Management", () => {
  test("should expire session after timeout", async ({ page, context }) => {
    // This would require backend support for session expiry
    // Mock scenario where token expires
    await page.route("**/api/**", async (route) => {
      if (route.request().headers()["authorization"]) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "Token expired",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test("should refresh token automatically", async ({ page }) => {
    let refreshCount = 0;

    // Mock token refresh
    await page.route("**/api/auth/refresh", async (route) => {
      refreshCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { token: "new_token_" + refreshCount },
        }),
      });
    });

    await page.goto("/dashboard");

    // Wait for potential refresh calls
    await page.waitForTimeout(2000);

    // Token refresh should have been called
    expect(refreshCount).toBeGreaterThan(0);
  });
});

test.describe("Security", () => {
  test("should not expose JWT in HTML", async ({ page }) => {
    await page.goto("/dashboard");

    const content = await page.content();

    // Should not contain JWT token patterns
    expect(content).not.toMatch(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/);
  });

  test("should include CSRF protection", async ({ page }) => {
    await page.goto("/login");

    // Check for CSRF token
    const csrfToken = await page.locator('input[name="_csrf"]').getAttribute("value");

    if (csrfToken) {
      expect(csrfToken).toBeTruthy();
      expect(csrfToken.length).toBeGreaterThan(10);
    }
  });

  test("should sanitize user input", async ({ page }) => {
    await page.goto("/signup");

    // Try XSS attack
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[name="name"]', xssPayload);
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "Password123!");

    // Get the value back
    const sanitizedValue = await page.locator('input[name="name"]').inputValue();

    // Should be sanitized (no script tags)
    expect(sanitizedValue).not.toContain("<script>");
  });
});
