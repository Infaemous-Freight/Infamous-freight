# Lighthouse CI 100% Configuration Profiles

## Production Profile

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "cd ../web && pnpm start",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/pricing",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/about",
        "http://localhost:3000/contact"
      ],
      "settings": {
        "chromeFlags": "--no-sandbox --disable-gpu"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

## Mobile Profile

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "cd ../web && pnpm start",
      "url": ["http://localhost:3000"],
      "settings": {
        "emulatedFormFactor": "mobile",
        "throttling": {
          "rttMs": 150,
          "downstreamThroughputKbps": 1638,
          "upstreamThroughputKbps": 346
        }
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "first-contentful-paint": ["error", {"maxNumericValue": 3000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 4000}]
      }
    }
  }
}
```

## Desktop Profile

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "cd ../web && pnpm start",
      "url": ["http://localhost:3000"],
      "settings": {
        "emulatedFormFactor": "desktop",
        "throttling": {
          "rttMs": 40,
          "downstreamThroughputKbps": 10240,
          "upstreamThroughputKbps": 5120
        }
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}]
      }
    }
  }
}
```
