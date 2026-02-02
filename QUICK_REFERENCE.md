# Quick Reference Guide - Infamous Freight Enterprises

**Last Updated**: January 15, 2026  
**Version**: 2.0.0 (Phase 8 Complete)

---

## 🚀 Quick Start Commands

### Development

```bash
# Start all services
pnpm dev

# Start API only
pnpm api:dev              # Runs on port 3001 (Docker) or 4000 (standalone)

# Start Web only
pnpm web:dev              # Runs on port 3000

# Start Mobile
cd mobile && pnpm dev
```

### Build & Deploy

```bash
# Build all
pnpm build

# Build API
pnpm --filter api build

# Build Web
pnpm --filter web build

# Build Shared package (critical after changes)
pnpm --filter @infamous-freight/shared build
```

### Testing

```bash
# Run all tests
pnpm test

# API tests only
pnpm --filter api test

# Watch mode
pnpm --filter api test -- --watch

# Coverage report
pnpm --filter api test -- --coverage
```

### Database

```bash
# Create/apply migrations
cd api && pnpm prisma:migrate:dev --name <description>

# Reset database (dev only!)
cd api && pnpm prisma:migrate:reset

# Open Prisma Studio
cd api && pnpm prisma:studio

# Generate Prisma Client
cd api && pnpm prisma:generate
```

### Linting & Formatting

```bash
# Lint all code
pnpm lint

# Format code
pnpm format

# Type check
pnpm check:types
```

---

## 📁 Directory Structure

```
api/                          # Express.js backend (CommonJS)
├── src/
│   ├── routes/               # API endpoints
│   ├── middleware/            # Auth, validation, error handling
│   ├── services/              # Business logic
│   └── config/                # Configuration
├── prisma/                    # Database schema
└── tests/                     # Jest tests

web/                          # Next.js 14 frontend (TypeScript)
├── pages/                     # Route pages
├── components/                # React components
├── public/                    # Static assets
└── styles/                    # CSS/styling

mobile/                       # React Native/Expo app
├── app/                       # App structure
└── components/                # Mobile components

packages/shared/              # Shared TypeScript utilities
├── src/
│   ├── types.ts               # Domain types
│   ├── constants.ts           # Constants & enums
│   ├── utils.ts               # Helper functions
│   └── env.ts                 # Environment config
└── dist/                      # Compiled output (auto-generated)

scripts/                      # Setup & deployment scripts (39 scripts)
├── setup-*.sh                 # Individual recommendation setups
└── execute-all-phases.sh      # Master execution script

docker/                       # Docker configurations
├── Dockerfile.api
├── Dockerfile.web
└── docker-compose.yml

.github/workflows/            # CI/CD pipelines
└── tests.yml, deploy.yml, etc.
```

---

## 🔌 API Quick Reference

### Base URLs

```
Development:  http://localhost:3001 (Docker) or http://localhost:4000
Production:   https://api.infamous-freight.com
```

### Authentication

```bash
# Get JWT token (from auth endpoint)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"..."}' | jq '.token')

# Use token in requests
curl http://localhost:3001/api/shipments \
  -H "Authorization: Bearer $TOKEN"
```

### Key Endpoints

| Endpoint                    | Method           | Purpose            |
| --------------------------- | ---------------- | ------------------ |
| `/api/health`               | GET              | Liveness check     |
| `/api/auth/login`           | POST             | User login         |
| `/api/shipments`            | GET/POST         | Shipment CRUD      |
| `/api/shipments/:id`        | GET/PATCH/DELETE | Shipment details   |
| `/api/tracking/:shipmentId` | GET              | Real-time tracking |
| `/api/reports`              | GET              | Analytics reports  |
| `/api/ai/commands`          | POST             | AI inference       |
| `/api/voice/ingest`         | POST             | Voice commands     |

### Rate Limits

```
General:       100/15min
Auth:          5/15min
AI:            20/1min
Billing:       30/15min
Voice:         10/1min
Export:        5/1hour
Password Reset: 3/24hours
Webhook:       100/1min
```

### Common Response Format

```json
{
  "success": true,
  "data": {
    /* resource */
  },
  "error": null
}
```

---

## 🛡️ Security Quick Reference

### Environment Variables (Critical)

```bash
# Authentication
JWT_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# API Configuration
API_PORT=3001                      # Default: 4000
API_BASE_URL=http://localhost:3001

# Services
AI_PROVIDER=openai|anthropic|synthetic  # Default: synthetic
VOICE_MAX_FILE_SIZE_MB=10

# Security
CORS_ORIGINS=http://localhost:3000,https://example.com
ENABLE_HELMET=true
```

### Scopes Required

```javascript
// Common scopes
"user:read"; // Read user profile
"user:write"; // Write user profile
"shipments:read"; // Read shipments
"shipments:write"; // Create/update shipments
"reports:read"; // Read reports
"ai:command"; // AI commands
"voice:ingest"; // Voice uploads
"voice:command"; // Voice commands
"admin:all"; // All admin functions
```

### Security Middleware Order (Important!)

```javascript
// Correct order for API routes:
router.post(
  "/action",
  limiters.general, // 1. Rate limiting
  authenticate, // 2. JWT verification
  requireScope("scope"), // 3. Scope check
  auditLog, // 4. Audit trail
  [validate(), handleErrors], // 5. Validation
  handler, // 6. Business logic
);
```

---

## 📊 Monitoring & Debugging

### View Logs

```bash
# API logs
docker logs infamous-api

# Real-time
docker logs -f infamous-api

# Last N lines
docker logs --tail 100 infamous-api
```

### Health Checks

```bash
# API health
curl http://localhost:3001/api/health | jq

# Database connection
curl http://localhost:3001/api/health | jq '.database'
```

### Performance

```bash
# Measure API response time
time curl http://localhost:3001/api/shipments

# Check database slow queries
cd api && pnpm prisma studio
```

### Error Tracking

- **Sentry**: <https://sentry.io> (production errors)
- **Logs**: `docker logs`, Winston logs in `api/logs/`
- **Database**: Check `_prisma_migrations` table

---

## 🚀 Deployment

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api

# Stop specific service
docker stop infamous-api
docker stop infamous-web
```

### Environment for Deployment

```bash
# .env.production
NODE_ENV=production
API_BASE_URL=https://api.example.com
JWT_SECRET=production-secret
DATABASE_URL=postgresql://prod-user:pass@prod-host/db
AI_PROVIDER=openai
CORS_ORIGINS=https://example.com,https://www.example.com
```

### Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] No type errors (`pnpm check:types`)
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Shared package rebuilt (`pnpm --filter @infamous-freight/shared build`)
- [ ] Health check passing (`/api/health`)
- [ ] API responding (test endpoint)

---

## 📱 Web/Mobile Development

### Next.js Pages

```typescript
// Create new page: web/pages/feature.tsx
import { GetStaticProps } from 'next';
import { ApiResponse } from '@infamous-freight/shared';

export default function FeaturePage({ data }) {
  return <h1>{data.title}</h1>;
}

// Server-side fetch
export const getStaticProps: GetStaticProps = async () => {
  const res = await fetch(`${process.env.API_BASE_URL}/api/endpoint`);
  const result: ApiResponse<any> = await res.json();

  if (!result.success) return { notFound: true };
  return { props: { data: result.data }, revalidate: 60 };
};
```

### React Native Development

```bash
# Start Expo
cd mobile && pnpm dev

# Test on device
# Scan QR code with Expo app

# Build APK/IPA
eas build --platform android
eas build --platform ios
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# Triggered on: push to main, pull requests
Steps:
1. Lint & Format  → eslint, prettier
2. Type Check     → TypeScript
3. Test Suite     → Jest (coverage >80%)
4. Build          → Compile all packages
5. Deploy (prod)  → Docker, Vercel, Fly.io
```

### Manual Deployment

```bash
# Deploy API to Fly.io
flyctl deploy

# Deploy Web to Vercel
vercel deploy --prod

# Deploy Mobile
eas build --platform ios --auto-submit
```

---

## 📈 Performance Targets

| Metric       | Target | Current   |
| ------------ | ------ | --------- |
| API Response | <50ms  | 12ms ✅   |
| Web LCP      | <2.5s  | 1.8s ✅   |
| Error Rate   | <1%    | 0.3% ✅   |
| Uptime       | >99.9% | 99.95% ✅ |
| Cache Hit    | >80%   | 82% ✅    |

---

## 🎯 Phase Execution

### Run All 30 Recommendations

```bash
bash EXECUTE_ALL_PHASES_100_PERCENT.sh
```

### Verify All Phases

```bash
bash VERIFY_ALL_PHASES_STATUS.sh
```

### Execute Individual Recommendations

```bash
# Wave 1 (Operational - 10 recs)
bash scripts/setup-*.sh

# Wave 3 (Business Growth - 10 recs)
bash scripts/setup-marketing-automation.sh
bash scripts/setup-sales-operations.sh
bash scripts/setup-revenue-operations.sh
# ... etc (10 total)
```

---

## 💡 Common Tasks

### Add New Database Table

```bash
# 1. Edit api/prisma/schema.prisma
model NewTable {
  id    Int     @id @default(autoincrement())
  name  String
  // ... fields
}

# 2. Migrate
cd api && pnpm prisma:migrate:dev --name add_new_table

# 3. Generate client
cd api && pnpm prisma:generate

# 4. Use in code
import { prisma } from '../config/db';
const data = await prisma.newTable.findMany();
```

### Add API Endpoint

```javascript
// api/src/routes/new-feature.js
const {
  limiters,
  authenticate,
  requireScope,
  auditLog,
} = require("../middleware/security");
const {
  validateString,
  handleValidationErrors,
} = require("../middleware/validation");

router.post(
  "/action",
  limiters.general,
  authenticate,
  requireScope("feature:write"),
  auditLog,
  [validateString("name"), handleValidationErrors],
  async (req, res, next) => {
    try {
      // Business logic
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err); // Global error handler
    }
  },
);

module.exports = router;
```

### Import from Shared Package

```typescript
// ❌ BAD - Define types locally
type ShipmentStatus = "pending" | "in_transit" | "delivered";

// ✅ GOOD - Import from shared
import {
  SHIPMENT_STATUSES,
  ApiResponse,
  Shipment,
} from "@infamous-freight/shared";

const status: SHIPMENT_STATUSES = "pending";
const response: ApiResponse<Shipment> = { success: true, data: shipment };
```

---

## 🆘 Troubleshooting

### API won't start

```bash
# Check if port is in use
lsof -i :3001        # API
lsof -i :5432        # PostgreSQL

# Kill process on port
kill -9 $(lsof -ti:3001)

# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET
```

### Database connection error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection string
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous

# Reset database (dev only!)
cd api && pnpm prisma:migrate:reset
```

### Type errors after shared package changes

```bash
# Rebuild shared package
pnpm --filter @infamous-freight/shared build

# Restart API
pnpm api:dev
```

### Tests failing

```bash
# Run tests with verbose output
pnpm --filter api test -- --verbose

# Run specific test file
pnpm --filter api test -- path/to/test.test.js

# Debug test
node --inspect-brk node_modules/.bin/jest
```

---

## 📚 Documentation Links

- [Full Documentation](DOCUMENTATION_INDEX.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [API Reference](API_ENDPOINTS_REFERENCE.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Architecture Overview](00_START_HERE.md)

---

## 📞 Support

**Issues**: Create GitHub issue  
**Discussions**: GitHub Discussions  
**Email**: <dev@infamous-freight.com>  
**Status Page**: status.infamous-freight.com

---

**Last Updated**: January 15, 2026  
**Maintained By**: Engineering Team  
**Version**: 2.0.0 (All Phases Complete)
