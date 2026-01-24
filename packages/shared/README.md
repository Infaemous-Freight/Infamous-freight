# @infamous-freight/shared

Shared TypeScript package containing domain types, constants, and utilities used across the Infamous Freight monorepo.

## 📦 Installation

This package is automatically linked via pnpm workspaces. To use it in another package:

```json
{
  "dependencies": {
    "@infamous-freight/shared": "workspace:*"
  }
}
```

## 🚀 Quick Start

### Development

```bash
# Build the package
pnpm build

# Type check without emitting
pnpm typecheck

# Clean build artifacts
pnpm clean
```

### Usage

```typescript
// Import types
import type { Shipment, ShipmentStatus, ApiResponse } from '@infamous-freight/shared';

// Import constants
import { SHIPMENT_STATUSES, HTTP_STATUS, ERROR_CODES } from '@infamous-freight/shared';

// Import utilities
import { formatDate, validateEmail, sanitizeInput } from '@infamous-freight/shared';
```

## 📁 Project Structure

```
packages/shared/
├── src/
│   ├── types.ts        # TypeScript type definitions
│   ├── constants.ts    # Shared constants and enums
│   ├── utils.ts        # Utility functions
│   ├── env.ts          # Environment variable types
│   ├── rbac.ts         # Role-based access control types
│   └── index.ts        # Public API exports
├── dist/               # Build output (generated)
├── package.json
└── tsconfig.json
```

## 🔧 What's Included

### Types (`types.ts`)
- **Domain Models**: `Shipment`, `User`, `Payment`, `Subscription`
- **API Types**: `ApiResponse<T>`, `PaginatedResponse<T>`, `ErrorResponse`
- **Request/Response Types**: For all major API endpoints

### Constants (`constants.ts`)
- **HTTP Status Codes**: `HTTP_STATUS` enum
- **Shipment Statuses**: `SHIPMENT_STATUSES` enum
- **Error Codes**: `ERROR_CODES` enum
- **Rate Limits**: `RATE_LIMITS` configuration
- **Feature Flags**: Environment-based feature toggles

### Utilities (`utils.ts`)
- **Date Formatting**: `formatDate()`, `parseDate()`
- **Validation**: `validateEmail()`, `validatePhone()`, `validateUUID()`
- **Sanitization**: `sanitizeInput()`, `sanitizeHtml()`
- **Data Transformation**: `camelToSnake()`, `snakeToCamel()`

### RBAC (`rbac.ts`)
- **Roles**: User role definitions
- **Permissions**: Permission scopes
- **Guards**: Role/permission checking utilities

## 🛠️ Development Guidelines

### Adding New Exports

1. Add your type/constant/utility to the appropriate file
2. Export it from `index.ts`
3. Build the package: `pnpm build`
4. Restart consuming services to pick up changes

### Type Safety

- All exports are strongly typed
- No `any` types allowed
- Use strict TypeScript settings

### Breaking Changes

This package is used across the monorepo. Breaking changes require:
1. Update all consuming packages
2. Update version in `package.json`
3. Document migration path in PR

## 📚 Examples

### Using Types

```typescript
import type { ApiResponse, Shipment } from '@infamous-freight/shared';

function getShipment(id: string): Promise<ApiResponse<Shipment>> {
  // Implementation
}
```

### Using Constants

```typescript
import { HTTP_STATUS, SHIPMENT_STATUSES } from '@infamous-freight/shared';

if (status === SHIPMENT_STATUSES.DELIVERED) {
  return res.status(HTTP_STATUS.OK).json({ success: true });
}
```

### Using Utilities

```typescript
import { validateEmail, sanitizeInput } from '@infamous-freight/shared';

if (!validateEmail(email)) {
  throw new Error('Invalid email');
}

const clean = sanitizeInput(userInput);
```

## 🧪 Testing

Currently, this package does not have its own tests. Types and utilities are tested through consuming packages.

## 🔄 Build Process

The package is built using TypeScript compiler:
- Input: `src/**/*.ts`
- Output: `dist/**/*.js` + `dist/**/*.d.ts`
- Configuration: `tsconfig.json` (extends root `tsconfig.base.json`)

### Build Requirements

- TypeScript must be built before API can start
- Run `pnpm build:shared` from root when types change
- Build artifacts are in `.gitignore` and not committed

## 📦 Versioning

This package follows the main monorepo version. Version bumps should be coordinated across all packages.

## 🤝 Contributing

1. Add your changes to appropriate file in `src/`
2. Update `index.ts` to export new additions
3. Run `pnpm build` to verify
4. Test in consuming packages
5. Document breaking changes

## ⚠️ Important Notes

- **Always import from package root**: `@infamous-freight/shared`, not `@infamous-freight/shared/dist/types`
- **Rebuild after changes**: Types aren't hot-reloaded
- **No circular dependencies**: This package must not depend on api/web/mobile
- **Keep it lean**: Only add truly shared code

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.
