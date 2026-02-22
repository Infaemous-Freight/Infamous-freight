# Deployment Scripts

This directory contains deployment scripts for various environments and platforms.

## 🚀 Recommended Staging Deployment

**Use the comprehensive automation script**: [`../scripts/deploy-staging.sh`](../scripts/deploy-staging.sh)

This script provides:
- ✅ Complete pre-flight validation (git, dependencies, security audit)
- ✅ Test suite validation (expects 5/5 passing)
- ✅ Build verification for all packages
- ✅ Docker Compose orchestration
- ✅ Health check verification
- ✅ Post-deployment instructions

**Quick Start**:
```bash
# From project root
./scripts/deploy-staging.sh
```

## 📁 Files in This Directory

### `staging.sh`
**Status**: Legacy script  
**Purpose**: SSH-based deployment to remote staging server  
**Use Case**: When deploying to a specific staging server via SSH  
**Note**: Consider migrating to the newer `../scripts/deploy-staging.sh` for local Docker-based staging

### Other Scripts
- `production.sh` - Production deployment (consider using `../scripts/deploy-production.sh`)
- Platform-specific scripts as needed

## 🔄 Migration Path

If you're currently using `deploy/staging.sh`:

1. **Review new script**: Check [`../scripts/deploy-staging.sh`](../scripts/deploy-staging.sh)
2. **Update workflows**: Update CI/CD pipelines to use new script
3. **Test locally**: Verify Docker Compose staging works
4. **Migrate gradually**: Run both scripts in parallel during transition
5. **Archive old script**: Once migration complete, archive or update legacy script

## 📖 Documentation

- **Quick Start**: See [`../QUICK-DEPLOYMENT-GUIDE.md`](../QUICK-DEPLOYMENT-GUIDE.md)
- **Full Checklist**: See [`../STAGING-DEPLOYMENT-READINESS.md`](../STAGING-DEPLOYMENT-READINESS.md)
- **Operations**: See [`../RUN_BOOK.md`](../RUN_BOOK.md)

---

**Last Updated**: February 22, 2026  
**Recommended Script**: `../scripts/deploy-staging.sh`
