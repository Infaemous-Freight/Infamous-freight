/**
 * E2E Tests: User Authentication & Account Management
 * Comprehensive tests for login, registration, password reset, and account operations
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  const API_URL = process.env.API_URL || "http://localhost:3001";
  const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

  const testUser = {
    email: `test-${Date.now()}@test.local`,
    password: "SecurePassword123!",
    name: "Test User",
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.waitForLoadState("networkidle");
  });

  test.describe("User Registration", () => {
    test("should successfully register a new user", async ({ page }) => {
      // Navigate to signup
      await page.click("text=Sign up");
      await page.waitForURL(`${WEB_URL}/signup`);

      // Fill in registration form
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);

      // Accept terms
      await page.click('input[type="checkbox"]');

      // Submit form
      await page.click('button:has-text("Create Account")');

      // Verify redirect to email confirmation
      await page.waitForURL(`${WEB_URL}/verify-email`);
      expect(page.url()).toContain("verify-email");

      // Verify success message
      const message = await page.textContent('[role="status"]');
      expect(message).toContain("confirmation email");
    });

    test("should prevent registration with weak password", async ({ page }) => {
      await page.click("text=Sign up");

      await page.fill('input[name="name"]', "Test User");
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");

      // Submit form
      await page.click('button:has-text("Create Account")');

      // Verify error message
      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("at least 8 characters");
    });

    test("should prevent duplicate email registration", async ({ page, request }) => {
      // Register first user via API
      const registerRes = await request.post(`${API_URL}/api/auth/register`, {
        data: {
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        },
      });
      expect(registerRes.ok()).toBeTruthy();

      // Try to register same email via UI
      await page.click("text=Sign up");
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);

      await page.click('button:has-text("Create Account")');

      // Verify error
      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("already registered");
    });
  });

  test.describe("User Login", () => {
    test("should successfully login with valid credentials", async ({ page, request }) => {
      // Register user first
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Login")');

      // Verify redirect to dashboard
      await page.waitForURL(`${WEB_URL}/dashboard`);
      expect(page.url()).toContain("dashboard");

      // Verify user name shown
      const userName = await page.textContent('[role="complementary"]');
      expect(userName).toContain(testUser.name || testUser.email);
    });

    test("should show error with invalid email", async ({ page }) => {
      await page.fill('input[name="email"]', "nonexistent@test.local");
      await page.fill('input[name="password"]', "Password123!");
      await page.click('button:has-text("Login")');

      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("invalid credentials");
    });

    test("should show error with incorrect password", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Try login with wrong password
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', "WrongPassword123!");
      await page.click('button:has-text("Login")');

      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("invalid credentials");
    });

    test("should rate limit failed login attempts", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Try login 6 times with wrong password
      for (let i = 0; i < 6; i++) {
        await page.reload();
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', "WrongPassword123!");
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500);
      }

      // Should get rate limit error
      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("try again later");
    });

    test("should persist session with JWT token", async ({ page, request }) => {
      // Register and login
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Get token
      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const { token } = await loginRes.json();
      expect(token).toBeTruthy();

      // Store token and verify it works
      await page.evaluate((t) => {
        localStorage.setItem("authToken", t);
      }, token);

      await page.goto(`${WEB_URL}/dashboard`);
      await page.waitForLoadState("networkidle");

      // Should remain logged in
      const userName = await page.textContent('[role="complementary"]');
      expect(userName).toBeTruthy();
    });
  });

  test.describe("Password Reset", () => {
    test("should request password reset email", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Navigate to forgot password
      await page.click("text=Forgot password");
      await page.waitForURL(`${WEB_URL}/forgot-password`);

      // Request reset
      await page.fill('input[name="email"]', testUser.email);
      await page.click('button:has-text("Send Reset Link")');

      // Verify success message
      const message = await page.textContent('[role="status"]');
      expect(message).toContain("check your email");
    });

    test("should not reveal if email exists (security)", async ({ page }) => {
      // Request with non-existent email
      await page.click("text=Forgot password");

      const response1 = await page.evaluate(async (email) => {
        const res = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        return res.status;
      }, "nonexistent@test.local");

      // Request with existing email (after registering)
      const response2 = await page.evaluate(async (data) => {
        // First register
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        // Then request reset
        const res = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        return res.status;
      }, testUser);

      // Both should return 200 (don't reveal if user exists)
      expect(response1).toBe(200);
      expect(response2).toBe(200);
    });

    test("should rate limit password reset requests", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Try to request reset 4 times (limit is 3/24h)
      for (let i = 0; i < 4; i++) {
        const res = await request.post(`${API_URL}/api/auth/request-password-reset`, {
          data: { email: testUser.email },
        });

        if (i < 3) {
          expect(res.ok()).toBeTruthy();
        } else {
          expect(res.status()).toBe(429); // Too Many Requests
        }
      }
    });

    test("should validate reset token validity", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // Request reset
      await request.post(`${API_URL}/api/auth/request-password-reset`, {
        data: { email: testUser.email },
      });

      // Try with invalid token
      await page.goto(`${WEB_URL}/reset-password?token=invalid&email=${testUser.email}`);

      // Verify error
      const error = await page.textContent('[role="alert"]');
      expect(error).toContain("invalid or expired");
    });

    test("should complete password reset successfully", async ({ page, request }) => {
      // Register user
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      // In production, would get token from email
      // For testing, we'd need a test endpoint or mock email service

      // Simulate valid reset token (would come from email in real scenario)
      const resetToken = "test-reset-token-12345";

      // Navigate to reset page
      await page.goto(`${WEB_URL}/reset-password?token=${resetToken}&email=${testUser.email}`);

      // Fill in new password
      await page.fill('input[name="newPassword"]', "NewPassword456!");
      await page.fill('input[name="confirmPassword"]', "NewPassword456!");
      await page.click('button:has-text("Reset Password")');

      // Verify redirect to login
      await page.waitForURL(`${WEB_URL}/login`);

      // Verify can login with new password
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', "NewPassword456!");
      await page.click('button:has-text("Login")');

      // Should redirect to dashboard
      await page.waitForURL(`${WEB_URL}/dashboard`);
    });
  });

  test.describe("Account Management", () => {
    test("should update user profile", async ({ page, request }) => {
      // Register and login
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const { token } = await loginRes.json();

      // Navigate to profile page
      await page.goto(`${WEB_URL}/profile`);
      await page.evaluate((t) => {
        localStorage.setItem("authToken", t);
      }, token);

      await page.reload();

      // Update name
      const newName = "Updated Name";
      await page.fill('input[name="name"]', newName);
      await page.click('button:has-text("Save Changes")');

      // Verify success
      const message = await page.textContent('[role="status"]');
      expect(message).toContain("updated successfully");
    });

    test("should change password while authenticated", async ({ page, request }) => {
      // Register and login
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const { token } = await loginRes.json();

      // Navigate to account settings
      await page.goto(`${WEB_URL}/account`);
      await page.evaluate((t) => {
        localStorage.setItem("authToken", t);
      }, token);

      await page.reload();

      // Change password
      const newPassword = "NewPassword789!";
      await page.fill('input[name="currentPassword"]', testUser.password);
      await page.fill('input[name="newPassword"]', newPassword);
      await page.fill('input[name="confirmPassword"]', newPassword);

      await page.click('button:has-text("Change Password")');

      // Verify success
      const message = await page.textContent('[role="status"]');
      expect(message).toContain("changed successfully");

      // Verify old password no longer works
      const oldLoginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(oldLoginRes.ok()).toBeFalsy();

      // Verify new password works
      const newLoginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: newPassword,
        },
      });

      expect(newLoginRes.ok()).toBeTruthy();
    });

    test("should logout successfully", async ({ page, request }) => {
      // Register and login
      await request.post(`${API_URL}/api/auth/register`, {
        data: testUser,
      });

      const loginRes = await request.post(`${API_URL}/api/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const { token } = await loginRes.json();

      // Go to dashboard
      await page.goto(`${WEB_URL}/dashboard`);
      await page.evaluate((t) => {
        localStorage.setItem("authToken", t);
      }, token);

      await page.reload();
      await page.waitForLoadState("networkidle");

      // Click logout
      await page.click('[aria-label="User menu"]');
      await page.click("text=Logout");

      // Verify redirect to login
      await page.waitForURL(`${WEB_URL}/login`);

      // Verify token cleared
      const token2 = await page.evaluate(() => localStorage.getItem("authToken"));
      expect(token2).toBeNull();

      // Verify can't access dashboard
      await page.goto(`${WEB_URL}/dashboard`);
      await page.waitForURL(`${WEB_URL}/login`);
    });
  });
});
