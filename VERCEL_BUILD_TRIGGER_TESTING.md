# Vercel Build Trigger Testing Guide

## Overview

This document outlines how to test and verify that Vercel builds are triggered correctly based on which files change in the monorepo.

## Configuration

**File**: `vercel.json`

```json
"ignoreCommand": "git diff HEAD^ HEAD --quiet . ':(exclude)api/**' ':(exclude)packages/**' ':(exclude)archive/**' ':(exclude)mobile/**'"
```

### What This Means

- **Triggers Build**: Changes to `web/` directory, root config files, documentation
- **Skips Build**: Changes only to `api/`, `packages/`, `archive/`, `mobile/`

## Test Scenarios

### ✅ Should Trigger Build

1. **Web Directory Changes**
   ```bash
   # Modify a web component
   echo "// test change" >> web/components/Header.tsx
   git add . && git commit -m "test: web component change"
   git push
   ```
   **Expected**: Vercel build starts

2. **Root Config Changes**
   ```bash
   # Update package.json
   echo "# test" >> package.json
   git add . && git commit -m "test: root config change"
   git push
   ```
   **Expected**: Vercel build starts

3. **Deployment Config Changes**
   ```bash
   # Update vercel.json
   echo "" >> vercel.json
   git add . && git commit -m "test: vercel config change"
   git push
   ```
   **Expected**: Vercel build starts

### ❌ Should Skip Build

1. **API-Only Changes**
   ```bash
   # Modify API file
   echo "// test change" >> api/src/routes/health.js
   git add . && git commit -m "test: api only change"
   git push
   ```
   **Expected**: Vercel build skipped with message "No changes detected"

2. **Package-Only Changes**
   ```bash
   # Modify shared package
   echo "// test change" >> packages/shared/src/types.ts
   git add . && git commit -m "test: package only change"
   git push
   ```
   **Expected**: Vercel build skipped

3. **Mobile-Only Changes**
   ```bash
   # Modify mobile file
   echo "// test change" >> mobile/App.tsx
   git add . && git commit -m "test: mobile only change"
   git push
   ```
   **Expected**: Vercel build skipped

4. **Documentation-Only in Excluded Dirs**
   ```bash
   # Modify archived docs
   echo "# test" >> archive/old-docs.md
   git add . && git commit -m "test: archive change"
   git push
   ```
   **Expected**: Vercel build skipped

## Verification Steps

### 1. Check Vercel Dashboard
- Navigate to: https://vercel.com/[your-project]/deployments
- Look for new deployment with commit SHA
- Status should be "Building" or "Ready"

### 2. Check GitHub Actions
- Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/actions
- Look for Vercel deployment comment on PR/commit

### 3. Monitor Build Logs
```bash
# Via Vercel CLI
vercel logs [deployment-url]
```

## Expected Build Behavior

### Successful Skip
```
✓ Running git diff HEAD^ HEAD --quiet . ':(exclude)api/**' ':(exclude)packages/**' ':(exclude)archive/**' ':(exclude)mobile/**'
✓ Build skipped because ignoreCommand returned 0
```

### Successful Trigger
```
✓ Running git diff HEAD^ HEAD --quiet . ':(exclude)api/**' ':(exclude)packages/**' ':(exclude)archive/**' ':(exclude)mobile/**'
✗ Command exited with non-zero status (1)
✓ Proceeding with build
```

## Build Validation

The build now runs validation before starting:

```bash
🔍 Validating build configuration...
✅ Production environment detected - Analytics will be active
✅ API Base URL: https://infamous-freight-api.fly.dev
✅ Build validation complete
```

### Validation Checks

1. ✅ Datadog RUM configuration (warns if missing)
2. ✅ Environment detection (production vs. dev)
3. ✅ API base URL configuration
4. ✅ Next.js and TypeScript config presence

## Troubleshooting

### Build Triggers When It Shouldn't

**Symptom**: Changes to `api/` trigger web builds

**Causes**:
1. Change includes files outside excluded paths
2. Root config files also modified
3. Git submodule or workspace config changed

**Solution**:
```bash
# Check what git sees
git diff HEAD^ HEAD --name-only

# Test ignoreCommand locally
git diff HEAD^ HEAD --quiet . ':(exclude)api/**' ':(exclude)packages/**' ':(exclude)archive/**' ':(exclude)mobile/**'
echo $?  # Should be 0 for skip, 1 for build
```

### Build Skips When It Should Run

**Symptom**: Web changes don't trigger builds

**Causes**:
1. Files in `.vercelignore` were modified
2. Git history issue (shallow clone)
3. Branch protection preventing deployment

**Solution**:
```bash
# Force deployment
vercel --prod --force

# Or override via Vercel dashboard
# Settings > Git > Ignored Build Step > Disable temporarily
```

## Performance Metrics

### Build Cache Hit Rate
- **Target**: >80% cache hits
- **Check**: Vercel dashboard > Deployment > Build logs
- **Look for**: "Cache hit" vs "Cache miss"

### Build Duration
- **Target**: <2 minutes for cache hits
- **Target**: <5 minutes for cache misses
- **Check**: Vercel dashboard > Deployment details

### Build Frequency
- **Optimal**: 3-5 builds/day (only when web changes)
- **Problematic**: >20 builds/day (over-triggering)

## Best Practices

1. **Test Locally First**
   ```bash
   cd web
   bash scripts/validate-build.sh
   pnpm build
   ```

2. **Use Feature Branches**
   - Test ignore logic before merging to main
   - Vercel creates preview deployments per branch

3. **Monitor Build Credits**
   - Free tier: 100 GB-hrs/month
   - Track: Vercel dashboard > Usage

4. **Review Build Logs**
   - Check validation warnings
   - Monitor bundle size changes
   - Watch for dependency issues

## Related Files

- [vercel.json](vercel.json) - Deployment configuration
- [.vercelignore](.vercelignore) - Files excluded from deployment
- [web/scripts/validate-build.sh](web/scripts/validate-build.sh) - Pre-build validation
- [.github/CODEOWNERS](.github/CODEOWNERS) - Review requirements

## Additional Resources

- [Vercel Ignored Build Step Docs](https://vercel.com/docs/concepts/deployments/configure-a-build#ignored-build-step)
- [Git Pathspec Documentation](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec)
- [Monorepo Deployment Guide](https://vercel.com/docs/concepts/monorepos)
