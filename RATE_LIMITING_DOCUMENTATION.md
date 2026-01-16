# API Rate Limiting Configuration & Documentation

## Overview

Rate limiting protects the API from abuse and ensures fair resource allocation. The system uses Express Rate Limit with Redis backing for distributed environments.

## Rate Limiters Summary

| Limiter | Window | Max | Purpose |
|---------|--------|-----|---------|
| **General** | 15 min | 100 | Default for most endpoints |
| **Auth** | 15 min | 5 | Login, register, password reset |
| **AI** | 1 min | 20 | AI command processing |
| **Billing** | 15 min | 30 | Payment operations |
| **Voice** | 1 min | 10 | Voice uploads & processing |
| **Export** | 60 min | 5 | Data exports, reports |
| **Password Reset** | 24 hr | 3 | Password reset requests |
| **Webhook** | 1 min | 100 | Webhook processing |

## Configuration

### Environment Variables
```bash
# General limiter
RATE_LIMIT_GENERAL_WINDOW_MS=15      # Window in minutes
RATE_LIMIT_GENERAL_MAX=100           # Requests per window

# Authentication limiter
RATE_LIMIT_AUTH_WINDOW_MS=15
RATE_LIMIT_AUTH_MAX=5

# AI limiter
RATE_LIMIT_AI_WINDOW_MS=1            # 1 minute
RATE_LIMIT_AI_MAX=20                 # 20 requests/minute

# Billing limiter
RATE_LIMIT_BILLING_WINDOW_MS=15
RATE_LIMIT_BILLING_MAX=30

# Voice limiter
RATE_LIMIT_VOICE_WINDOW_MS=1
RATE_LIMIT_VOICE_MAX=10

# Export limiter
RATE_LIMIT_EXPORT_WINDOW_MS=60       # 60 minutes
RATE_LIMIT_EXPORT_MAX=5

# Password reset limiter
RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=24  # 24 hours
RATE_LIMIT_PASSWORD_RESET_MAX=3

# Webhook limiter
RATE_LIMIT_WEBHOOK_WINDOW_MS=1
RATE_LIMIT_WEBHOOK_MAX=100
```

## Endpoint Rate Limiting

### Authentication Endpoints
```javascript
POST   /api/auth/login          → limiters.auth (5/15min)
POST   /api/auth/register       → limiters.auth (5/15min)
POST   /api/auth/refresh        → limiters.auth (5/15min)
POST   /api/auth/password-reset → limiters.passwordReset (3/24hr)
```

### AI Endpoints
```javascript
POST   /api/ai/commands         → limiters.ai (20/1min)
POST   /api/ai/synthetic        → limiters.ai (20/1min)
GET    /api/ai/models           → limiters.general (100/15min)
```

### Billing Endpoints
```javascript
POST   /api/billing/create-session       → limiters.billing (30/15min)
POST   /api/billing/webhook/stripe       → limiters.billing (30/15min)
POST   /api/billing/webhook/paypal       → limiters.billing (30/15min)
GET    /api/billing/invoices/:id         → limiters.general (100/15min)
```

### Voice Endpoints
```javascript
POST   /api/voice/ingest        → limiters.voice (10/1min)
POST   /api/voice/command       → limiters.voice (10/1min)
GET    /api/voice/history       → limiters.general (100/15min)
```

### Data Export Endpoints
```javascript
POST   /api/shipments/export    → limiters.export (5/60min)
POST   /api/reports/export      → limiters.export (5/60min)
GET    /api/data/download       → limiters.export (5/60min)
```

### General Endpoints
```javascript
GET    /api/shipments           → limiters.general (100/15min)
POST   /api/shipments           → limiters.general (100/15min)
GET    /api/users/:id           → limiters.general (100/15min)
PUT    /api/users/:id           → limiters.general (100/15min)
DELETE /api/shipments/:id       → limiters.general (100/15min)
```

## Rate Limit Headers

All responses include rate limit information:

```
RateLimit-Limit: 100                    # Max requests in window
RateLimit-Remaining: 95                 # Requests remaining
RateLimit-Reset: 1705349200             # Unix timestamp when limit resets
Retry-After: 300                        # Seconds to wait (on 429 responses)
```

## Error Responses

### 429 Too Many Requests
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "resetTime": "2024-01-15T21:00:00Z"
}
```

### Rate Limit Exceeded by Category
```json
{
  "error": "AI service rate limit exceeded.",
  "limit": 20,
  "window": "1 minute",
  "retryAfter": 60
}
```

## Implementation Details

### Key Generation
Rate limits are keyed by:
- **Authenticated users**: `req.user.sub` (user ID)
- **Unauthenticated requests**: `req.ip` (IP address)
- **Auth endpoints**: `req.ip` (IP-based to prevent brute force)
- **Billing endpoints**: `req.user.sub` (prevent payment abuse)

### Exclusions
Health check endpoint skips rate limiting:
```
GET /api/health
GET /api/health/live
```

## Customization

### Increase Limit for Trusted Users
```javascript
// Custom middleware
function isTrustedUser(req, res, next) {
  const trustedIds = ['user-123', 'user-456'];
  if (trustedIds.includes(req.user?.sub)) {
    req.skipRateLimit = true;  // Middleware respects this flag
  }
  next();
}

// Use in routes
router.post('/action', isTrustedUser, limiters.general, handler);
```

### Dynamic Rate Limiting
```javascript
// Adjust limits based on subscription tier
function getDynamicLimiter(req, res, next) {
  const tier = req.user?.subscription?.tier || 'free';
  const limits = {
    free: 100,
    pro: 500,
    enterprise: 5000
  };
  req.rateLimitMax = limits[tier];
  next();
}
```

### Whitelist IPs
```javascript
const createLimiter = (options) => rateLimit({
  ...options,
  skip: (req) => {
    // Skip rate limiting for health checks and whitelisted IPs
    const whitelist = ['127.0.0.1', '::1'];
    return req.path === '/api/health' || whitelist.includes(req.ip);
  },
});
```

## Monitoring & Alerts

### Key Metrics
- Request rate per endpoint
- Rate limit hit percentage
- 429 response count by limiter
- User IDs hitting limits frequently

### Recommended Alerts
- `>50%` of requests hitting rate limits
- Single IP causing `>1000` requests/minute
- Spike in `429` responses (>100/minute)

### Logging
```javascript
// Log when rate limit is hit
app.use((req, res, next) => {
  if (res.statusCode === 429) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.sub,
      endpoint: req.originalUrl,
      limiter: req.rateLimit?.limiter,
    });
  }
  next();
});
```

## Best Practices

### Client-Side
1. **Respect Rate Limits**: Check `RateLimit-Remaining` header
2. **Implement Backoff**: Use exponential backoff on 429 responses
3. **Cache Responses**: Reduce request frequency
4. **Batch Requests**: Combine multiple operations when possible

### Server-Side
1. **Monitor Constantly**: Set up alerts for rate limit metrics
2. **Adjust Limits**: Based on actual usage patterns
3. **Document Limits**: Communicate limits to API consumers
4. **Gradual Rollout**: Test limit changes in staging first

### Example Client Implementation
```javascript
async function apiCall(endpoint, options = {}) {
  let retries = 3;
  let delay = 1000;  // Start with 1 second

  while (retries > 0) {
    try {
      const response = await fetch(endpoint, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        delay = (retryAfter ? parseInt(retryAfter) : delay * 2) * 1000;
        
        if (retries > 1) {
          await new Promise(r => setTimeout(r, delay));
          retries--;
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (retries > 1) {
        await new Promise(r => setTimeout(r, delay));
        retries--;
      } else {
        throw error;
      }
    }
  }
}
```

## Troubleshooting

### "Rate limit exceeded" for legitimate user
1. Check IP address changes (VPN, mobile network)
2. Verify user subscription tier
3. Adjust user-specific limit if needed
4. Implement caching to reduce requests

### Rate limiter not working
1. Verify Redis connection (if using Redis)
2. Check environment variables are set
3. Ensure middleware is applied in correct order
4. Test with simple request: `curl -i http://localhost:4000/api/health`

### False positives (legitimate requests blocked)
1. Review rate limit configuration
2. Check IP whitelisting
3. Implement trusted user logic
4. Monitor trends and adjust thresholds

## References

- [express-rate-limit docs](https://github.com/nfriedly/express-rate-limit)
- [API Security Best Practices](SECURITY.md)
- [Rate Limiting Middleware](api/src/middleware/security.js)
