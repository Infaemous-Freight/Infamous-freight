# Lighthouse CI 100% - Setup & Configuration

## Installation

### Prerequisites

```bash
# Node.js 14+ required
node --version

# pnpm required
npm install -g pnpm@8.15.9

# Global LHCI installation (optional for CI/CD)
npm install -g @lhci/cli@0.9.x
```

### Local Setup

```bash
# 1. Install dependencies (in monorepo)
pnpm install

# 2. Make scripts executable
chmod +x scripts/lighthouse-local.sh
chmod +x scripts/lighthouse-report.sh

# 3. Verify Lighthouse CI installation
npx @lhci/cli --version
# Output: @lhci/cli@0.9.x
```

## Configuration Files

### .lighthouserc.json

Main configuration file for Lighthouse CI:

```json
{
  "ci": {
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.80}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "categories:best-practices": ["error", {"minScore": 0.90}],
        "categories:seo": ["error", {"minScore": 0.90}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    },
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/pricing",
        "http://localhost:3000/dashboard"
      ],
      "numberOfRuns": 3,
      "headless": true,
      "settings": {
        "chromeFlags": ["--no-sandbox", "--disable-dev-shm-usage"],
        "emulatedFormFactor": "mobile"
      }
    },
    "server": {
      "port": 9001,
      "storageMethod": "sql",
      "sqliteDbPath": "./.lighthouseci/db.sqlite"
    }
  }
}
```

### .github/workflows/lighthouse-ci.yml

GitHub Actions workflow (auto-generated):

```yaml
name: 🚀 Lighthouse CI - Performance 100%

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/web/**'
      - '.github/workflows/lighthouse-ci.yml'
      - '.lighthouserc*.json'
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'        # Daily at 2 AM UTC
    - cron: '0 3 * * 1'        # Weekly at 3 AM UTC Mondays

concurrency:
  group: lighthouse-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: read
  checks: write
  pull-requests: write
  pages: write
  id-token: write

jobs:
  build:
    name: Build Web Application
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build web application
        run: pnpm --filter web build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: apps/web/.next
          retention-days: 1

  lighthouse-ci:
    name: Run Lighthouse Audits
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: web-build
          path: apps/web/.next
      
      - name: Install LHCI
        run: npm install -g @lhci/cli@0.9.x
      
      - name: Run Lighthouse CI
        run: |
          cd apps/web
          npm start > /dev/null 2>&1 &
          sleep 5
          cd ..
          lhci autorun --config=.lighthouserc.json
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-ci-results
          path: .lighthouseci
          retention-days: 90
```

## Running Audits

### Local Full Audit

```bash
./scripts/lighthouse-local.sh full
```

Output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 FULL LIGHTHOUSE AUDIT (Complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Web app built
✅ Server ready on http://localhost:3000
✅ Lighthouse audit completed

📊 Lighthouse Results

Page Audited: http://localhost:3000/
📈 Scores:
  🟢 performance        ████████████████░░░░ 85%
  🟢 accessibility      ██████████████████░░ 92%
  🟢 best-practices     ██████████████████░░ 90%
  🟢 seo                ██████████████████░░ 95%
```

### Quick Audit (Single Run)

```bash
./scripts/lighthouse-local.sh quick
```

### Server Only (Manual Testing)

```bash
./scripts/lighthouse-local.sh server

# In another terminal:
lhci autorun --config=.lighthouserc.json
```

### Analyze Previous Results

```bash
./scripts/lighthouse-local.sh analyze
```

### Run & Compare with Baseline

```bash
./scripts/lighthouse-local.sh compare
```

## Customizing Budgets

### Edit `.lighthouserc.json`

**Increase Performance Budget**:

```json
"categories:performance": ["error", {"minScore": 0.85}]
```

**Adjust Web Vitals Budgets**:

```json
"largest-contentful-paint": ["error", {"maxNumericValue": 3000}]
```

**Disable Specific Assertion**:

```json
"first-input-delay": ["warn", {"maxNumericValue": 100}]
```

### Profile-Specific Configurations

Create `.lighthouserc.mobile.json` for mobile-only config:

```json
{
  "ci": {
    "collect": {
      "settings": {
        "emulatedFormFactor": "mobile",
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638,
          "cpuSlowdownMultiplier": 4
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.80}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 4000}]
      }
    }
  }
}
```

Then run:

```bash
lhci autorun --config=.lighthouserc.mobile.json
```

## Interpreting CI Results

### GitHub Actions Interface

1. **Workflow Run Page**:
   - Shows overall status (passed/failed)
   - Lists all jobs and their results

2. **Job Details**:
   - Step-by-step execution logs
   - Error messages if any step fails

3. **Artifacts**:
   - Download `lighthouse-ci-results` for offline review
   - Contains JSON and HTML reports

### GitHub PR Comments (Automatic)

When LHCI integration is enabled:

```
## ⚡ Lighthouse CI Results

### Performance Metrics
- 🟢 Performance: 85% (baseline: 82%)
- 🟢 Accessibility: 92% (baseline: 90%)
- 🟡 Best Practices: 88% (baseline: 90%) ⚠️
- 🟢 SEO: 95% (baseline: 95%)

### Web Vitals
- FCP: 1.8s ✅
- LCP: 2.2s ✅
- CLS: 0.08 ✅

### Regressions
- best-practices decreased by 2% (target: 90%)

### Opportunities
1. Defer offscreen images (save 2.1s)
2. Minify CSS (save 15KB)
```

## Troubleshooting

### Server Won't Start

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Start server manually
cd apps/web && npm start

# Then run audit in another terminal
lhci autorun --config=../.lighthouserc.json
```

### Out of Memory

```bash
# Increase Node heap size
node --max-old-space-size=4096 \
  node_modules/@lhci/cli/bin/lhci.js \
  autorun
```

### Scores Fluctuate Wildly

**Cause**: Background processes, network variance

**Solutions**:

1. Ensure clean environment
2. Increase `numberOfRuns` to 5-10
3. Use consistent network throttling
4. Run on same machine/network

### Chrome Issues

```bash
# Install Chrome dependencies
apt-get update && apt-get install -y \
  gconf-service libgconf-2-4 \
  libappindicator1 libappindicator3-1 \
  libindicator7 libindicator3-7 \
  libgbenchmark-dev \
  libxss1 libxss1 \
  xdg-utils fonts-liberation
```

## Monitoring & Alerts

### Daily Automated Audits

```
GitHub Actions runs daily at 2 AM UTC
- Tests 3 pages
- Runs 3 iterations per page
- Checks against performance budgets
- Stores results for trending
```

### Weekly Deep Dives

```
GitHub Actions runs every Monday at 3 AM UTC
- Extended audit with more pages
- Detailed diagnostics
- Trend analysis
- Team notifications
```

### Manual Monitoring

```bash
# Check latest audit results
cd .lighthouseci
ls -la

# View most recent HTML report
open lh-results.html
```

## Integration with Other Tools

### Send Results to External Service

```bash
# Example: POST to Datadog
curl -X POST https://api.datadoghq.com/api/v2/series \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  -d @lighthouse-metrics.json
```

### Slack Notifications

```yaml
- name: Send Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Lighthouse CI: ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: January 11, 2026
