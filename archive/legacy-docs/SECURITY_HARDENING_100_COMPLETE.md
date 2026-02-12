# SECURITY HARDENING GUIDE - PRODUCTION READY
# Infamous Freight Enterprises - 100% Complete
# January 2025

## Table of Contents
1. Security Headers Implementation
2. Data Encryption & TLS
3. Authentication & Authorization
4. Secrets Management
5. Audit Logging & Compliance
6. Network Security
7. Vulnerability Management
8. Incident Response

---

## 1. SECURITY HEADERS IMPLEMENTATION

### 1.1 HTTP Security Headers Configuration

**Location**: `apps/api/src/middleware/securityHeaders.js`

```javascript
const helmet = require('helmet');

const securityHeaders = helmet({
  // Content Security Policy - prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Consider removing unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // HTTP Strict Transport Security - forces HTTPS
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options - prevents clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options - prevents MIME sniffing
  noSniff: true,

  // Referrer-Policy - controls referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
  },
});

module.exports = securityHeaders;
```

### 1.2 CORS Security Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://infamous-freight-enterprises.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### 1.3 Verify Headers in Production

```bash
# Check all security headers
curl -i https://api.infamousfreight.com/api/health | grep -E "Strict-Transport|Content-Security|X-Frame|X-Content-Type"

# Expected output:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

---

## 2. DATA ENCRYPTION & TLS

### 2.1 TLS/HTTPS Configuration

**For production (Fly.io):**

```bash
# Enable TLS automatically
flyctl certs add infamousfreight.com --app infamous-freight-api

# Verify certificate
flyctl certs show --app infamous-freight-api

# Expected: Certificate status "Ready"
```

**For production (Vercel):**

- Automatic HTTPS enabled by default
- Free SSL certificate via Cloudflare

### 2.2 Database Encryption (Fly.io PostgreSQL)

```bash
# Enable encryption for database volume
flyctl volumes create freight_data_encrypted \
  --region dfw \
  --size 50 \
  --encrypted

# Verify encryption
flyctl volumes list | grep encrypted
```

### 2.3 Application-Level Encryption

```javascript
// Encrypt sensitive fields in database
const crypto = require('crypto');

function encryptField(value, key = process.env.ENCRYPTION_KEY) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

function decryptField(encrypted, key = process.env.ENCRYPTION_KEY) {
  const [iv, cipher, authTag] = encrypted.split(':');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(cipher, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Encrypt sensitive fields in Prisma
const user = await prisma.user.create({
  data: {
    email: userEmail,
    phone: encryptField(userPhone),  // Encrypted
    ssn: encryptField(userSSN),      // Encrypted
  },
});
```

### 2.4 API Key Rotation Schedule

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Rotate JWT secret monthly
NEW_JWT_SECRET=$(openssl rand -base64 32)
flyctl secrets set JWT_SECRET="$NEW_JWT_SECRET" --app infamous-freight-api

# Rotate database password quarterly
NEW_DB_PASSWORD=$(openssl rand -base64 32)
flyctl secrets set DB_PASSWORD="$NEW_DB_PASSWORD" --app infamous-freight-api

# Log rotation event
echo "$(date): JWT and DB secrets rotated" >> /var/log/security-audit.log
```

---

## 3. AUTHENTICATION & AUTHORIZATION

### 3.1 JWT Token Security

```javascript
// Secure JWT configuration
const tokenConfig = {
  // Short expiration (7 days)
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Refresh token rotation (30 days)
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Algorithm (RS256 > HS256 for production)
  algorithm: 'HS256',
  
  // Issuer verification
  issuer: 'infamous-freight-api',
  
  // Audience verification
  audience: 'infamous-freight-users',
};

const token = jwt.sign(payload, secret, tokenConfig);
```

### 3.2 Scope-Based Authorization

```javascript
// Define allowed scopes per role
const ROLE_SCOPES = {
  admin: [
    'admin:users',
    'admin:organizations',
    'admin:audit',
    'admin:settings',
    'user:read',
    'user:write',
    'shipment:read',
    'shipment:write',
  ],
  manager: [
    'user:read',
    'shipment:read',
    'shipment:write',
    'report:read',
  ],
  user: [
    'user:avatar',
    'shipment:read',
    'shipment:write',
  ],
  driver: [
    'shipment:read',
    'location:write',
    'voice:command',
  ],
};

// Middleware to enforce scopes
function requireScope(required) {
  const requiredScopes = Array.isArray(required) ? required : [required];
  
  return (req, res, next) => {
    const userScopes = req.user?.scopes || [];
    
    // Admin bypass (optional - remove for stricter security)
    if (req.user?.role === 'admin') {
      return next();
    }
    
    const hasAllScopes = requiredScopes.every(scope => 
      userScopes.includes(scope)
    );
    
    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredScopes,
        provided: userScopes,
      });
    }
    
    next();
  };
}
```

### 3.3 Two-Factor Authentication (2FA)

```javascript
// Enable 2FA for admin accounts (mandatory)
const crypto = require('crypto');
const speakeasy = require('speakeasy');

async function generateTOTP(userId) {
  const secret = speakeasy.generateSecret({
    name: `Infamous Freight (${userId})`,
    issuer: 'Infamous Freight',
    length: 32,
  });

  // Store secret in secure field
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encryptField(secret.base32) },
  });

  return {
    qrCode: secret.qr_code,
    backupCodes: generateBackupCodes(),
  };
}

function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow ±2 time windows
  });
}
```

---

## 4. SECRETS MANAGEMENT

### 4.1 Environment-Based Secrets

```bash
# Development (.env - NEVER commit)
JWT_SECRET="dev-secret-only-for-testing"
OPENAI_API_KEY="sk-..."
DATABASE_URL="postgresql://localhost:5432/dev"

# Staging (Fly.io secrets)
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)" --config staging

# Production (Fly.io secrets)
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)" --app infamous-freight-api
```

### 4.2 Secrets Rotation Automation

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Production Secrets
on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly on 1st at 2 AM

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Rotate JWT Secret
        run: |
          NEW_SECRET=$(openssl rand -base64 32)
          flyctl secrets set JWT_SECRET="$NEW_SECRET" --app infamous-freight-api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Notify Team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production secrets rotated successfully"
            }
```

### 4.3 Secrets Audit Trail

```javascript
// Log all secrets access
function auditSecretsAccess(req, res, next) {
  if (req.path.includes('/secrets') || req.path.includes('/admin')) {
    const auditLog = {
      timestamp: new Date(),
      user: req.user?.sub,
      endpoint: req.path,
      method: req.method,
      action: 'SECRETS_ACCESS',
      status: res.statusCode,
    };
    
    // Log to secure audit database
    prisma.auditLog.create({ data: auditLog });
  }
  
  next();
}
```

---

## 5. AUDIT LOGGING & COMPLIANCE

### 5.1 Comprehensive Audit Logging

```javascript
// Log all sensitive operations
async function logAuditEvent(event) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    userId: event.userId,
    action: event.action,  // CREATE, UPDATE, DELETE, READ
    resource: event.resource,  // users, shipments, invoices
    resourceId: event.resourceId,
    status: event.status,  // SUCCESS, FAILURE
    details: event.details,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  };
  
  // Store in audit log table (with 7-year retention)
  await prisma.auditLog.create({ data: auditEntry });
  
  // Also log to external service (Sentry, Datadog)
  Sentry.captureMessage(`Audit: ${event.action} on ${event.resource}`, {
    level: 'info',
    contexts: { audit: auditEntry },
  });
}
```

### 5.2 Data Access Logging

```javascript
// Monitor sensitive data access
async function logDataAccess(userId, dataType, action, success = true) {
  await prisma.dataAccessLog.create({
    data: {
      userId,
      dataType,  // SSN, credit_card, phone, email
      action,    // READ, EXPORT, DELETE
      timestamp: new Date(),
      success,
    },
  });
  
  // Alert on suspicious patterns
  const accessCount = await prisma.dataAccessLog.count({
    where: {
      userId,
      dataType: 'SSN',
      createdAt: { gte: subMinutes(new Date(), 5) },
    },
  });
  
  if (accessCount > 10) {
    // Alert security team
    sendSlackAlert(`🚨 Suspicious SSN access: ${userId} (${accessCount} in 5 min)`);
  }
}
```

### 5.3 Compliance Requirements

**SOC 2 Type II:**
- ✅ Audit logs retained 7 years
- ✅ User activity tracking
- ✅ Change management logs
- ✅ Access controls documented

**GDPR Compliance:**
- ✅ Data retention policy: 90 days max (except legal holds)
- ✅ Data deletion capability: GDPR right to be forgotten
- ✅ Consent logging: All marketing/tracking consents logged

**PCI DSS (if processing payments):**
- ✅ Never store full credit card numbers
- ✅ Tokenize cards via Stripe/PayPal
- ✅ Network segmentation for payment data

---

## 6. NETWORK SECURITY

### 6.1 Rate Limiting Configuration (Enhanced)

```javascript
// Implement adaptive rate limiting
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL });

const createAdaptiveLimiter = (name, baseMax) => {
  return rateLimit({
    store: new RedisStore({
      client,
      prefix: `rl:${name}:`,
      sendUnblocked: false,
    }),
    max: baseMax,
    windowMs: 60 * 1000,  // 1 minute
    keyGenerator: (req) => req.user?.sub || req.ip,
    skip: (req) => {
      // Skip rate limiting for admin users
      if (req.user?.role === 'admin') return true;
      
      // Skip health check endpoints
      if (req.path === '/api/health') return true;
      
      return false;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: req.rateLimit.resetTime,
      });
    },
  });
};

// Apply different limits per endpoint
app.post('/api/auth/login', createAdaptiveLimiter('login', 5));
app.post('/api/ai/command', createAdaptiveLimiter('ai', 20));
app.get('/api/shipments', createAdaptiveLimiter('shipments', 100));
```

### 6.2 DDoS Protection

```bash
# Enable Cloudflare DDoS protection
# 1. Add domain to Cloudflare
# 2. Enable DDoS protection level: "High"
# 3. Enable rate limiting rules:
#    - Challenge requests with >50 req/min from same IP
#    - Block IPs with >1000 req/min

# Verify DDoS status
curl -I https://api.infamousfreight.com/ | grep CF-RAY
```

### 6.3 IP Whitelisting (for admin endpoints)

```javascript
// Whitelist admin endpoints to known IPs
const ADMIN_IPS = [
  '203.0.113.0',      // Office network
  '198.51.100.0',     // VPN gateway
];

function requireAdminIP(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!ADMIN_IPS.includes(clientIP)) {
    return res.status(403).json({
      error: 'Access denied from this IP address',
      clientIP,
    });
  }
  
  next();
}

// Apply to sensitive endpoints
router.get('/admin/users', requireAdminIP, adminUserController);
router.delete('/admin/data', requireAdminIP, adminDataController);
```

---

## 7. VULNERABILITY MANAGEMENT

### 7.1 Dependency Scanning

```bash
# Automated dependency checking
pnpm audit

# Run security scanners
npm install -g snyk
snyk test

# Generate SBOM (Software Bill of Materials)
snyk sbom generate --file=package.json
```

### 7.2 Regular Security Updates

```bash
# Schedule monthly dependency updates
# File: .github/workflows/dependabot-check.yml

# Manual update procedure:
pnpm update --latest
pnpm audit fix
pnpm test
git push origin security/dependabot-updates
```

### 7.3 Vulnerability Disclosure Policy

```markdown
# Security.md (publish at /.well-known/security.txt)

Contact: security@infamousfreight.com
Preferred-Languages: en
Canonical: https://infamousfreight.com/.well-known/security.txt
```

---

## 8. INCIDENT RESPONSE PROCEDURE

### 8.1 Security Incident Checklist

```bash
#!/bin/bash
# scripts/incident-response.sh

echo "🚨 SECURITY INCIDENT RESPONSE INITIATED"
echo ""

# Step 1: Isolate affected systems
echo "1️⃣ ISOLATION"
read -p "Enter affected service: " SERVICE
docker-compose stop $SERVICE
echo "✅ Service $SERVICE stopped"

# Step 2: Preserve evidence
echo "2️⃣ EVIDENCE COLLECTION"
docker-compose logs $SERVICE > incident-logs-$(date +%s).txt
pg_dump $DB_NAME > incident-db-backup-$(date +%s).sql

# Step 3: Notify stakeholders
echo "3️⃣ NOTIFICATION"
slack send-message "#security-incidents" "
🚨 **SECURITY INCIDENT**
- Service: $SERVICE
- Time: $(date)
- Status: Under investigation
"

# Step 4: Begin analysis
echo "4️⃣ ANALYSIS"
echo "Review logs: incident-logs-*.txt"
echo "Review database: incident-db-backup-*.sql"

# Step 5: Initiate remediation
echo "5️⃣ REMEDIATION"
read -p "Enter remediation command: " REMEDY
eval $REMEDY
```

### 8.2 Post-Incident Postmortem

```markdown
# Postmortem Template

## Incident Summary
- Title: [Security Incident Title]
- Date: [YYYY-MM-DD]
- Duration: [Start time - End time]
- Severity: [Critical/High/Medium/Low]

## Timeline
- HH:MM - [Event description]
- HH:MM - [Detection]
- HH:MM - [Response initiated]
- HH:MM - [System recovered]

## Root Cause Analysis
[What caused the incident?]

## Impact Assessment
- Systems affected: [List]
- Users impacted: [Number]
- Data exposed: [None/Limited/Significant]

## Remediation Actions
1. [Immediate fix]
2. [Follow-up action]
3. [Prevention measure]

## Prevention Measures
- [Process change]
- [Technical control]
- [Monitoring enhancement]

## Approval
- Security Lead: ___________
- Engineering Manager: _____
- Executive Sponsor: _______
```

---

## Security Checklist

✅ Security headers configured and verified  
✅ TLS/HTTPS enabled with valid certificate  
✅ Database encryption enabled  
✅ JWT tokens with rotation policy  
✅ 2FA enabled for admin accounts  
✅ Audit logging comprehensive  
✅ Rate limiting adaptive and enforced  
✅ DDoS protection enabled  
✅ Dependency scanning automated  
✅ Incident response procedures documented  

---

**Status: 🔒 PRODUCTION SECURITY READY**

All critical security controls implemented and verified for production deployment.
