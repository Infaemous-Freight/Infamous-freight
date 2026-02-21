# Secret Rotation Procedures - Infamous Freight Enterprises

Guide for rotating secrets and API keys securely without service downtime.

## Table of Contents

- [Overview](#overview)
- [JWT Secret Rotation](#jwt-secret-rotation)
- [API Key Rotation](#api-key-rotation)
- [Database Credentials](#database-credentials)
- [Third-Party Service Keys](#third-party-service-keys)
- [Emergency Rotation](#emergency-rotation)
- [Audit & Compliance](#audit--compliance)

## Overview

Secret rotation reduces the blast radius if credentials are compromised. Follow
these procedures carefully to maintain security and availability.

**Rotation Frequency**:

- AUTH_SECRET: Quarterly (or immediately if suspected compromise)
- API Keys: Quarterly
- Database passwords: Annually
- Third-party keys: Per service SLA (typically quarterly)

## JWT Secret Rotation

### Scheduled Rotation (No Emergency)

JWT secrets can be rotated with gradual migration since tokens have expiration.

#### Phase 1: Prepare (48 hours before)

1. **Generate new secret**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Store securely** in secrets manager (Railway/Vercel/AWS Secrets Manager)

3. **Create feature flag** (optional):
   ```bash
   # Add environment variable
   JWT_VALID_SECRETS=old-secret,new-secret
   ```

#### Phase 2: Dual Support (1-7 days)

1. **Update API** to accept both secrets:

   ```javascript
   // apps/api/src/middleware/security.js
   const secrets = (process.env.JWT_VALID_SECRETS || "")
     .split(",")
     .map((s) => s.trim());

   // Try validating with each secret
   let payload;
   for (const secret of secrets) {
     try {
       payload = jwt.verify(token, secret);
       break;
     } catch (err) {
       // Try next secret
     }
   }
   ```

2. **Deploy API** with dual support

3. **Monitor for errors**:
   ```bash
   # Check for rejected tokens
   logs: "Invalid or expired token" | stats count()
   ```

#### Phase 3: Complete Migration (After 7 days)

1. **Rotate users to new token** (if using refresh tokens, new tokens
   auto-generated)

2. **Update primary secret**:

   ```bash
   AUTH_SECRET=new-secret
   JWT_VALID_SECRETS=new-secret,old-secret
   ```

3. **Deploy API** with new primary

4. **Monitor** for another 24 hours

#### Phase 4: Cleanup (After 14 days)

1. **Remove old secret** from valid list:

   ```bash
   JWT_VALID_SECRETS=new-secret
   AUTH_SECRET=new-secret
   ```

2. **Deploy API** with only new secret

3. **Document** in CHANGELOG:
   ```
   - [SECURITY] Rotated AUTH_SECRET per quarterly policy
   ```

### Emergency JWT Rotation (Suspected Compromise)

1. **Immediate action**:

   ```bash
   # Generate new secret
   NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

   # Update in secrets manager
   # Railway/Vercel will auto-redeploy
   ```

2. **Revoke all existing tokens** (if header-based token blacklist available):

   ```sql
   -- Pseudocode - implement based on your schema
   UPDATE jwt_tokens SET revoked = true WHERE issued_at < NOW();
   ```

3. **Force users to re-authenticate**:
   - Log out all sessions
   - Require password reset if compromised during payment
   - Clear all refresh tokens

4. **Deploy API** with new secret

5. **Monitor**:
   ```bash
   # Alert on unauthorized errors
   logs: "Invalid token" over 5min | alert if > 100
   ```

## API Key Rotation

### External API Keys (Stripe, OpenAI, SendGrid, etc.)

#### Step 1: Generate New Key

Most services allow creating new keys without deleting old ones:

- **Stripe**: Go to Developers → API Keys → Create new key
- **OpenAI**: API keys → Create new secret key
- **SendGrid**: Settings → API Keys → Create API Key
- **AWS**: IAM → Users → Create access key

#### Step 2: Update Secrets

```bash
# Railway
railway variables set STRIPE_API_SECRET=sk_live_new_key

# Vercel
vercel --environment production env set NEXT_PUBLIC_OPENAI_KEY=sk-...

# Docker/Local
# Update .env file and restart
```

#### Step 3: Test New Key

```bash
# Verify service integration works with new key
pnpm test --testNamePattern="stripe|openai|sendgrid"
```

#### Step 4: Monitor (24 hours)

Watch for auth errors:

```bash
logs: ("401" OR "401 Unauthorized" OR "api_key_invalid") over 24h
```

#### Step 5: Revoke Old Key

- **Stripe**: Delete old key (Developers → API Keys → Revoke)
- **OpenAI**: Delete old key
- **SendGrid**: Delete old key
- **AWS**: Deactivate access key

## Database Credentials

### PostgreSQL Password Rotation

**Prerequisites**: Multi-user database or managed service (Railway, AWS RDS)

#### Step 1: Create New User

```sql
-- Connect as admin (old credentials)
CREATE ROLE new_api_user WITH PASSWORD 'new_strong_password_256_chars';
GRANT CONNECT ON DATABASE infamous_freight TO new_api_user;
GRANT USAGE ON SCHEMA public TO new_api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO new_api_user;
```

#### Step 2: Update App Credentials

```bash
# Prepare new connection string
NEW_DATABASE_URL="postgresql://new_api_user:password@host:5432/infamous_freight"

# Update secrets (don't deploy yet)
railway variables set DATABASE_URL=$NEW_DATABASE_URL
```

#### Step 3: Test New Connection

```bash
# From local machine
PGPASSWORD="password" psql -U new_api_user -d infamous_freight -c "SELECT 1"
```

#### Step 4: Deploy (During low-traffic window)

```bash
# Deploy API with new connection string
railway deploy
```

#### Step 5: Monitor (1 hour)

```bash
# Check for connection errors
logs: ("FATAL: password authentication failed" OR "connection refused") | stats count()
```

#### Step 6: Revoke Old Credentials

```sql
-- Connect with new user
DROP ROLE old_api_user;
```

### Managed Database Services (Railway, AWS RDS)

For managed databases, use provider's rotation features:

**Railway**:

- Data tab → PostgreSQL → Settings → Rotate credentials
- Auto-creates new password and updates connection string

**AWS RDS**:

- RDS Dashboard → Modify → Master password → Apply immediately
- Use AWS Secrets Manager for automatic rotation

## Third-Party Service Keys

### Stripe Webhook Secret Rotation

```bash
# Stripe Dashboard → Webhooks → Your endpoint → Signing secret

# Generate new signing secret
# Stripe typically requires you to rotate via dashboard or API

# Update app
export STRIPE_WEBHOOK_SECRET="whsec_new_secret"

# Deploy API
railway deploy

# Verify webhooks still received
# Check API logs for webhook processing
```

### Sentry DSN Rotation

```bash
# If DSN compromised, creating new project recommended

# Sentry Dashboard → Settings → Projects → Create new project
# Get new DSN and update:
export SENTRY_DSN="https://new_key@sentry.io/new_project_id"

# Deploy and monitor
railroad deploy
logs: "type: Error" | stats count()
```

## Emergency Rotation

Use these procedures if credentials are exposed or leaked.

### Immediate Steps (Within 1 hour)

1. **Identify compromised secret**:
   - Which env var leaked?
   - Which services affected?
   - What's the blast radius?

2. **Disable service access**:
   - Revoke API keys immediately
   - Block using IP/rate limiting (if applicable)
   - Clear any compromised tokens from database

3. **Notify stakeholders**:
   - Security team
   - Affected customers (if applicable)
   - Payment processors (if financial data exposed)

4. **Rotate secret immediately**:
   ```bash
   NEW_SECRET=$(generate-secure-secret)
   railway variables set SECRET_NAME=$NEW_SECRET
   railway deploy
   ```

### Short-term (24 hours)

- Rotate all secrets that might have been exposed
- Review audit logs for suspicious activity
- Change related credentials (SSH keys, database users, etc.)
- Implement additional monitoring

### Long-term

- Post-incident review
- Update secret storage process
- Implement secret scanning in CI/CD
- Add pre-commit hooks to prevent commits with secrets
- Update employee training on secret handling

## Audit & Compliance

### Track All Rotations

Maintain log of secret rotations:

```markdown
# Secret Rotation Log

## 2026-02-14

- **Secret**: AUTH_SECRET
- **Rotation Type**: Scheduled
- **Reason**: Quarterly policy
- **Completed By**: @devops
- **Audit Trail**: Linked to commit abc123
- **Risk**: Low (gradual migration enabled)

## Previous rotations...
```

### Compliance Requirements

- **SOC 2**: Document all access credential changes
- **PCI DSS**: Rotate encryption keys annually
- **HIPAA**: If handling health data, rotate quarterly
- **GDPR**: If data processor, follow data protection requirements

### Audit Checklist

- [ ] Rotation logged in CHANGELOG.md
- [ ] Audit event recorded with timestamp and user
- [ ] New secret stored in secrets manager
- [ ] Old secret revoked after grace period
- [ ] No service downtime during rotation
- [ ] All systems tested with new secret
- [ ] Alerts configured for auth failures

## Testing Rotation Locally

Before production rotation, test locally:

```bash
# Test JWT rotation
AUTH_SECRET=old-secret pnpm test --testNamePattern=auth

AUTH_SECRET=new-secret pnpm test --testNamePattern=auth

# Test database credential change
DATABASE_URL=postgresql://new_user:newpass@localhost/db pnpm test

# Test API key update
STRIPE_API_SECRET=sk_test_new_key pnpm test --testNamePattern=billing
```

## Tools & Services

- **AWS Secrets Manager**: Automatic secret rotation
- **Vault by HashiCorp**: Advanced secret management
- **GitHub Secrets**: Built-in for CI/CD
- **Railway/Vercel**: Environment variable rotation UI
- **TruffleHog**: Detect leaked secrets in git history

## References

- [NIST Secret Rotation](https://csrc.nist.gov/publications/detail/sp/800-63-3)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best_practices.html)
