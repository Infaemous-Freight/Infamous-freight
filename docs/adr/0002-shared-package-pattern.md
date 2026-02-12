# ADR-0002: Shared Package for Common Code

## Status

Accepted

## Context

With multiple services (API, Web, Mobile) in our monorepo, we needed a strategy for sharing:

- TypeScript type definitions (User, Shipment, ApiResponse, etc.)
- Constants (HTTP status codes, shipment statuses, user roles)
- Utility functions (date formatting, currency conversion)
- Environment validation helpers

Options considered:

1. **Duplicate code**: Copy-paste shared code into each service
2. **Git submodules**: External repository for shared code
3. **npm package**: Publish shared code to npm registry
4. **Workspace package**: Local package in monorepo

## Decision

We created a **local workspace package** at `packages/shared/` that exports common code.

**Package structure:**

```
packages/shared/
├── src/
│   ├── types.ts        # Domain interfaces
│   ├── constants.ts    # Enums and defaults
│   ├── utils.ts        # Pure functions
│   └── env.ts          # Environment helpers
├── package.json        # @infamous-freight/shared
└── tsconfig.json       # TypeScript config
```

**Build requirement:**

- TypeScript must be compiled before dependent services start
- Command: `pnpm --filter @infamous-freight/shared build`
- Output: `dist/` directory (git-ignored)

**Import pattern:**

```javascript
// API (CommonJS)
const { HTTP_STATUS, ApiResponse } = require("@infamous-freight/shared");

// Web/Mobile (ESM)
import { User, SHIPMENT_STATUSES } from "@infamous-freight/shared";
```

## Consequences

**Positive:**

- ✅ Single source of truth for types and constants
- ✅ Type safety across API/Web boundaries
- ✅ No need to publish to npm or manage versions
- ✅ Changes reflected immediately in all services
- ✅ IDE autocomplete works across all packages
- ✅ Enforces consistent domain model

**Negative:**

- ❌ Must rebuild shared package when types change
- ❌ Build order dependency (shared → apps/api/web/mobile)
- ❌ Can't version shared code independently
- ❌ Breaking changes affect all consumers immediately

**Mitigations:**

- Document build requirement in README and copilot-instructions
- Add `pnpm --filter shared build` to setup scripts
- Use watch mode during development: `pnpm --filter shared dev`
- Consider semantic versioning if shared package grows large

**Critical workflows:**

```bash
# After changing shared types
pnpm --filter @infamous-freight/shared build
pnpm dev  # Restart services to pick up changes

# Watch mode for active development
pnpm --filter @infamous-freight/shared dev
```

## Examples

**Before (duplicated types):**

```javascript
// apps/api/src/types.js
const User = { id: String, email: String, ... };

// apps/web/types/user.ts
interface User { id: string; email: string; ... }
// Risk: Definitions drift over time
```

**After (shared package):**

```typescript
// packages/shared/src/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Both API and Web import from single source
import { User } from "@infamous-freight/shared";
```

## Related

- [ADR-0001: Monorepo Architecture](0001-monorepo-architecture.md)
- [ADR-0003: Module System Split](0003-module-system-split.md)
