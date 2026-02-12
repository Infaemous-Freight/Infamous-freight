# ADR-0001: Monorepo Architecture with pnpm Workspaces

## Status

Accepted

## Context

The Infamous Freight Enterprises platform consists of multiple related applications:

- Backend REST API (Node.js/Express)
- Web frontend (Next.js)
- Mobile application (React Native/Expo)
- Shared utilities and types

We needed to decide on a code organization strategy that would:

- Enable code sharing between services
- Maintain independent deployments
- Simplify dependency management
- Support local development workflows
- Allow atomic commits across related changes

Alternative approaches considered:

1. **Polyrepo**: Separate repositories for each service
2. **Monorepo with npm workspaces**: Native npm workspace support
3. **Monorepo with Yarn workspaces**: Yarn's workspace implementation
4. **Monorepo with pnpm workspaces**: pnpm's workspace implementation

## Decision

We chose to implement a **monorepo architecture using pnpm workspaces**.

**Why pnpm over alternatives:**

- **Disk efficiency**: pnpm uses a content-addressable store, saving significant disk space
- **Speed**: Faster installation than npm/yarn due to hard linking
- **Strict dependency management**: Prevents phantom dependencies that plague npm/yarn
- **Monorepo support**: First-class workspace support with filtering (`pnpm --filter`)
- **Drop-in replacement**: Compatible with npm package.json format
- **Active development**: Strong community and regular updates

**Structure:**

```
infamous-freight-enterprises/
├── apps/api/                    # Backend service
├── apps/web/                    # Frontend application
├── apps/mobile/                 # Mobile app
├── packages/shared/        # Shared code
├── e2e/                    # End-to-end tests
└── pnpm-workspace.yaml     # Workspace configuration
```

## Consequences

**Positive:**

- ✅ Single `pnpm install` installs all dependencies
- ✅ Atomic commits across related changes (API + Web + Shared)
- ✅ Simplified CI/CD with single repository to watch
- ✅ Easy code sharing via `@infamous-freight/shared` package
- ✅ Consistent tooling (ESLint, Prettier, Git hooks) across projects
- ✅ Significant disk space savings (~40% vs npm)
- ✅ Filtered commands: `pnpm --filter api test` runs API tests only

**Negative:**

- ❌ Larger repository clone size (all services at once)
- ❌ Learning curve for developers unfamiliar with pnpm
- ❌ Potential for tight coupling if discipline isn't maintained
- ❌ CI builds can be slower without proper caching/filtering

**Mitigations:**

- Use `pnpm --filter` in CI to only build/test changed packages
- Enforce architectural boundaries through linting rules
- Document clear package interaction patterns
- Use shallow git clones in CI for faster checkouts

## Related

- [ADR-0002: Shared Package Pattern](0002-shared-package-pattern.md)
- [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) - Migration from polyrepo to monorepo
