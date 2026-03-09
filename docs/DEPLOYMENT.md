# Deployment

This repository is structured for reproducible builds and CI validation.

## Baseline Steps

1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

2. Build all workspaces

```bash
pnpm build
```

3. Set environment variables securely in your deployment platform
4. Start the relevant service(s)

## Notes

- Do not commit secrets to workflow files or tracked config
- Use GitHub Actions secrets for CI
- Use platform-managed secrets for deployment
- Validate build, typecheck, lint, and tests before promotion
