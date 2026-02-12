# Consolidation Strategy for Infamous Freight Enterprises

## Overview

The project currently has duplicate structures:

- Root level: `/api`, `/web`, `/e2e`
- Nested duplicate: `/infamous-freight-ai` with its own `apps/api/`, `apps/web/`, and `apps/mobile/`

## Recommended Approach

### Option 1: Keep Root Structure (RECOMMENDED)

Merge unique features from `/infamous-freight-ai` into the root-level services:

**Benefits:**

- Root structure is already integrated with deployment configs
- Follows monorepo best practices
- Cleaner project structure

**Actions:**

1. **Mobile App**: Move `/infamous-freight-ai/mobile` to `/mobile` (new service)
2. **API Features**: Merge unique routes/services from infamous-freight-ai/api:
   - AI maintenance routes
   - Billing/payment integrations
   - Hybrid auth middleware
   - Synthetic AI client services
3. **Web Features**: Merge any unique features from infamous-freight-ai/web
4. **Documentation**: Merge MONETIZATION_GUIDE.md and other unique docs to `/docs`
5. **Scripts**: Consolidate deployment scripts
6. **Archive**: Move `/infamous-freight-ai` to `/archive/infamous-freight-ai-backup`

### Option 2: Use Infamous-Freight-AI Structure

If the nested structure is more complete:

- Move root apps/api/web/e2e to archive
- Promote infamous-freight-ai contents to root
- Reconfigure all deployment files

## Decision Required

Please review both structures and confirm which approach you prefer:

1. Keep root structure and merge features (recommended)
2. Use infamous-freight-ai structure as primary
3. Manual review of both to cherry-pick best parts

## Files to Compare

Key differences to review:

- API routes and middleware implementations
- Web components and features
- Deployment configurations
- Documentation completeness
