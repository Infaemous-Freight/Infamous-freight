#!/bin/bash
# Infamous Freight - Quick Dependency Update Commands
# Run this script once Node 24 and pnpm are available in your environment
# Usage: bash update-all-deps.sh 2>&1 | tee update-log.txt

set -euo pipefail

echo "════════════════════════════════════════════════════════════"
echo "  Infamous Freight - Comprehensive Dependency Update Script"
echo "════════════════════════════════════════════════════════════"
date

if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Please install pnpm first:"
  echo "   corepack enable && corepack prepare pnpm@9.15.0 --activate"
  exit 1
fi

echo "✓ Node $(node --version)"
echo "✓ pnpm $(pnpm --version)"

# Create backup
BACKUP_FILE="pnpm-lock.yaml.backup.$(date +%Y%m%d-%H%M%S)"
cp pnpm-lock.yaml "$BACKUP_FILE"
echo "✓ Backup created: $BACKUP_FILE"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "PHASE 1: CRITICAL TYPE & LINTING UPDATES"
echo "════════════════════════════════════════════════════════════"

echo "→ Updating @types/node across all workspaces..."
pnpm -r add --save-dev '@types/node@^25.5.0'

echo "→ Updating TypeScript consistency..."
pnpm --filter web add --save-dev 'typescript@^5.8.2'
pnpm --filter worker add --save-dev 'typescript@^5.8.2'
pnpm --filter mobile add --save-dev 'typescript@^5.8.2'

echo "→ Updating ESLint to v10.x..."
pnpm add --save-dev '@eslint/js@latest' '@typescript-eslint/eslint-plugin@latest' '@typescript-eslint/parser@latest'
pnpm --filter @infamous/api add --save-dev 'eslint@^10.1.0'
pnpm --filter web add --save-dev 'eslint@^10.1.0'
pnpm --filter worker add --save-dev 'eslint@^10.1.0'
pnpm --filter mobile add --save-dev 'eslint@^10.1.0'
pnpm --filter ai add --save-dev 'eslint@^10.1.0'
pnpm --filter infamous-freight-functions add --save-dev 'eslint@^10.1.0'

echo "→ Updating Vitest to v2.x..."
pnpm --filter @infamous/api add --save-dev 'vitest@^2.1.3'
pnpm --filter web add --save-dev 'vitest@^2.1.3'
pnpm --filter mobile add --save-dev 'vitest@^2.1.3'

echo "→ Updating Playwright..."
pnpm --filter @infamous-freight/e2e add --save-dev '@playwright/test@latest'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "PHASE 2: SECURITY & ORM UPDATES"
echo "════════════════════════════════════════════════════════════"

echo "→ Updating Prisma ORM..."
pnpm --filter @infamous/api add --save-dev 'prisma@latest'
pnpm --filter @infamous/api add '@prisma/client@latest' '@prisma/adapter-pg@latest'

echo "→ Updating payment processing..."
pnpm --filter @infamous/api add 'stripe@latest'
pnpm --filter web add 'stripe@latest'

echo "→ Updating error tracking..."
pnpm --filter @infamous/api add '@sentry/node@latest' '@sentry/profiling-node@latest'
pnpm --filter web add '@sentry/nextjs@latest'

echo "→ Updating database clients..."
pnpm --filter @infamous/api add 'pg@latest'
pnpm --filter worker add 'pg@latest'

echo "→ Updating cache/queue systems..."
pnpm --filter @infamous/api add 'ioredis@latest' 'bullmq@latest'
pnpm --filter worker add 'ioredis@latest' 'bullmq@latest'

echo "→ Updating AWS SDK..."
pnpm --filter @infamous/api add '@aws-sdk/client-s3@latest' '@aws-sdk/s3-request-presigner@latest'
pnpm --filter worker add '@aws-sdk/client-s3@latest'

echo "→ Updating validation..."
pnpm --filter @infamous-freight/shared add 'zod@latest'
pnpm --filter @infamous/api add 'zod@latest'

echo "→ Updating security headers..."
pnpm --filter @infamous/api add 'helmet@latest' 'cors@latest' 'express-rate-limit@latest' 'express-validator@latest'

echo "→ Updating JWT..."
pnpm --filter @infamous/api add 'jsonwebtoken@latest'
pnpm --filter web add 'jsonwebtoken@latest'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "PHASE 3: DEVELOPMENT & TOOLING"
echo "════════════════════════════════════════════════════════════"

echo "→ Updating development tools..."
pnpm add --save-dev 'tsx@latest' 'prettier@latest'

echo "→ Updating logging..."
pnpm --filter @infamous/api add 'pino@latest' 'pino-http@latest' 'pino-pretty@latest'
pnpm --filter worker add 'pino@latest' 'pino-pretty@latest'

echo "→ Updating PDF generation..."
pnpm --filter @infamous/api add 'pdfkit@latest'
pnpm --filter worker add 'pdfkit@latest'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "PHASE 4: FRONTEND & REACT NATIVE"
echo "════════════════════════════════════════════════════════════"

echo "→ Updating Firebase..."
pnpm --filter web add 'firebase@latest'

echo "→ Updating monitoring..."
pnpm --filter web add '@datadog/browser-rum@latest'

echo "→ Updating analytics..."
pnpm --filter web add '@vercel/analytics@latest' '@vercel/speed-insights@latest' '@vercel/edge-config@latest' '@vercel/kv@latest'

echo "→ Updating UI libraries..."
pnpm --filter web add 'recharts@latest' 'next-i18next@latest' 'styled-jsx@latest'
pnpm --filter web add --save-dev '@tailwindcss/forms@latest' '@tailwindcss/postcss@latest'

echo "→ Updating Stripe React..."
pnpm --filter web add '@stripe/react-stripe-js@latest' '@stripe/stripe-js@latest'

echo "→ Updating Supabase..."
pnpm --filter web add '@supabase/supabase-js@latest' '@supabase/ssr@latest'

echo "→ Updating React Native..."
pnpm --filter mobile add 'react-native@latest' 'expo@latest' 'expo-router@latest' 'react-native-safe-area-context@latest' 'react-native-screens@latest'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "VERIFICATION & TESTING"
echo "════════════════════════════════════════════════════════════"

echo "→ Installing all dependencies..."
pnpm install

echo "→ Linting codebase..."
pnpm lint

echo "→ Type checking..."
pnpm typecheck

echo "→ Building all workspaces..."
pnpm build

echo "→ Running tests..."
pnpm test:ci

echo "→ Security audit..."
pnpm audit:ci

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ ALL UPDATES COMPLETED SUCCESSFULLY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Summary of what was updated:"
echo "  - TypeScript type definitions aligned"
echo "  - ESLint upgraded to v10.x"
echo "  - Vitest upgraded to v2.x"
echo "  - Prisma ORM to latest"
echo "  - AWS SDK to latest"
echo "  - Security dependencies updated"
echo "  - React, Next.js, React Native current"
echo "  - All development tools updated"
echo ""
echo "Backup of original lock file: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Review git diff to see all changes"
echo "  2. Test locally: pnpm dev"
echo "  3. Run integration tests"
echo "  4. Deploy to staging"
echo "  5. Monitor production for any issues"
echo ""
date
