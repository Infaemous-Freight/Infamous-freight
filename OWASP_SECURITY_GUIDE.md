# OWASP Top 10 Security Enhancements

## 1. Broken Access Control

- Enforce scope-based auth on every route (`authenticate` + `requireScope`/`requireRole`).
- Validate ownership for user resources (`validateUserOwnership`).
- Deny by default: missing auth → 401; insufficient scope → 403.
- Implement resource-level checks in Prisma queries (where clauses include userId/tenantId).

## 2. Cryptographic Failures

- Use TLS (https) everywhere; HSTS header (`Strict-Transport-Security`).
- Strong JWT secret (32+ chars); rotate via `ENABLE_TOKEN_ROTATION=true`.
- Hash passwords with bcrypt cost 12+; never store plaintext.
- Encrypt sensitive env vars in secret manager (no .env in repo).

## 3. Injection

- Use Prisma parameter binding (no string concatenation).
- Validate all inputs with Zod schemas; reject unsafe characters where applicable.
- Sanitize headers/params for logs; never log tokens/passwords.
- Use parameterized raw queries only when necessary, never string interpolation.

## 4. Insecure Design

- Threat model critical flows (auth, payments, AI commands, voice ingest).
- Apply rate limits per route category (general/auth/ai/billing/voice/export).
- Enforce MFA for admins and billing actions.
- Require feature flags for risky releases.

## 5. Security Misconfiguration

- Default-deny CORS; set `CORS_ORIGINS` explicitly.
- Helmet middleware: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin.
- Disable x-powered-by; set secure cookies; `SameSite=strict` for auth cookies.
- Use read-only DB users for replicas; least privilege for service accounts.

## 6. Vulnerable & Outdated Components

- `pnpm audit` in CI; add Snyk scanning.
- Pin dependency versions; renovate schedule weekly.
- Track Prisma/PostgreSQL versions; apply security patches monthly.
- Block usage of unmaintained packages; maintain SBOM (CycloneDX).

## 7. Identification & Authentication Failures

- Enforce JWT expiry (24h) + refresh tokens with rotation.
- MFA (TOTP/email) required for admin/billing.
- Account lockout after 5 failed logins (rate limiter `auth`).
- Session revocation on password change and logout.

## 8. Software & Data Integrity Failures

- Verify payload signatures on webhooks (Stripe/PayPal) with secrets.
- Sign internal service requests with HMAC (shared secret) + timestamp + nonce.
- Protect build pipeline: branch protection, signed commits optional, CI secrets scoped.
- Use checksums for artifacts; lockfiles immutable in CI.

## 9. Security Logging & Monitoring Failures

- Centralize logs (winston + Datadog/Sentry); include correlation IDs.
- Alert on auth failures spikes, 5xx surge, rate-limit breaches.
- Store audit logs for admin actions (create/delete shipment, billing changes).
- Retain logs 30-90 days; redact PII/PCI.

## 10. Server-Side Request Forgery (SSRF)

- Block localhost/169.254.169.254/metadata IPs in outbound HTTP client.
- Maintain allowlist for external domains; reject user-provided full URLs unless validated.
- Disable redirects in axios unless explicitly needed.

## Hardening Checklist

- [ ] All routes use `authenticate` + scope/role guard.
- [ ] Input validated by Zod schemas; no raw concatenated SQL.
- [ ] Helmet + CORS configured; HSTS enabled in production.
- [ ] MFA enforced for privileged roles.
- [ ] Rate limits active for auth, AI, billing, voice, exports.
- [ ] Webhooks verified with signature + timestamp.
- [ ] Logs shipped centrally with correlation IDs; alerts configured.
- [ ] Dependency scans in CI; lockfile enforced.
- [ ] SSRF protections in outbound HTTP client.
- [ ] Secrets stored outside repo; JWT secret length >= 32 chars.

## Sample SSRF Guard (Axios)

```javascript
const url = require('url');
const dns = require('dns').promises;

async function assertSafeUrl(targetUrl) {
  const parsed = new url.URL(targetUrl);
  const host = parsed.hostname;
  const ips = await dns.lookup(host, { all: true });

  const blockedCidrs = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'];
  const isPrivate = (ip) => blockedCidrs.some((cidr) => ip.startsWith(cidr.split('/')[0]));

  if (ips.some((entry) => isPrivate(entry.address))) {
    throw new Error('Blocked internal address');
  }
}

async function safeGet(urlStr) {
  await assertSafeUrl(urlStr);
  return axios.get(urlStr, { maxRedirects: 0 });
}
```

## Sample HMAC Signing (Internal Services)

```javascript
const crypto = require('crypto');

function signPayload(body, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${timestamp}.${nonce}.${JSON.stringify(body)}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { signature, timestamp, nonce };
}

function verifySignature({ signature, timestamp, nonce, body }, secret, toleranceSec = 300) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) throw new Error('Stale request');
  const payload = `${timestamp}.${nonce}.${JSON.stringify(body)}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid signature');
  }
}
```
