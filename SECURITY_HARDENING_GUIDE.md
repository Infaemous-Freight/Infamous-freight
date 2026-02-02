# 🔐 Security Hardening Guide

**Purpose**: Comprehensive security best practices for production  
**Target**: Pass security audits and penetration testing

---

## 1️⃣ API Security

### Authentication & Authorization

```javascript
// apps/api/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'freight-api',
      audience: 'freight-web',
    });
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests',
  skip: (req) => req.user?.role === 'admin',
});

const auth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter for auth
  skipSuccessfulRequests: true,
});

const api = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

app.use('/api/', general);
app.use('/api/auth/', auth);
app.use('/api/shipments/', api);
```

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

const validateShipment = [
  body('origin')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Origin required (1-255 chars)'),
  body('destination')
    .isLength({ min: 1, max: 255 })
    .withMessage('Destination required'),
  body('weight')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Weight must be 1-100000 kg'),
  body('hazmat').isBoolean().toBoolean(),
];

app.post('/api/shipments', validateShipment, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process shipment
  next();
});
```

### SQL Injection Prevention

```javascript
// ✅ SAFE: Parameterized queries with Prisma
const user = await prisma.user.findUnique({
  where: { email: userEmail }, // Parameter binding
});

// ❌ UNSAFE: String concatenation (NEVER DO THIS)
// const user = await db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### CSRF Protection

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

app.get('/api/form', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/api/form', (req, res) => {
  // CSRF token automatically validated
  res.json({ success: true });
});
```

---

## 2️⃣ Web Security

### Security Headers

```typescript
// apps/web/pages/_app.tsx or next.config.js
export async function getServerSideProps(context) {
  context.res.setHeader(
    'X-Content-Type-Options',
    'nosniff'
  );
  context.res.setHeader(
    'X-Frame-Options',
    'DENY'
  );
  context.res.setHeader(
    'X-XSS-Protection',
    '1; mode=block'
  );
  context.res.setHeader(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  context.res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self';"
  );
  
  return { props: {} };
}
```

Or via next.config.js:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'",
          },
        ],
      },
    ];
  },
};
```

### XSS Prevention

```typescript
// ✅ SAFE: React escapes by default
const message = req.query.msg;
return <div>{message}</div>; // Automatically escaped

// ❌ UNSAFE: Using dangerouslySetInnerHTML
// return <div dangerouslySetInnerHTML={{ __html: message }} />;
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));
```

---

## 3️⃣ Database Security

### Encrypted Sensitive Data

```javascript
const crypto = require('crypto');

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(Buffer.from(parts.join(':'), 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};

// Store encrypted
const user = await prisma.user.create({
  data: {
    email: encrypt(userEmail),
    ssn: encrypt(ssn),
  },
});
```

### Row-Level Security (PostgreSQL)

```sql
-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own shipments
CREATE POLICY user_shipments ON shipments
  FOR ALL
  USING (user_id = current_user_id);

-- Create policy: Admins can see all
CREATE POLICY admin_all ON shipments
  FOR ALL
  USING (role = 'admin');
```

---

## 4️⃣ Secrets Management

### Environment Variables

```bash
# .env.local (NEVER commit)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-here (min 32 chars, random)
ENCRYPTION_KEY=your-encryption-key (min 32 chars, random)
STRIPE_SECRET_KEY=sk_live_...
API_KEY_EXTERNAL=...

# .env.example (COMMIT - no secrets)
DATABASE_URL=postgresql://user:pass@localhost/freight
JWT_SECRET=change-me-in-production
ENCRYPTION_KEY=change-me-in-production
STRIPE_SECRET_KEY=sk_test_...
API_KEY_EXTERNAL=dummy
```

### Secret Rotation

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Generate new keys
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_ENC_KEY=$(openssl rand -base64 32)

# Update in production
fly secrets set JWT_SECRET=$NEW_JWT_SECRET
fly secrets set ENCRYPTION_KEY=$NEW_ENC_KEY

# Restart service
fly deploy -a freight-api

# Log rotation
echo "Secrets rotated at $(date)" >> /var/log/security.log
```

Run quarterly:

```bash
0 0 1 */3 * /app/scripts/rotate-secrets.sh
```

---

## 5️⃣ Dependency Security

### Vulnerability Scanning

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix

# Fix major versions (breaking)
pnpm audit --fix --force

# Audit in CI
# .github/workflows/security.yml already configured
```

### Dependency Pinning

```json
{
  "dependencies": {
    "express": "4.18.2", // Exact version
    "@prisma/client": "~5.1.0", // Minor updates only
    "lodash": "^4.17.21" // Patch updates only
  }
}
```

### Supply Chain Security

```bash
# Verify integrity
pnpm audit signatures

# Use only signed packages
pnpm config set audit-level=moderate
```

---

## 6️⃣ Monitoring & Logging

### Security Logging

```javascript
// Log security events
const logSecurityEvent = (event, details) => {
  logger.warn('SECURITY_EVENT', {
    event,
    timestamp: new Date(),
    userId: details.userId,
    ip: details.ip,
    action: details.action,
    ...details,
  });
  
  // Also send to security monitoring
  Sentry.captureMessage(`Security: ${event}`, 'warning', {
    extra: details,
  });
};

// Failed login attempts
app.post('/api/auth/login', async (req, res) => {
  if (loginFailed) {
    logSecurityEvent('LOGIN_FAILED', {
      email: req.body.email,
      ip: req.ip,
      reason: 'invalid credentials',
    });
  }
});

// Unauthorized access
app.get('/api/admin', authenticate, requireRole('admin'), (req, res) => {
  // If unauthorized
  logSecurityEvent('UNAUTHORIZED_ACCESS', {
    userId: req.user.id,
    endpoint: '/api/admin',
    ip: req.ip,
  });
});
```

### Intrusion Detection

```javascript
// Track suspicious patterns
const suspiciousPatterns = [];

app.use((req, res, next) => {
  // SQL injection attempt
  if (/['";\\]/i.test(req.url + JSON.stringify(req.body))) {
    suspiciousPatterns.push({
      type: 'sql-injection',
      ip: req.ip,
      path: req.path,
    });
  }
  
  // Path traversal
  if (req.path.includes('..')) {
    suspiciousPatterns.push({
      type: 'path-traversal',
      ip: req.ip,
    });
  }
  
  next();
});

// Alert if 5+ suspicious patterns from same IP
setInterval(() => {
  const ips = {};
  suspiciousPatterns.forEach(p => {
    ips[p.ip] = (ips[p.ip] || 0) + 1;
  });
  
  Object.entries(ips).forEach(([ip, count]) => {
    if (count >= 5) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        ip,
        count,
        patterns: suspiciousPatterns
          .filter(p => p.ip === ip)
          .map(p => p.type),
      });
    }
  });
  
  suspiciousPatterns.clear();
}, 60000);
```

---

## 7️⃣ Security Checklist

### Before Production Launch

- [ ] All dependencies audited & no high/critical vulns
- [ ] Rate limiting configured on all APIs
- [ ] HTTPS/TLS enabled on all endpoints
- [ ] Database encrypted at rest & in transit
- [ ] Secrets never committed to git
- [ ] SQL injection prevention verified
- [ ] XSS prevention in place
- [ ] CSRF tokens on forms
- [ ] Security headers set
- [ ] CORS configured correctly

### Ongoing

- [ ] Weekly dependency audit
- [ ] Monthly penetration testing
- [ ] Quarterly security training
- [ ] Incident response on alert
- [ ] Security log review weekly
- [ ] Secrets rotation quarterly
- [ ] Database backups tested (monthly)

### Compliance

- [ ] GDPR (if EU users): Data deletion, export
- [ ] SOC 2: Logging, monitoring, backups
- [ ] PCI DSS (if payment): Encryption, no storage of sensitive data
- [ ] ISO 27001 (if enterprise): Security policies

---

**Status**: Ready to implement  
**Effort**: High (security is never "done")  
**ROI**: High (protects business & users)
