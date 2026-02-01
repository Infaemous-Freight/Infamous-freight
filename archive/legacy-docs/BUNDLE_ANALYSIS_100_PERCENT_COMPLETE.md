# 📦 Bundle Analysis - 100% Complete Implementation Guide

**Date:** January 22, 2026  
**Status:** ✅ Complete Bundle Analysis System  
**Scope:** Production-Ready Bundle Optimization for All Applications

---

## 🎯 Bundle Analysis Strategy

### Overview

Complete bundle analysis system for:

- **Web (Next.js):** Frontend bundle optimization
- **API (Express.js):** Backend dependency optimization
- **Mobile (React Native):** App bundle size reduction
- **Shared Package:** Shared library optimization

---

## 🌐 Web Bundle Analysis (Next.js)

### 1️⃣ Setup Next.js Bundle Analyzer

```javascript
// web/next.config.mjs
import bundleAnalyzer from "@next/bundle-analyzer";
import withTM from "next-transpile-modules";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true, // Auto-open in browser
  analyzerMode: "static", // Generate HTML report
  reportFilename: "public/bundle-report.html",
  defaultSizes: "gzip", // Show gzipped sizes
});

const withTranspile = withTM(["@infamous-freight/shared"]);

export default withBundleAnalyzer(
  withTranspile({
    reactStrictMode: true,
    swcMinify: true, // Fast minification
    compress: true, // GZIP compression
    productionBrowserSourceMaps: false, // Don't ship source maps
    images: {
      domains: ["cdn.example.com"],
      formats: ["image/webp", "image/avif"], // Modern formats
    },
    // Experimental optimizations
    experimental: {
      scrollRestoration: true,
      optimizePackageImports: [
        "@infamous-freight/shared",
        "@mui/material",
        "lodash-es",
      ],
    },
    webpack: (config, { isServer }) => {
      // Custom webpack optimizations
      config.optimization.minimize = true;
      config.optimization.usedExports = true; // Tree shaking

      // Replace moment.js with date-fns if using date libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        moment: "date-fns", // Smaller date library
      };

      return config;
    },
  }),
);
```

### 2️⃣ Run Bundle Analysis

```bash
# Generate interactive bundle report
cd web
ANALYZE=true pnpm build

# Output: public/bundle-report.html
# Opens automatically in browser

# Advanced: Generate multiple formats
pnpm bundle-analyze:json  # JSON report
pnpm bundle-analyze:html  # HTML report
pnpm bundle-analyze:tree  # Tree view
```

### 3️⃣ Bundle Analysis Scripts

```json
{
  "scripts": {
    "bundle-analyze": "ANALYZE=true pnpm build",
    "bundle-analyze:json": "next build --json --outdir .next-bundle-analysis",
    "bundle-analyze:html": "ANALYZE=true next build && open public/bundle-report.html",
    "bundle-analyze:tree": "ANALYZE=true next build 2>&1 | grep -A 1000 'with all'",
    "bundle-check": "npm run bundle-size-check -- 150KB ./build",
    "bundle-serve": "http-server public -p 8080"
  }
}
```

### 4️⃣ Bundle Size Targets

```javascript
// web/.bundle-budget.json
{
  "bundles": [
    {
      "name": "main",
      "maxSize": "150KB", // Initial JS
      "maxAssets": 5
    },
    {
      "name": "framework",
      "maxSize": "50KB", // Next.js framework
      "maxAssets": 3
    },
    {
      "name": "commons",
      "maxSize": "80KB", // Shared code
      "maxAssets": 2
    },
    {
      "name": "vendor",
      "maxSize": "100KB", // node_modules
      "maxAssets": 4
    }
  ],
  "assets": [
    {
      "name": "*.js",
      "maxSize": "150KB"
    },
    {
      "name": "*.css",
      "maxSize": "50KB"
    },
    {
      "name": "*.woff2",
      "maxSize": "100KB"
    }
  ]
}
```

### 5️⃣ Bundle Analysis Output Example

```
┌─────────────────────────────────────────────────────────────┐
│                    BUNDLE REPORT                            │
├─────────────────────────────────────────────────────────────┤
│ Total JS (gzipped): 145KB ✅ (target: 150KB)                │
│ Total CSS (gzipped): 32KB ✅ (target: 50KB)                 │
│ Total Images: 245KB ✅                                      │
│ Total Fonts: 85KB ✅                                        │
├─────────────────────────────────────────────────────────────┤
│ _document.js          12KB  │████████░░░░░░░░░░│ 8%          │
│ _app.js               18KB  │██████████░░░░░░░░│ 12%         │
│ index.js (home)       28KB  │████████████████░░│ 19%         │
│ dashboard.js          32KB  │████████████████░░│ 22%         │
│ settings.js           24KB  │██████████████░░░░│ 17%         │
│ vendors~main.js       85KB  │██████████████████│ 59%         │
│ vendors~dashboard.js  42KB  │████████████░░░░░░│ 29%         │
├─────────────────────────────────────────────────────────────┤
│ Next.js Framework     35KB  │████████░░░░░░░░░░│ 24%         │
│ React + React-DOM     42KB  │██████████░░░░░░░░│ 29%         │
│ Shared Package        18KB  │████░░░░░░░░░░░░░░│ 12%         │
├─────────────────────────────────────────────────────────────┤
│ Grade: A ✅ (All targets met)                               │
└─────────────────────────────────────────────────────────────┘
```

### 6️⃣ Optimize Bundle Size

```javascript
// web/next.config.mjs - Advanced Optimizations

// Remove unused dependencies
const optimizedDeps = {
  // ❌ Remove: moment (too large)
  // ✅ Use: date-fns instead (12KB vs 70KB)
  // ❌ Remove: lodash (entire library)
  // ✅ Use: lodash-es with tree-shaking (selective imports)
  // ❌ Remove: axios (when using fetch)
  // ✅ Use: native fetch API
};

// Lazy load heavy libraries
const lazyLoadConfig = {
  "chart.js": "lazy", // Only load when needed
  "@mui/material": "lazy", // Material UI
  "react-pdf": "lazy", // PDF rendering
};

// Dynamic imports
export default {
  webpack: (config) => {
    config.plugins.push(
      new webpack.ProvidePlugin({
        // Make utilities available globally
        React: "react",
      }),
    );

    return config;
  },
};
```

### 7️⃣ Continuous Bundle Monitoring

```javascript
// .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Analyze bundle
        run: |
          cd web
          ANALYZE=true pnpm build
          pnpm bundle-check

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('./web/.bundle-report.json', 'utf-8');
            const parsed = JSON.parse(report);
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `📦 Bundle Analysis\n\n${parsed.summary}`
            });
```

---

## 🚀 API Bundle Analysis (Express.js)

### 1️⃣ Analyze API Dependencies

```bash
# Check dependency tree
pnpm list --depth=0

# Find duplicate dependencies
pnpm list --all | grep duplicates

# Analyze node_modules size
npm ls --all 2>/dev/null | tail -1

# Show top 10 largest packages
npm ls --all 2>/dev/null | sort -k2 -rn | head -10
```

### 2️⃣ API Production Bundle

```javascript
// api/package.json - Slim production build
{
  "name": "api",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",           // 52KB
    "jsonwebtoken": "^9.0.0",       // 26KB
    "prisma": "^4.8.0",             // Core ORM
    "dotenv": "^16.0.3",            // 16KB
    "express-rate-limit": "^6.7.0", // 12KB
    "express-validator": "^7.0.0",  // 42KB
    "sentry-sdk": "^7.0.0",         // 85KB
    "winston": "^3.8.2"             // 48KB
  },
  "devDependencies": {
    // ❌ Don't include in production
    "jest": "^29.0.0",              // Excluded in build
    "supertest": "^6.3.0",          // Excluded in build
    "nodemon": "^2.0.20"            // Dev only
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3️⃣ Build Optimized API

```bash
# api/Dockerfile - Production-ready
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy application code
COPY . .

# Build shared package
RUN pnpm --filter @infamous-freight/shared build

# Remove dev dependencies
RUN pnpm prune --prod

# Expose port
EXPOSE 4000

CMD ["node", "src/index.js"]
```

### 4️⃣ API Bundle Size Report

```bash
#!/bin/bash
# scripts/analyze-api-bundle.sh

echo "📦 API Bundle Analysis"
echo "===================="

# Get node_modules size
echo ""
echo "node_modules size:"
du -sh api/node_modules 2>/dev/null | awk '{print $1}'

# Top 10 largest packages
echo ""
echo "Top 10 largest packages:"
du -sh api/node_modules/*/ 2>/dev/null | sort -rh | head -10

# Count dependencies
echo ""
echo "Total dependencies: $(ls api/node_modules | wc -l)"

# Build size
echo ""
echo "Build output size:"
du -sh api/dist 2>/dev/null | awk '{print $1}'

# Size comparison
echo ""
echo "Before/After Optimization:"
echo "node_modules: $BEFORE_SIZE → $AFTER_SIZE"
```

---

## 📱 Mobile Bundle Analysis (React Native)

### 1️⃣ Analyze APK/IPA Size

```bash
# Android APK Analysis
cd mobile

# Build and analyze
npx react-native build-android --mode release

# Analyze APK
npx bundlesize

# Show breakdown
python -m apkanalyzer summary total app-release.apk

# iOS IPA Analysis
npx react-native build-ios --configuration Release

# Show bundle size
stat -f%z build/Release-iphonesimulator/app.ipa
```

### 2️⃣ RN Bundle Optimization

```javascript
// mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable tree shaking
config.transformer = {
  ...config.transformer,
  minifierPath: "metro-minify-terser",
  minifierConfig: {
    ecma: 2020,
    compress: {
      drop_console: true, // Remove console logs in prod
    },
    output: {
      comments: false,
    },
  },
};

// Optimize module resolution
config.resolver = {
  ...config.resolver,
  // Prioritize .native over .js
  sourceExts: ["native", "jsx", "js", "ts", "tsx"],
  // Exclude unnecessary dependencies
  blacklistRE: /.*(test|spec)\.[^.]+$/,
};

module.exports = config;
```

### 3️⃣ Bundle Size Targets

```javascript
// mobile/bundle-budget.json
{
  "android": {
    "apk": "50MB",      // Target APK size
    "aab": "30MB"       // Target AAB (Play Store)
  },
  "ios": {
    "ipa": "80MB"       // Target IPA size
  },
  "javascript": {
    "main": "2.5MB",    // Main bundle (gzipped)
    "vendors": "1.5MB"  // Vendor bundle
  }
}
```

---

## 📦 Shared Package Bundle Analysis

### 1️⃣ Shared Package Structure

```
packages/shared/
├── src/
│   ├── types.ts         (20KB)
│   ├── constants.ts     (15KB)
│   ├── utils.ts         (35KB)
│   ├── env.ts           (8KB)
│   └── validators.ts    (22KB) -- Only import what you need!
├── dist/
│   ├── index.js         (65KB, gzipped: 18KB) ✅
│   ├── index.d.ts       (45KB)
│   └── package.json
└── package.json
```

### 2️⃣ Tree-Shake Unused Exports

```typescript
// packages/shared/src/index.ts - Barrel exports
// ✅ GOOD: Named exports enable tree-shaking
export { SHIPMENT_STATUSES } from "./constants";
export { validateEmail } from "./validators";
export type { Shipment, User } from "./types";

// ❌ BAD: Default export prevents tree-shaking
// export { default } from './all';
```

### 3️⃣ Shared Package Build

```json
{
  "name": "@infamous-freight/shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "import": "./dist/types.mjs",
      "require": "./dist/types.js"
    },
    "./constants": {
      "import": "./dist/constants.mjs",
      "require": "./dist/constants.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc && rollup -c",
    "analyze": "rollup -c --analyze"
  }
}
```

---

## 🔍 Bundle Analysis Checklist

### Pre-Build Checks

- [ ] Review dependency list (`package.json`)
- [ ] Check for duplicate dependencies
- [ ] Verify dev dependencies excluded from production
- [ ] Confirm tree-shaking enabled
- [ ] Validate code splitting configuration
- [ ] Check for unused imports

### Post-Build Analysis

- [ ] Total bundle size < target
- [ ] Gzipped size tracked
- [ ] No unintended dependencies included
- [ ] Large libraries lazy-loaded
- [ ] Tree-shaking verified
- [ ] Source maps excluded from production
- [ ] No console logs in production builds
- [ ] CDN caching configured

### Monitoring

- [ ] GitHub Actions checks bundle on PR
- [ ] Bundle size tracked in CI/CD
- [ ] Alerts on bundle size increase > 10%
- [ ] Monthly bundle health report
- [ ] Dependency audit scheduled weekly

---

## 📊 Bundle Analysis Metrics

```javascript
// metrics/bundle-metrics.js
class BundleMetrics {
  constructor() {
    this.reports = [];
  }

  analyze(buildPath) {
    const sizes = {
      js: this.getJSSize(buildPath),
      css: this.getCSSSize(buildPath),
      images: this.getImageSize(buildPath),
      fonts: this.getFontSize(buildPath),
      total: 0,
    };

    sizes.total = sizes.js + sizes.css + sizes.images + sizes.fonts;

    return {
      timestamp: new Date(),
      sizes,
      gzipped: this.gzipSizes(sizes),
      grade: this.gradeBundle(sizes),
      trend: this.calculateTrend(sizes),
    };
  }

  gradeBundle(sizes) {
    if (sizes.total < 100000) return "A"; // < 100KB
    if (sizes.total < 200000) return "B"; // < 200KB
    if (sizes.total < 300000) return "C"; // < 300KB
    if (sizes.total < 500000) return "D"; // < 500KB
    return "F";
  }

  calculateTrend(sizes) {
    if (this.reports.length === 0) return "baseline";
    const previous = this.reports[this.reports.length - 1];
    const diff = sizes.total - previous.sizes.total;
    if (diff > 0) return `+${(diff / 1024).toFixed(1)}KB ⬆️`;
    if (diff < 0) return `${(diff / 1024).toFixed(1)}KB ⬇️`;
    return "no change";
  }
}

module.exports = BundleMetrics;
```

---

## 🎯 Bundle Optimization Strategies

### 1. Code Splitting (See Code Splitting Guide)

- Route-based splitting
- Component-based splitting
- Vendor bundle isolation

### 2. Minification

- UglifyJS / Terser for JS
- cssnano for CSS
- Image optimization

### 3. Lazy Loading

- Dynamic imports
- Route-based loading
- Component loading on demand

### 4. Dependency Optimization

- Remove unused dependencies
- Use lighter alternatives
- Deduplicate versions

### 5. Asset Optimization

- Image compression (WebP, AVIF)
- Font subsetting
- SVG optimization

---

## ✅ Success Criteria

✅ Bundle size < 150KB (gzipped)  
✅ First load < 2 seconds  
✅ API dependencies slim (< 200MB)  
✅ Mobile APK < 50MB (Android)  
✅ Tree-shaking enabled  
✅ Source maps excluded production  
✅ All large libraries lazy-loaded  
✅ Bundle size tracked in CI/CD  
✅ Trend monitoring active  
✅ Grade A or B consistently

---

## 📚 Integration with Perfect Route System

**Bundle Analysis complements Perfect Routes by ensuring:**

1. Routes use minimal dependencies
2. Handler functions are tree-shakeable
3. Shared package optimally bundled
4. Code splitting follows route patterns
5. Lazy-loaded handlers reduce initial bundle
6. Error handlers tree-shake unused patterns
7. Validators tree-shake unused checks
8. Middleware functions properly exported

---

**Created:** January 22, 2026  
**Version:** 1.0 - Complete Bundle Analysis System  
**Status:** Production Ready ✅
