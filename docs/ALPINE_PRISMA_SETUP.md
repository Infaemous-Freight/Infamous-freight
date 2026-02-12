# Prisma on Alpine Linux

## Problem

Alpine Linux 3.22+ uses OpenSSL 3.x, but Prisma's query engine binaries are compiled against OpenSSL 1.1.x. This causes runtime errors when trying to load the Prisma client:

```
Error: Error loading shared library libssl.so.1.1: No such file or directory
```

This issue commonly occurs in:

- Docker containers using Alpine as base image
- GitHub Codespaces with Alpine Linux
- CI/CD environments using Alpine
- Development containers

## Solution

Update your `prisma/schema.prisma` to include the Alpine-compatible binary target:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

### Explanation

- `native` - Ensures compatibility with your local development environment
- `linux-musl-openssl-3.0.x` - Alpine Linux with OpenSSL 3.x support

The Prisma CLI will automatically download both binary targets when you run:

```bash
npx prisma generate
```

## Verification

After updating the schema, regenerate the Prisma client:

```bash
cd apps/api
npx prisma generate
```

You should see output indicating multiple binaries were downloaded:

```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in Xms

Prisma engines:
  Query Engine (Node-API, linux-musl-openssl-3.0.x):
    downloaded to .../node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
```

## Testing

Run your tests to confirm Prisma works:

```bash
pnpm test
```

All Prisma-dependent tests should now pass without OpenSSL errors.

## Docker Considerations

If using Docker with Alpine:

```dockerfile
FROM node:20-alpine

# Install OpenSSL 3.x (usually already present in Alpine 3.22+)
RUN apk add --no-cache openssl

# Copy your schema with the correct binaryTargets
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma client
RUN cd apps/api && npx prisma generate
```

## Related Issues

This solution addresses:

- Prisma issue: [#12734](https://github.com/prisma/prisma/issues/12734)
- Alpine OpenSSL compatibility in containerized environments
- GitHub Codespaces Alpine Linux compatibility

## Alternative Solutions

If you still encounter issues:

1. **Use Debian-based image instead of Alpine**:

   ```dockerfile
   FROM node:20-slim
   ```

2. **Install OpenSSL 1.1.x compatibility layer** (not recommended):

   ```bash
   apk add --no-cache openssl1.1-compat
   ```

3. **Use Prisma Data Proxy** for serverless/edge environments

## Testing in CI/CD

Ensure your CI/CD pipeline regenerates the Prisma client:

```yaml
# .github/workflows/ci.yml
- name: Generate Prisma Client
  run: |
    cd apps/api
    npx prisma generate
```

## Troubleshooting

**Still getting OpenSSL errors?**

1. Check your Alpine version: `cat /etc/alpine-release`
2. Check OpenSSL version: `openssl version`
3. Verify binary targets: `ls -la node_modules/@prisma/engines/`
4. Clear node_modules and regenerate:

   ```bash
   rm -rf node_modules
   pnpm install
   cd apps/api && npx prisma generate
   ```

**Binary target not found?**

Update Prisma to the latest version:

```bash
pnpm add -D prisma@latest @prisma/client@latest
```

## References

- [Prisma Binary Targets Documentation](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)
- [Alpine Linux OpenSSL 3 Migration Guide](https://wiki.alpinelinux.org/wiki/OpenSSL_3.0)
- [Prisma Platform Support](https://www.prisma.io/docs/reference/system-requirements)
