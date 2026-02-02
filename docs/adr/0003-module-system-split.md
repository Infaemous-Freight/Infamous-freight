# ADR-0003: CommonJS for API, ESM for Web/Mobile

## Status

Accepted

## Context

Our monorepo contains services with different JavaScript module system needs:

- **API**: Legacy Node.js service with established patterns
- **Web**: Modern Next.js application
- **Mobile**: React Native/Expo application
- **Shared**: TypeScript library consumed by all services

We needed to decide on module systems for each service considering:

- Existing codebase patterns
- Third-party dependency compatibility
- Build tooling requirements
- Developer experience
- Migration complexity

## Decision

We adopted a **hybrid module system strategy**:

| Service | Module System            | Reason                                  |
| ------- | ------------------------ | --------------------------------------- |
| API     | CommonJS (`require()`)   | Established patterns, simpler migration |
| Web     | ESM (`import`)           | Next.js default, modern ecosystem       |
| Mobile  | ESM (`import`)           | React Native/Expo requirement           |
| Shared  | TypeScript → Dual output | Consumed by both systems                |

**API (CommonJS):**

```javascript
// api/package.json
{ "type": "commonjs" }

// api/src/routes/users.js
const express = require('express');
const { HTTP_STATUS } = require('@infamous-freight/shared');
```

**Web/Mobile (ESM):**

```javascript
// web/package.json
{ "type": "module" }  // implicit for Next.js

// web/pages/index.tsx
import { User } from '@infamous-freight/shared';
```

**Shared Package (Dual):**

```json
// packages/shared/package.json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## Rationale

**Why not full ESM migration for API:**

- API has 50+ established CommonJS files
- Migration would require rewriting all `require()` → `import`
- Risk of breaking existing patterns (e.g., dynamic requires)
- Limited benefit for backend service (no bundling needed)
- Team familiarity with CommonJS patterns

**Why ESM for Web/Mobile:**

- Next.js and Expo expect ESM by default
- Modern tooling (Vite, Webpack 5) optimized for ESM
- Tree-shaking benefits for client bundles
- Future-proof as ecosystem moves to ESM

## Consequences

**Positive:**

- ✅ No disruptive API migration required
- ✅ Web/Mobile use modern tooling optimally
- ✅ Gradual migration path available if needed
- ✅ Each service uses idiomatic patterns
- ✅ Shared package works with both systems

**Negative:**

- ❌ Developers must context-switch between systems
- ❌ Cannot use top-level await in API
- ❌ Some ESM-only packages unavailable to API
- ❌ Documentation must cover both patterns

**Trade-offs:**

```javascript
// API limitation: Dynamic imports
const module = require(dynamicPath); // Works
const module = await import(dynamicPath); // Requires ESM

// Web advantage: Tree-shaking
import { specificUtil } from "@infamous-freight/shared"; // Only imports used code
```

## Migration Path (Future)

If full ESM migration becomes necessary:

1. **Phase 1**: Convert utility modules (no dependencies)
2. **Phase 2**: Convert middleware (isolated logic)
3. **Phase 3**: Convert routes (depends on middleware)
4. **Phase 4**: Update package.json to `"type": "module"`

Estimated effort: 2-3 weeks for full migration.

## Related

- [ADR-0002: Shared Package Pattern](0002-shared-package-pattern.md)
- Node.js ESM documentation: <https://nodejs.org/api/esm.html>
