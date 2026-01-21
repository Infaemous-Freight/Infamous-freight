# CORS Configuration & Security Guide

## Environment Variables

Configure CORS origins in `.env`:

```bash
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000,https://app.infamous-freight.com,https://mobile.infamous-freight.com
```

## How It Works

1. **Allow-list validation**: Only origins in `CORS_ORIGINS` are allowed to make cross-origin requests.
2. **Server-to-server exempt**: Requests without an `Origin` header bypass CORS checks (backend-to-backend calls).
3. **Credentials allowed**: Cookies and auth headers are permitted from allowed origins.

## Security Best Practices

✅ **DO:**
- Use HTTPS origins in production
- Maintain a strict allow-list
- Exclude localhost if not developing locally
- Log unauthorized CORS attempts (via Sentry)

❌ **DON'T:**
- Set `CORS_ORIGINS=*` in production
- Allow arbitrary subdomains with wildcards
- Trust `Origin` header blindly

## Testing CORS

Verify allowed origins:

```bash
# Should succeed (in allow-list)
curl -H "Origin: https://app.infamous-freight.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:4000/api/shipments -v

# Should fail (not in allow-list)
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:4000/api/shipments -v
```

## Helm/Helmet CSP Headers

Content Security Policy is enforced via Helmet middleware:

```javascript
// Default CSP in middleware/securityHeaders.js
defaultSrc: ["'self'"]
scriptSrc: ["'self'", "https://cdn.vercel-insights.com", ...]
styleSrc: ["'self'", "'unsafe-inline'"]
```

CSP violations are reported to `/api/csp-violation` and logged to Sentry.

## Rate Limiting by Origin

Rate limiters respect organization context. Clients from different origins are rate-limited separately per user/org:

```javascript
keyGenerator: (req) => req.user?.sub || req.ip,
```

This prevents cross-origin DoS attacks while allowing legitimate multi-origin traffic.
