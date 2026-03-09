# Contributing to Infamous Freight

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run validation locally
4. Commit with a clear message
5. Open a pull request

## Local Validation

```bash
pnpm validate
```

## Commit Style

Use conventional commit prefixes when possible.

Examples:

- feat: add shipment tracking endpoint
- fix: correct JWT validation flow
- chore: update CI workflow
- docs: improve architecture guide

## Pull Request Requirements

Before opening a pull request:
- ensure the build passes
- ensure tests pass
- ensure lint passes
- ensure typecheck passes

CI should pass before merging to main.
