# Playwright E2E Testing for Infæmous Freight

Complete end-to-end testing suite using Playwright for the Infæmous Freight
platform.

## 🚀 Quick Start

```bash
# Install dependencies
cd e2e
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Run all tests
pnpm test

# Run with UI mode
pnpm test:ui

# Run specific browser
pnpm test:chrome
pnpm test:firefox
pnpm test:webkit
```

## 📋 Test Suites

### 1. Payment Flow Tests (`payment-flow.spec.ts`)

- Pricing page display
- Plan selection
- Stripe checkout integration
- Payment success/failure handling
- Card validation
- Plan upgrades
- Invoice generation
- Subscription cancellation
- Webhook verification
- Payment security
- Mobile responsiveness
- Keyboard navigation

**Coverage**: 15+ test cases

### 2. Authentication Tests (`auth-flow.spec.ts`)

- Login page display
- Email validation
- Login success/failure
- Signup flow
- Session persistence
- Logout functionality
- Protected routes
- Password reset
- Password strength validation
- Rate limiting
- OAuth integration
- Token expiration
- Token refresh
- CSRF protection
- XSS sanitization

**Coverage**: 18+ test cases

### 3. Shipment Management Tests (`shipments.spec.ts`)

- List shipments
- Create shipment
- Search functionality
- Status filtering
- View details
- Update status
- Delete shipment
- Form validation
- Bulk operations
- CSV export
- Pagination
- Real-time updates
- Tracking timeline
- Location tracking

**Coverage**: 14+ test cases

### 4. API Integration Tests (`api.spec.ts`)

- Health check endpoints
- Authentication API
- Shipments CRUD
- Payments API
- Webhook handling
- Metrics endpoints
- Security headers
- CORS handling
- SQL injection protection
- Rate limiting
- Performance benchmarks
- Concurrent requests
- Response compression

**Coverage**: 20+ test cases

## 🎯 Total Coverage

- **67+ test cases** across 4 test suites
- **All critical user flows** covered
- **Security tests** included
- **Performance tests** included
- **API integration tests** included

## 🔧 Configuration

### Environment Variables

```bash
# Base URLs
BASE_URL=http://localhost:3000
API_URL=http://localhost:4000

# CI environment
CI=true
NODE_ENV=test
```

### Playwright Config

See [`playwright.config.ts`](playwright.config.ts) for full configuration:

- **Browsers**: Chromium, Firefox, WebKit, Mobile
- **Timeouts**: 30s test, 10s action, 15s navigation
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit, List
- **Traces**: On first retry
- **Screenshots**: On failure
- **Videos**: On failure

## 📊 Running Tests

### Local Development

```bash
# Run all tests
pnpm test

# Run with headed browser (see what's happening)
pnpm test:headed

# Run with UI mode (interactive)
pnpm test:ui

# Run with debugger
pnpm test:debug

# Run specific test file
pnpm test tests/payment-flow.spec.ts

# Run specific browser
pnpm test --project=chromium

# Run tests matching pattern
pnpm test -g "should login"
```

### CI/CD

Tests run automatically on:

- Every pull request
- Every push to main
- Daily at 2 AM UTC

See [`.github/workflows/e2e-tests.yml`](../.github/workflows/e2e-tests.yml) for
CI configuration.

## 📈 Test Reports

### HTML Report

```bash
# Generate and view report
pnpm report
```

Opens interactive HTML report with:

- Test results
- Screenshots
- Videos
- Traces
- Performance metrics

### JSON Report

Located at `test-results.json` after test run.

### JUnit Report

Located at `test-results.xml` for CI integration.

## 🐛 Debugging

### Debug Mode

```bash
# Run with debugger
pnpm test:debug

# Run specific test with debugger
pnpm exec playwright test tests/auth-flow.spec.ts --debug
```

### Trace Viewer

```bash
# View trace for failed test
pnpm exec playwright show-trace test-results/<test-name>/trace.zip
```

### Codegen

```bash
# Generate test code by recording actions
pnpm codegen http://localhost:3000
```

## 🎭 Writing Tests

### Basic Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto("/");
  });

  test("should do something", async ({ page }) => {
    // Test implementation
    await page.click("button");
    await expect(page.locator("text=Success")).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid**: Add `data-testid` attributes for stable selectors
2. **Wait for elements**: Use `waitForSelector` instead of `waitForTimeout`
3. **Use page object model**: Organize complex pages into classes
4. **Mock external APIs**: Use `page.route()` to mock API responses
5. **Clean up**: Reset state in `beforeEach` or `afterEach`
6. **Test isolation**: Each test should be independent
7. **Meaningful assertions**: Use specific expects, not just visibility

### Example with Mocking

```typescript
test("should handle API error", async ({ page }) => {
  // Mock API failure
  await page.route("**/api/shipments", async (route) => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: "Server error" }),
    });
  });

  await page.goto("/shipments");
  await expect(page.locator("text=Error")).toBeVisible();
});
```

## 📦 Dependencies

```json
{
  "@playwright/test": "^1.40.1",
  "@types/node": "^20.10.5"
}
```

## 🚨 Troubleshooting

### Tests Failing Locally

1. **Check services are running**:

   ```bash
   # Terminal 1: Start web
   cd apps/web && pnpm dev

   # Terminal 2: Start API
   cd apps/api && pnpm dev
   ```

2. **Clear browser state**:

   ```bash
   rm -rf test-results playwright-report
   ```

3. **Update browsers**:

   ```bash
   pnpm exec playwright install
   ```

### Timeout Errors

- Increase timeout in `playwright.config.ts`
- Use `waitForSelector` with longer timeout
- Check network requests in trace viewer

### Element Not Found

- Add explicit waits: `await page.waitForSelector('selector')`
- Use more specific selectors
- Check element is visible: `await expect(locator).toBeVisible()`

### CI Failures

- Check CI logs in GitHub Actions
- Download artifacts (videos, screenshots, traces)
- Run same browser locally: `pnpm test --project=chromium`

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Examples](https://github.com/microsoft/playwright/tree/main/examples)

## 📊 Test Coverage Goals

- ✅ **Payment flows**: 100% covered
- ✅ **Authentication**: 100% covered
- ✅ **Shipment CRUD**: 100% covered
- ✅ **API endpoints**: 85% covered
- ✅ **Security**: Critical paths covered
- ✅ **Performance**: Baseline benchmarks

## 🎯 Next Steps

1. Add visual regression tests
2. Add accessibility tests (axe-core)
3. Add performance tests (Lighthouse)
4. Add load tests (K6)
5. Increase API coverage to 95%
6. Add mobile-specific tests

---

**Total: 67+ E2E tests covering all critical paths** ✅
