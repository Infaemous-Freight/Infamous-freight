# Architecture Decision Records (ADRs)

**Location**: `/docs/adr/`  
**Status**: Active  
**Last Updated**: February 12, 2026  

---

## Overview

This document catalogs all Architecture Decision Records (ADRs) for the Infamous Freight Platform. Each ADR documents a significant architectural decision made during development, along with context, alternatives considered, and consequences.

---

## ADR Index

### 1. Database Query Optimization Strategy
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: High  

#### Decision
Use Prisma with `include()` and `select()` patterns to prevent N+1 queries. Implement query performance monitoring at application level with Sentry integration.

#### Context
- Large datasets (1M+ shipments) require optimized queries
- N+1 query patterns can cause significant performance degradation
- Need production visibility into query performance

#### Alternatives Considered
1. ❌ Raw SQL queries (less maintainable, requires additional testing)
2. ❌ Query caching layer (additional complexity, cache invalidation challenges)
3. ✅ Prisma optimization patterns (chosen - simple, effective, maintainable)

#### Consequences
- ✅ Predictable query performance
- ✅ Type-safe database access
- ✅ Easier debugging and monitoring
- ⚠️ Requires discipline in code reviews
- ⚠️ Need to maintain performance baseline

#### Implementation
- Located in: `apps/api/src/services/queryPerformanceMonitor.js`
- Key methods: `recordQuery()`, `analyzePerformance()`, `detectN1Patterns()`

---

### 2. Sentry Integration for Error Tracking & APM
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: High  

#### Decision
Integrate Sentry as primary error tracking and performance monitoring platform. Implement custom instrumentation for API calls, database queries, and user actions.

#### Context
- Need centralized error tracking across multiple platforms
- Production visibility critical for incident response
- Need to track user behavior for support
- Performance budgets required for SLA compliance

#### Alternatives Considered
1. ❌ Custom logging solution (requires significant maintenance)
2. ❌ Datadog only (higher cost, more complex setup)
3. ✅ Sentry + custom instrumentation (chosen - good balance of features and cost)

#### Consequences
- ✅ Centralized error tracking
- ✅ Real-time alerting on critical issues
- ✅ Performance monitoring integrated
- ⚠️ PII handling requires careful configuration
- ⚠️ Sampling strategy needed for high-volume applications

#### Implementation
- API Interceptor: `apps/api/src/services/sentryAPIInterceptor.js`
- User Tracking: `apps/api/src/services/userActivityTracker.js`
- Performance: `apps/api/src/services/performanceMonitor.js`

---

### 3. Email Service Architecture (SendGrid)
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: Medium  

#### Decision
Use SendGrid for transactional email with graceful degradation when service unavailable. Implement multiple email type handlers (shipment notifications, driver alerts, admin alerts).

#### Context
- Critical notifications require reliable delivery
- High email volume during peak times
- Need audit trail of all communications
- Compliance requirements for customer communications

#### Alternatives Considered
1. ❌ AWS SES (similar cost, less flexible templates)
2. ❌ In-house SMTP (maintenance burden, deliverability issues)
3. ✅ SendGrid (chosen - excellent deliverability, good templates, good pricing)

#### Consequences
- ✅ 99%+ inbox delivery rate
- ✅ Built-in templates and webhooks
- ✅ Audit trail integration
- ⚠️ External service dependency
- ⚠️ Cost scales with volume

#### Implementation
- Service: `apps/api/src/services/emailService.js` (246 LOC)
- Tests: `apps/api/src/services/__tests__/emailService.test.js`
- Environment config: See `.env.example`

---

### 4. Document Management (S3 + DocuSign)
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: Medium  

#### Decision
Use AWS S3 for document storage with signed URLs for temporary access. Integrate DocuSign for contract signing workflows requiring legal verification.

#### Context
- Need secure document storage
- Generated reports must be downloadable
- Some documents require legal signatures
- Compliance and audit requirements

#### Alternatives Considered
1. ❌ Local filesystem storage (scalability issues, backup complexity)
2. ❌ Database BLOB storage (performance impact, backup complexity)
3. ✅ S3 + DocuSign (chosen - scalable, secure, audit trail)

#### Consequences
- ✅ Unlimited storage capacity
- ✅ Global distribution via CloudFront
- ✅ Built-in versioning and recovery
- ⚠️ AWS account dependency
- ⚠️ Cost increases with data volume

#### Implementation
- S3 Service: `apps/api/src/services/s3Service.ts` (135 LOC)
- DocuSign Service: `apps/api/src/services/docusignService.ts` (115 LOC)

---

### 5. AI Module Architecture (Role-Based Decision Engines)
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: High  

#### Decision
Implement modular AI decision engines with role-based contracts. Each role (dispatch, customer-ops, driver-coach, fleet-intel) is self-contained with own guardrails and confidence calculations.

#### Context
- Multiple AI use cases require different algorithms
- Confidence scoring needed for all recommendations
- Safety guardrails required (FMCSA compliance, etc.)
- Extensible architecture for new roles

#### Alternatives Considered
1. ❌ Single monolithic AI service (difficult to extend, hard to test)
2. ❌ Third-party AI platform lock-in (vendor dependency, cost)
3. ✅ Modular role engines (chosen - flexible, maintainable, extensible)

#### Consequences
- ✅ Easy to add new AI roles
- ✅ Each role independently testable
- ✅ Clear guardrails and safety measures
- ✅ Transparent confidence scoring
- ⚠️ More code to maintain
- ⚠️ Requires careful quality gates

#### Implementation
- Dispatch: `apps/ai/dispatch/index.ts` (230+ LOC)
- Customer Ops: `apps/ai/customer-ops/index.ts` (270+ LOC)
- Driver Coach: `apps/ai/driver-coach/index.ts` (245+ LOC)
- Fleet Intel: `apps/ai/fleet-intel/index.ts` (265+ LOC)

---

### 6. Structured Logging Strategy
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: High  

#### Decision
Use Winston for structured logging with Sentry integration. All logs must include context (userId, requestId, etc.) and be JSON formatted for parsing.

#### Context
- Production debugging requires structured data
- Performance impact of logging must be minimal
- Audit trail requirements for compliance
- Log levels must be configurable by environment

#### Alternatives Considered
1. ❌ `console.log` only (insufficient for production)
2. ❌ Plain text logging (hard to parse and analyze)
3. ✅ Winston with JSON formatting (chosen - structured, queryable, performant)

#### Consequences
- ✅ Queryable structured logs
- ✅ Automatic Sentry integration
- ✅ Environment-specific log levels
- ✅ Performance optimized
- ⚠️ Requires consistent logging patterns
- ⚠️ Logger configuration must be centralized

#### Implementation
- API Logger: `apps/api/src/utils/logger.js` (109 LOC)
- AI Logger: `apps/ai/utils/logger.ts` (120 LOC)
- Tests: Comprehensive test coverage

---

### 7. Authentication & Authorization
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: Critical  

#### Decision
Use JWT tokens with scope-based authorization. All routes require explicit scope declaration. Rate limiting applied per endpoint and per role.

#### Context
- Support multiple user roles (admin, driver, customer, etc.)
- Some endpoints require rate limiting
- API needs to support mobile and web clients
- Compliance with security best practices

#### Alternatives Considered
1. ❌ Session-based auth (not suitable for mobile)
2. ❌ OAuth2 with third-party provider only (vendor lock-in)
3. ✅ JWT + scope-based auth (chosen - flexible, secure, modern)

#### Consequences
- ✅ Stateless authentication
- ✅ Mobile-friendly (no session cookies required)
- ✅ Granular access control via scopes
- ✅ Rate limiting prevents abuse
- ⚠️ Token revocation requires care
- ⚠️ Scope explosion if not managed

#### Implementation
- Security Middleware: `apps/api/src/middleware/security.js`
- Rate Limits: Configured per endpoint
- Scope Definition: See `packages/shared/src/constants.ts`

---

### 8. Data Validation Strategy
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: Medium  

#### Decision
Use express-validator for input validation with centralized error handling. All user input must be validated before processing. Validation errors returned as structured responses.

#### Context
- Prevent injection attacks
- Ensure data consistency
- Provide clear error messages to clients
- Logging of validation failures

#### Alternatives Considered
1. ❌ Manual validation (error-prone, inconsistent)
2. ❌ Schema validation library (adds dependency and complexity)
3. ✅ express-validator (chosen - lightweight, integrated with Express)

#### Consequences
- ✅ Prevent common injection attacks
- ✅ Consistent validation across endpoints
- ✅ Clear error messages
- ⚠️ Performance impact (minimal)
- ⚠️ Requires validator discipline

#### Implementation
- Validators: `apps/api/src/middleware/validation.js`
- Usage: Applied to all routes with user input

---

### 9. Performance Monitoring & Budgets
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: High  

#### Decision
Implement performance budgets for all critical paths. API endpoints must respond in <500ms (p95), database queries in <200ms, external APIs in <3000ms. Violations trigger Sentry alerts.

#### Context
- User experience requires responsive application
- SLA commitment of 99.9% uptime
- Need early warning of performance degradation
- Performance regression testing required

#### Alternatives Considered
1. ❌ No budgets (reactive problem solving)
2. ❌ Manual monitoring in Datadog only (no automated alerting)
3. ✅ Built-in budgets with Sentry alerts (chosen - proactive monitoring)

#### Consequences
- ✅ Proactive problem identification
- ✅ Early warning of regressions
- ✅ Quantified SLA metrics
- ⚠️ Requires consistent baseline measurement
- ⚠️ May require optimization efforts

#### Implementation
- Performance Monitor: `apps/api/src/services/performanceMonitor.js`
- Budgets defined in service config
- Violations logged and reported to Sentry

---

### 10. Security Headers & CORS
**Status**: ✅ Accepted  
**Date**: February 2026  
**Severity**: Critical  

#### Decision
Use Helmet.js for security headers. CORS configured to allow only known origins. All endpoints require HTTPS in production.

#### Context
- Prevent common web vulnerabilities
- Browser security features require proper headers
- Cross-origin requests must be controlled
- Compliance with security standards

#### Alternatives Considered
1. ❌ Manual header configuration (error-prone)
2. ❌ Allow all origins (security risk)
3. ✅ Helmet + configured CORS (chosen - secure, convenient)

#### Consequences
- ✅ Automatic protection against common attacks
- ✅ Proper CORS handling
- ✅ Security headers enforced
- ⚠️ May need debugging for cross-origin issues
- ⚠️ Requires testing with actual clients

#### Implementation
- Security Middleware: `apps/api/src/middleware/securityHeaders.js`
- CORS config: Set via environment variables

---

## Creating New ADRs

When making significant architectural decisions, create a new ADR following this template:

```markdown
# ADR-NNN: Title

**Status**: Proposed/Accepted/Deprecated  
**Date**: YYYY-MM-DD  
**Severity**: Critical/High/Medium/Low  

## Decision
[Clear statement of the architectural decision]

## Context
[Why this decision was needed, what problem it solves]

## Alternatives Considered
- ❌ Alternative 1 (reason rejected)
- ✅ Chosen approach (reason selected)

## Consequences
- ✅ Positive consequences
- ⚠️ Negative consequences or trade-offs

## Implementation
- [How this decision is implemented in code]
- [Related files and classes]
```

---

## Deprecation Policy

When an ADR becomes obsolete:
1. Mark status as "Deprecated"
2. Document what replaces it
3. Keep for historical reference
4. Plan migration path if applicable

---

## Questions & Discussions

For ADR discussions or proposals, open an issue with the label `adr` on GitHub.

---

**Maintained by**: Architecture Team  
**Last Review**: February 12, 2026  
