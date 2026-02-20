/**
 * API Troubleshooting Guide
 *
 * Common issues, diagnostic procedures, and solutions
 * Use this guide to debug problems in development and production
 *
 * For urgent issues, escalate to on-call engineer (see OPERATIONS-RUNBOOK.md)
 */

module.exports = {
  // ============================================================================
  // Authentication Issues
  // ============================================================================
  authentication: {
    'Login fails with 401': {
      description: 'User cannot login, receives "Invalid credentials" error',
      diagnosis: [
        '1. Verify user email exists in database: SELECT * FROM users WHERE email = ?',
        '2. Check password reset needed: SELECT last_password_change FROM users WHERE email = ?',
        '3. Verify account not suspended: SELECT status FROM users WHERE email = ?',
        '4. Check rate limiting: curl -H "Authorization: Bearer test" http://localhost:4000/api/auth/login',
      ],
      solutions: [
        {
          cause: 'User does not exist',
          fix: 'Create user account in admin panel or database',
        },
        {
          cause: 'Password incorrect (tried too many times)',
          fix: 'Wait 15 minutes for rate limit reset, or admin override',
        },
        {
          cause: 'Account suspended',
          fix: 'Contact admin to unsuspend, or update database: UPDATE users SET status = "active" WHERE id = ?',
        },
        {
          cause: 'Database connection issue',
          fix: 'Check DATABASE_URL env var and database connectivity',
        },
      ],
      logs: 'Check logs: tail -f apps/api/logs/error.log | grep "auth"',
      test: 'curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"user@example.com","password":"password"}\'',
    },

    'Token invalid or expired': {
      description: 'API request fails with "Token invalid" or 401 Unauthorized',
      diagnosis: [
        '1. Decode token to check expiry: JWT=token; echo $JWT | cut -d. -f2 | base64 -d',
        '2. Check token format: Should be "Bearer <token>" in Authorization header',
        '3. Verify JWT_SECRET matches: echo $JWT_SECRET',
        '4. Check token timestamp vs server time: date -u',
      ],
      solutions: [
        {
          cause: 'Token expired',
          fix: 'Refresh token: curl -X POST http://localhost:4000/api/auth/refresh -d \'{"refreshToken":"..."}\' ',
        },
        {
          cause: 'JWT_SECRET changed',
          fix: 'All tokens invalid until users re-login. Update JWT_SECRET to old value or force logout all users',
        },
        {
          cause: 'Clock skew between servers',
          fix: 'Sync NTP: timedatectl set-ntp true',
        },
        {
          cause: 'Malformed Authorization header',
          fix: 'Use format: Authorization: Bearer eyJhbGci...',
        },
      ],
    },

    'Scope validation fails': {
      description: 'Request fails with "Insufficient scope" but user should have access',
      diagnosis: [
        '1. Decode token and check scopes: JWT=token; echo $JWT | cut -d. -f2 | base64 -d',
        '2. Check required scopes for endpoint: grep -r "requireScope" apps/api/src/routes/',
        '3. Verify user role has scope: SELECT scopes FROM users WHERE id = ?',
        '4. Check middleware order: Ensure requireScope comes after authenticate',
      ],
      solutions: [
        {
          cause: 'Token missing scope',
          fix: 'Re-login to get new token with all scopes, or update user in database',
        },
        {
          cause: 'Endpoint scopes recently changed',
          fix: 'Scopes are encoded in token at login time. User must logout and login again',
        },
        {
          cause: 'User role changed in database',
          fix: 'Token not updated. User must re-login, or invalidate session and force re-auth',
        },
      ],
    },
  },

  // ============================================================================
  // Performance Issues
  // ============================================================================
  performance: {
    'API response slow (> 1000ms)': {
      description: 'API endpoint returns valid response but slowly',
      diagnosis: [
        '1. Check endpoint latency: curl -w "Time: %{time_total}s" http://localhost:4000/api/endpoint',
        '2. Check database query time: Enable query logging in Prisma',
        '3. Check cache hit rate: curl http://localhost:4000/api/metrics/cache',
        '4. Check slow queries: SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10',
        '5. Check memory usage: free -h or docker stats',
        '6. Check CPU usage: top -p $(pgrep -f "node.*api")',
      ],
      solutions: [
        {
          cause: 'N+1 query problem',
          fix: 'Use .include() in Prisma to batch load relations, or implement DataLoader',
        },
        {
          cause: 'Cache miss on popular endpoint',
          fix: 'Cache TTL too short or cache invalidation too aggressive. Increase TTL in smartCache middleware',
        },
        {
          cause: 'Database connection pool exhaust ed',
          fix: 'Increase DATABASE_CONNECTION_LIMIT env var, or reduce concurrent queries',
        },
        {
          cause: 'Large result set',
          fix: 'Add pagination limits, or filter results in database instead of client',
        },
        {
          cause: 'External service call slow',
          fix: 'Implement timeout and fallback, or cache response',
        },
      ],
      optimization: 'Use query monitoring middleware to identify slow queries automatically',
    },

    'High memory usage': {
      description: 'API process using > 500MB RAM or growing unbounded',
      diagnosis: [
        '1. Check memory in container: docker stats $CONTAINER_ID',
        '2. Check Node memory: node --inspect &, then chrome://inspect',
        '3. Check for memory leaks: Check event listener accumulation',
        '4. Check cache size: curl http://localhost:4000/api/metrics/cache',
      ],
      solutions: [
        {
          cause: 'Memory cache too large',
          fix: 'Reduce cache TTL or implement LRU eviction. Set CACHE_MAX_ITEMS=1000',
        },
        {
          cause: 'Event listener leak',
          fix: 'Ensure all listeners removed: emitter.removeListener("event", handler)',
        },
        {
          cause: 'Database result cached in memory',
          fix: 'Implement pagination to limit result size',
        },
        {
          cause: 'Large number of connections',
          fix: 'Reduce DATABASE_CONNECTION_LIMIT or add connection pooling',
        },
      ],
    },

    'Database connection errors': {
      description: 'Requests fail with "Connection pool timeout" or "Cannot connect"',
      diagnosis: [
        '1. Check database connectivity: psql $DATABASE_URL -c "SELECT 1"',
        '2. Check connection count: SELECT count(*) FROM pg_stat_activity',
        '3. Check max connections: SHOW max_connections',
        '4. Check DATABASE_URL: echo $DATABASE_URL (check password, host, port)',
        '5. Check network: ping $DB_HOST',
      ],
      solutions: [
        {
          cause: 'Connection pool exhausted',
          fix: 'Increase DATABASE_CONNECTION_LIMIT (default 20) to 50 or more',
        },
        {
          cause: 'Database not accepting connections',
          fix: 'Restart PostgreSQL: systemctl restart postgresql or docker restart postgres-container',
        },
        {
          cause: 'Network connectivity',
          fix: 'Check firewall rules, security groups, and network routes',
        },
        {
          cause: 'Invalid DATABASE_URL',
          fix: 'Verify format: postgresql://user:password@host:port/database?options=value',
        },
      ],
    },
  },

  // ============================================================================
  // Data/State Issues
  // ============================================================================
  data: {
    'Shipment status stuck in "in_transit"': {
      description: 'Shipment never updates to "delivered" even though driver reported completion',
      diagnosis: [
        '1. Check shipment in database: SELECT * FROM shipments WHERE id = ?',
        '2. Check tracking events: SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY timestamp DESC',
        '3. Check for stuck API calls: curl http://localhost:4000/api/shipments/$ID',
        '4. Check for failed webhooks: SELECT * FROM webhook_logs WHERE shipment_id = ? AND status != "success"',
      ],
      solutions: [
        {
          cause: 'Driver never submitted delivery proof',
          fix: 'Contact driver, or admin override: UPDATE shipments SET status = "delivered" WHERE id = ?',
        },
        {
          cause: 'Webhook delivery failed',
          fix: 'Retry webhook: POST /api/admin/webhooks/retry/$webhookId',
        },
        {
          cause: 'Status update endpoint broken',
          fix: 'Check server logs for errors during PATCH /api/shipments/$ID',
        },
        {
          cause: 'Cache showing old status',
          fix: 'Clear cache: redis-cli FLUSHDB or DELETE /api/admin/cache/*',
        },
      ],
    },

    'Inconsistent user data across services': {
      description: 'User data differs between API, Web, and Mobile apps',
      diagnosis: [
        '1. Query user from API: curl http://localhost:4000/api/users/$ID',
        '2. Check cache: redis-cli GET user:$ID',
        '3. Query database: SELECT * FROM users WHERE id = ?',
        '4. Check sync logs: grep "user_sync" apps/api/logs/*.log',
      ],
      solutions: [
        {
          cause: 'Cache not invalidated',
          fix: 'Clear user cache: redis-cli DEL user:$ID, then refresh',
        },
        {
          cause: 'Database replication lag',
          fix: 'Wait for replication to catch up (typically < 100ms)',
        },
        {
          cause: 'Concurrent update conflict',
          fix: 'Implement optimistic locking with version field',
        },
      ],
    },

    'Duplicate shipments created': {
      description: 'Same shipment appears twice in database',
      diagnosis: [
        '1. Find duplicates: SELECT id, origin, destination, COUNT(*) FROM shipments GROUP BY origin, destination HAVING COUNT(*) > 1',
        '2. Check creation timestamps: SELECT * FROM shipments WHERE origin = ? AND destination = ? ORDER BY created_at',
        '3. Check client logs: "Submitted shipment twice" messages',
      ],
      solutions: [
        {
          cause: 'Client double-clicked submit button',
          fix: 'Frontend error - disable button after first click',
        },
        {
          cause: 'Network timeout, client retried',
          fix: 'Implement idempotent inserts with unique constraint on (userId, shipmentHash)',
        },
        {
          cause: 'Race condition in concurrent requests',
          fix: 'Add unique constraint or database-level check',
        },
        {
          cause: 'Manual deletion of duplicate: DELETE FROM shipments WHERE id = ?',
          fix: 'Use database transaction to ensure referential integrity',
        },
      ],
    },
  },

  // ============================================================================
  // Deployment Issues
  // ============================================================================
  deployment: {
    'Deployment stuck or times out': {
      description: 'Blue-green deployment not progressing, health checks failing',
      diagnosis: [
        '1. Check green version status: flyctl status -a $APP_NAME-green',
        '2. Check health endpoint: curl http://$APP_NAME-green.fly.dev/api/health',
        '3. Check logs: flyctl logs -a $APP_NAME-green | tail -100',
        '4. Check database migrations: psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations"',
      ],
      solutions: [
        {
          cause: 'Health check failing',
          fix: 'Fix the error in green version, then retry deployment',
        },
        {
          cause: 'Database migration broken',
          fix: 'Rollback migration: prisma migrate resolve --rolled-back <migration>',
        },
        {
          cause: 'Image pull timeout',
          fix: 'Rebuild image: docker build -t image:tag . && docker push image:tag',
        },
        {
          cause: 'Memory limit too low',
          fix: 'Increase VM memory in fly.toml: processes.api.env.MEMORY_LIMIT = "1GB"',
        },
      ],
      manual_fix: 'Manual rollback: ./deploy-blue-green.sh rollback api',
    },

    'Traffic still going to old version after deployment': {
      description: 'Deployment completed but clients still see old version',
      diagnosis: [
        '1. Check load balancer routing: curl -H "Host: api.example.com" http://127.0.0.1',
        '2. Check DNS cache: nslookup api.example.com',
        '3. Check Fly app details: flyctl info -a $APP_NAME',
        '4. Check version header: curl -I http://localhost:4000/api/health | grep X-Version',
      ],
      solutions: [
        {
          cause: 'DNS cache has old IP',
          fix: 'Clear local DNS cache: sudo dscacheutil -flushcache (macOS) or sudo systemctl restart systemd-resolved (Linux)',
        },
        {
          cause: 'CDN cache has old content',
          fix: 'Purge CDN cache: POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache',
        },
        {
          cause: 'Load balancer not updated',
          fix: 'Manually update load balancer configuration and verify traffic split',
        },
        {
          cause: 'Browser cache',
          fix: 'Client must clear browser cache (Ctrl+Shift+Delete), or server set Cache-Control: no-cache',
        },
      ],
    },
  },

  // ============================================================================
  // External Service Issues
  // ============================================================================
  external_services: {
    'Stripe payment fails': {
      description: 'Payment endpoint returns error, no charge created',
      diagnosis: [
        '1. Check Stripe API response: tail -f apps/api/logs/billing.log',
        '2. Check Stripe dashboard for failed charges: https://dashboard.stripe.com/payments',
        '3. Check test mode vs live: echo $STRIPE_SECRET_KEY',
        '4. Verify webhook receiving: https://dashboard.stripe.com/webhooks',
      ],
      solutions: [
        {
          cause: 'Invalid card token',
          fix: 'Use Stripe test cards: 4242424242424242 (success), 4000002500003155 (decline)',
        },
        {
          cause: 'Webhook endpoint unreachable',
          fix: 'Add firewall rule to allow Stripe IPs, or check URL in webhook config',
        },
        {
          cause: 'Amount too low/high',
          fix: 'Check minimum $0.50 and maximum $999,999.99',
        },
        {
          cause: 'API key invalid/expired',
          fix: 'Rotate API keys in Stripe dashboard, update STRIPE_SECRET_KEY',
        },
      ],
    },

    'AI inference service unavailable': {
      description: 'AI endpoints return error, inference fails',
      diagnosis: [
        '1. Check provider status: curl $OPENAI_API_BASE/health (if using OpenAI)',
        '2. Check API key: echo $OPENAI_API_KEY',
        '3. Check quota: OpenAI dashboard → API keys → Usage',
        '4. Check fallback mode: echo $AI_PROVIDER (should be "synthetic" if error)',
      ],
      solutions: [
        {
          cause: 'Provider outage',
          fix: 'Check provider status page, wait for service restoration, or switch provider',
        },
        {
          cause: 'API key invalid',
          fix: 'Generate new key in OpenAI dashboard, update env var',
        },
        {
          cause: 'Rate limit exceeded',
          fix: 'Wait 1 hour, upgrade plan, or implement request queueing',
        },
        {
          cause: 'Network timeout',
          fix: 'Increase AI_REQUEST_TIMEOUT_MS (default 30000), or implement retry',
        },
      ],
      fallback: 'Synthetic AI provider returns mock responses when real provider fails',
    },

    'Email delivery failing': {
      description: 'Transactional emails not received by users',
      diagnosis: [
        '1. Check email service status: AWS SES dashboard or SendGrid dashboard',
        '2. Check send logs: grep "email_send_error" apps/api/logs/*.log',
        '3. Check spam folder: Users may have marked emails as spam',
        '4. Verify sender email: echo $SENDGRID_FROM_EMAIL or aws ses describe-configuration-set',
      ],
      solutions: [
        {
          cause: 'Sandbox environment',
          fix: 'AWS SES: Verify recipient email in sandbox, or request production access',
        },
        {
          cause: 'Sender reputation low (many bounces)',
          fix: 'Implement bounce handling, remove bad emails from list',
        },
        {
          cause: 'Email template broken',
          fix: 'Check template syntax, verify variables present',
        },
        {
          cause: 'Rate limited',
          fix: 'AWS SES default 1 email/second. Increase sending rate limit',
        },
      ],
    },
  },

  // ============================================================================
  // Common Commands and Tools
  // ============================================================================
  debugging_tools: {
    'Check API health': 'curl -s http://localhost:4000/api/health | jq',
    'Tail logs': 'docker logs -f $CONTAINER_ID',
    'Check database': 'psql $DATABASE_URL -c "SELECT * FROM information_schema.tables"',
    'Clear cache': 'redis-cli FLUSHDB',
    'Restart service': 'docker-compose restart api',
    'View database schema': 'npx prisma studio',
    'Check environment': 'env | grep -E "^[A-Z_]+" | sort',
    'Test endpoint': 'curl -v -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/endpoint',
    'Check ports': 'lsof -i :4000 (API) or lsof -i :3000 (Web)',
  },

  // ============================================================================
  // Getting Help
  // ============================================================================
  escalation: {
    'Still can\'t fix it?': [
      '1. Check OPERATIONS-RUNBOOK.md for emergency procedures',
      '2. Check recent commits: git log --oneline -10',
      '3. Check monitoring dashboards: Datadog, Sentry, New Relic',
      '4. Check infrastructure status: AWS/GCP/Fly.io status pages',
      '5. Escalate to on-call engineer with: logs, error messages, what changed',
    ],
    'Emergency escalation': 'Page on-call engineer: PagerDuty or Slack @chaos',
    'Runbook for critical incidents': 'See OPERATIONS-RUNBOOK.md',
  },
};
