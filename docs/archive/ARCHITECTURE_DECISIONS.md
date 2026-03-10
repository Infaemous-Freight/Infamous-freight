/**
 * Architecture Decision Records (ADRs)
 *
 * Documents significant architectural decisions made in the project.
 * Each ADR should contain:
 * - Context: Why the decision was needed
 * - Decision: What was decided
 * - Consequences: Positive and negative impacts
 * - Status: Proposed, Accepted, Deprecated, or Superseded
 *
 * Usage: Record decisions in reverse chronological order
 */

module.exports = [
  {
    id: 'ADR-001',
    title: 'Use PostgreSQL with Prisma ORM',
    date: '2024-01-15',
    status: 'Accepted',
    context: `
      The project needed a reliable relational database for freight management,
      shipment tracking, and user data. Multiple options were evaluated including
      MongoDB, MySQL, and PostgreSQL.
    `,
    decision: `
      Chosen: PostgreSQL with Prisma as the ORM
      - PostgreSQL: Advanced features (JSON, geo-spatial), ACID compliance, open-source
      - Prisma: Auto-generated queries, type-safe, migrations, introspection
    `,
    consequences: {
      positive: [
        'Type-safe database operations prevent SQL injection',
        'Automatic migration versioning prevents data loss',
        'Zero-downtime migrations with Prisma',
        'Built-in relation loading prevents N+1 queries',
        'Schema as code reduces database drift',
      ],
      negative: [
        'Slight performance overhead compared to raw SQL',
        'Learning curve for Prisma-specific patterns',
        'Lock-in to Prisma ecosystem',
      ],
    },
    alternatives: [
      'MongoDB - JavaScript native but eventual consistency issues',
      'MySQL - Good but fewer advanced features',
      'Raw node-postgres - More control but more code',
    ],
  },

  {
    id: 'ADR-002',
    title: 'Monorepo with pnpm Workspaces',
    date: '2024-02-01',
    status: 'Accepted',
    context: `
      The project has multiple related applications (API, Web, Mobile) sharing
      common code, constants, and types. Needed efficient dependency management
      and code sharing.
    `,
    decision: `
      Chosen: pnpm workspaces for monorepo structure
      - API (apps/api): Express.js, CommonJS
      - Web (apps/web): Next.js, ESM/TypeScript
      - Mobile (apps/mobile): React Native/Expo
      - Shared (packages/shared): Common types and utilities
    `,
    consequences: {
      positive: [
        'Single source of truth for shared types and constants',
        'Easy code sharing without npm publishing',
        'Unified dependency management (pnpm lock file)',
        'Single repository checkout for all developers',
        'Atomic commits affecting multiple packages',
        'pnpm is 2-3x faster than npm/yarn',
      ],
      negative: [
        'More complex CI/CD setup',
        'Developers must understand workspace structure',
        'Build order dependencies between packages',
        'Less suitable for unrelated projects',
      ],
    },
    alternatives: [
      'Separate repositories - Easier CI but hard code sharing',
      'npm/yarn workspaces - Less efficient than pnpm',
      'Lerna - Manual orchestration adds complexity',
    ],
  },

  {
    id: 'ADR-003',
    title: 'JWT-based Authentication with Scopes',
    date: '2024-02-05',
    status: 'Accepted',
    context: `
      API needed stateless authentication supporting multiple client types
      (web, mobile, third-party integrations) with fine-grained permissions.
    `,
    decision: `
      JWT tokens with OAuth2 scopes:
      - Tokens include scopes: shipments:read, shipments:write, billing:read, etc.
      - Per-route scope validation prevents unauthorized access
      - Tokens expire after 24 hours
      - Refresh tokens (14 days) allow long-lived sessions
      - Token rotation on each request improves security (in production)
    `,
    consequences: {
      positive: [
        'Stateless - no session management needed',
        'Supports multiple client types simultaneously',
        'Fine-grained access control via scopes',
        'Better security than cookie-based sessions',
        'Standardized format (JWT) - easy integration',
      ],
      negative: [
        'Cannot revoke tokens immediately (until expiry)',
        'Clock skew between servers can cause issues',
        'Token size increases with more scopes',
        'Client must store and manage tokens',
      ],
    },
    tradeoffs: 'Token revocation latency accepted for stateless benefits',
    alternatives: [
      'Session-based auth - Would require session store and synchronization',
      'OAuth2 code flow - Overkill for internal APIs',
      'API keys - Less secure, no per-user usage tracking',
    ],
  },

  {
    id: 'ADR-004',
    title: 'Rate Limiting by Operation Type',
    date: '2024-02-10',
    status: 'Accepted',
    context: `
      API needed protection against abuse. Some operations are more expensive
      than others (AI inference costs, database queries, external API calls).
    `,
    decision: `
      Multiple rate limiters based on operation cost:
      - General: 100 req/15min (most endpoints)
      - Auth: 5 attempts/15min (brute force protection)
      - AI: 20 req/1min (expensive inference)
      - Billing: 30 req/15min (payment operations)
      Uses express-rate-limit with Redis backend
    `,
    consequences: {
      positive: [
        'Protects expensive operations from abuse',
        'Better user experience with per-endpoint limits',
        'Distributed rate limiting across servers (Redis)',
        'Easy to adjust limits per endpoint',
      ],
      negative: [
        'Redis dependency for distributed systems',
        'More complex configuration than global limit',
        'Users may hit limits on less critical operations',
      ],
    },
    monitoring: 'Track rate limit violations in metrics for anomaly detection',
  },

  {
    id: 'ADR-005',
    title: 'API Versioning with URL Paths and Headers',
    date: '2024-02-15',
    status: 'Accepted',
    context: `
      API needs to evolve without breaking existing clients. Multiple versions
      must be supported simultaneously during transition periods.
    `,
    decision: `
      Support three versioning methods (priority order):
      1. URL path: /api/v1/shipments
      2. Header: X-API-Version: v2
      3. Query param: ?apiVersion=v1
      v1 deprecated in December 2026, sunset January 2027
    `,
    consequences: {
      positive: [
        'Multiple migration strategies for different client types',
        'Clear deprecation path for old versions',
        'Version detection is failover-safe',
      ],
      negative: [
        'Support overhead for multiple versions',
        'Complex version-specific response transformation',
        'Testing matrix multiplied by number of versions',
      ],
    },
    migration: 'Clients should migrate to v2 for HATEOAS links and better error handling',
  },

  {
    id: 'ADR-006',
    title: 'Blue-Green Deployments for Zero Downtime',
    date: '2024-02-20',
    status: 'Accepted',
    context: `
      Production deployments needed safety guarantees:
      - Health checks must pass before traffic switch
      - Easy rollback if deployment fails
      - No downtime visible to users
    `,
    decision: `
      Blue-green deployment strategy:
      - Blue: Current production version (running)
      - Green: New version being deployed and tested
      - After smoke tests pass, switch traffic to green
      - Keep blue running for quick rollback
      - Automated rollback if error rate > 10% or latency > 2s
    `,
    consequences: {
      positive: [
        'Zero downtime for deployments',
        'Easy rollback in case of issues',
        'Smoke tests validate depl before production traffic',
        'Gradual monitoring and problem detection',
      ],
      negative: [
        'Running 2x instances during deployment (cost)',
        'Complex load balancer / DNS switching',
        'Database migrations need planning',
        'Potential state sync issues between versions',
      ],
    },
    database: 'Backward-compatible migrations required',
  },

  {
    id: 'ADR-007',
    title: 'Middleware-based Monitoring and Security',
    date: '2024-02-25',
    status: 'Accepted',
    context: `
      API needed consistent security, monitoring, and feature application
      across hundreds of endpoints without repetitive code.
    `,
    decision: `
      Use Express middleware stack for cross-cutting concerns:
      1. Security: JWT auth, rate limiting, Helmet headers
      2. Monitoring: Query performance, response caching, error tracking
      3. Logging: Structured logging to Pino
      4. Validation: Input sanitization and type checking
      Middleware chain applied globally, per-route, or conditionally
    `,
    consequences: {
      positive: [
        'Single place to apply security rules',
        'Reusable across all routes',
        'Easy to add/modify behavior',
        'Cleaner route handlers focus on business logic',
        'Consistent error handling and logging',
      ],
      negative: [
        'Middleware order matters (can be confusing)',
        'Harder to debug if middleware chains break',
        'Performance cost of multiple middleware',
        'Middleware testing requires full requests',
      ],
    },
    testing: 'Integration tests verify middleware chains work correctly',
  },

  {
    id: 'ADR-008',
    title: 'Redis Caching Layer for Performance',
    date: '2024-03-01',
    status: 'Accepted',
    context: `
      Database queries were bottleneck for read-heavy endpoints.
      Need to cache frequently accessed data without adding complexity.
    `,
    decision: `
      Implement intelligent caching layer:
      - Automatic response caching for GET endpoints
      - TTL varies by endpoint (1-60 minutes)
      - Automatic invalidation on mutations
      - Memory-only fallback if Redis unavailable
      - Cache statistics endpoint for monitoring
    `,
    consequences: {
      positive: [
        '90% reduction in database queries for popular endpoints',
        'Significant performance improvement (< 100ms responses)',
        'Automatic invalidation prevents stale data',
        'Fallback works without Redis',
      ],
      negative: [
        'Additional dependency (Redis)',
        'Stale data for up to TTL seconds',
        'Cache invalidation coordination complexity',
        'Memory pressure if not properly configured',
      ],
    },
    operations: 'Monitor cache hit ratio and eviction rates',
  },

  {
    id: 'ADR-009',
    title: 'Containerization with Docker',
    date: '2024-03-05',
    status: 'Accepted',
    context: `
      Project needs consistent deployment across development, staging,
      and production environments. Multiple services in different languages.
    `,
    decision: `
      Docker multi-stage builds:
      - Single Dockerfile.unified with targets: api, web, prisma, dev
      - Minimal production images (~100MB)
      - Separate build and runtime stages
      - Docker Compose for local development
      - Push to Fly.io registry for deployment
    `,
    consequences: {
      positive: [
        'Consistent environments across all stages',
        'Reproducible builds prevent "works on my machine"',
        'Easy to scale horizontally',
        'Clear separation of concerns per service',
      ],
      negative: [
        'Docker learning curve',
        'Container orchestration complexity',
        'Build time overhead',
        'Container security scanning required',
      ],
    },
    security: 'Regular base image updates, CVE scanning in CI/CD',
  },

  {
    id: 'ADR-010',
    title: 'Observability: Structured Logging and Metrics',
    date: '2024-03-10',
    status: 'Accepted',
    context: `
      Needed way to understand system behavior in production:
      - Debug issues without context
      - Track business metrics
      - Audit user actions
      - Alert on anomalies
    `,
    decision: `
      Three-pillar observability strategy:
      1. Logs: Structured JSON logs to Pino (stdout in containers)
      2. Metrics: Prometheus metrics for infrastructure
      3. Traces: Distributed tracing via Sentry
      All include request IDs for correlation
      Sampling at 10% for cost control
    `,
    consequences: {
      positive: [
        'Quick root cause analysis',
        'Audit trail of all operations',
        'Business metrics visible to stakeholders',
        'Proactive alerting on issues',
      ],
      negative: [
        'Observability infrastructure costs',
        'Large log volumes to manage',
        'Privacy concerns with detailed logging',
        'Performance cost of instrumentation',
      ],
    },
    privacy: 'Never log sensitive data (passwords, tokens, PII)',
  },

  {
    id: 'ADR-011',
    title: 'Automated Testing Strategy',
    date: '2024-03-15',
    status: 'Accepted',
    context: `
      Needed confidence that code changes don't break functionality.
      Different test types have different trade-offs.
    `,
    decision: `
      Multi-level testing pyramid:
      - Unit tests: Jest for API business logic (70% coverage)
      - Component tests: Vitest + RTL for Web components (70%)
      - Integration tests: Supertest for full workflows (20%)
      - E2E tests: Playwright for critical user paths (10%)
      - Load tests: k6 for performance regression
    `,
    consequences: {
      positive: [
        'Catches 95% of bugs before production',
        'Fast feedback loop (unit tests < 1s)',
        'Refactoring confidence',
        'Living documentation of features',
      ],
      negative: [
        'Test maintenance overhead',
        'Slower total test suite (10+ minutes)',
        'Mock complexity increases',
        'AI inference tests need synthetic data',
      ],
    },
    ci_cd: 'Tests must pass before merge, coverage reports required',
  },

  {
    id: 'ADR-012',
    title: 'Error Handling and Recovery',
    date: '2024-03-20',
    status: 'Accepted',
    context: `
      API needs consistent error responses and automatic recovery from
      transient failures without manual intervention.
    `,
    decision: `
      Centralized error handling:
      - Global error handler middleware catches all errors
      - Structured error responses with codes
      - Automatic retry with exponential backoff for transient errors
      - Circuit breaker for external service calls
      - Error tracking via Sentry for visibility
    `,
    consequences: {
      positive: [
        'Consistent API error format',
        'Better resilience to transient failures',
        'Automatic recovery improves availability',
        'Error patterns visible for debugging',
      ],
      negative: [
        'Retry logic can mask real issues',
        'Circuit breaker complexity',
        'Error message leakage prevention adds overhead',
      ],
    },
    security: 'Never expose internal error details to clients',
  },
];
