# Advanced Authentication & Authorization Guide

## Overview

This guide covers enterprise-grade authentication including OAuth 2.0/OpenID Connect, multi-factor authentication (MFA), role-based access control (RBAC), and secure session management.

## 1. OAuth 2.0 & OpenID Connect

### Installation

```bash
pnpm add passport passport-oauth2 passport-google-oauth20 passport-github2 jsonwebtoken crypto-random-string
```

### OAuth Provider Configuration

**File: `api/src/config/oauth.js`**

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto-random-string');

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0]?.value,
              provider: 'google',
              providerId: profile.id,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// GitHub OAuth
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/api/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0]?.value,
              provider: 'github',
              providerId: profile.id,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
```

### OAuth Routes

**File: `api/src/routes/auth.oauth.js`**

```javascript
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      {
        sub: req.user.id,
        email: req.user.email,
        role: req.user.role,
        scopes: ['user:read', 'user:avatar'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.WEB_URL}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      {
        sub: req.user.id,
        email: req.user.email,
        role: req.user.role,
        scopes: ['user:read', 'user:avatar'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.redirect(`${process.env.WEB_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
```

## 2. Multi-Factor Authentication (MFA)

### Installation

```bash
pnpm add speakeasy qrcode totp-generator
```

### MFA Service

**File: `api/src/services/mfaService.js`**

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class MFAService {
  // Generate TOTP secret and QR code
  async generateTOTPSecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `Infamous Freight (${email})`,
      issuer: 'Infamous Freight',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: this.generateBackupCodes(8),
    };
  }

  // Verify TOTP token
  verifyTOTP(secret, token, window = 2) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window,
    });
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Send email code
  async sendEmailCode(userId, email) {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.mfaCode.create({
      data: {
        userId,
        code,
        method: 'email',
        expiresAt,
      },
    });

    // Send email
    await sendEmail(email, 'Your MFA Code', `Your code is: ${code}`);

    return { expiresAt };
  }

  // Verify email code
  async verifyEmailCode(userId, code) {
    const mfaCode = await prisma.mfaCode.findFirst({
      where: {
        userId,
        code,
        method: 'email',
        expiresAt: { gt: new Date() },
      },
    });

    if (!mfaCode) return false;

    // Mark as used
    await prisma.mfaCode.update({
      where: { id: mfaCode.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  // Get user MFA methods
  async getUserMFAMethods(userId) {
    const methods = await prisma.userMFA.findMany({
      where: { userId },
      select: {
        id: true,
        method: true,
        verified: true,
        createdAt: true,
      },
    });

    return methods;
  }
}

module.exports = new MFAService();
```

### MFA Routes

**File: `api/src/routes/auth.mfa.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/security');
const mfaService = require('../services/mfaService');

// Enable TOTP MFA
router.post('/mfa/totp/enable', authenticate, async (req, res, next) => {
  try {
    const { secret, qrCode, backupCodes } =
      await mfaService.generateTOTPSecret(req.user.sub, req.user.email);

    res.json({
      secret,
      qrCode,
      backupCodes,
      instruction: 'Scan QR code with authenticator app',
    });
  } catch (err) {
    next(err);
  }
});

// Verify TOTP setup
router.post('/mfa/totp/verify', authenticate, async (req, res, next) => {
  try {
    const { secret, token } = req.body;

    if (!mfaService.verifyTOTP(secret, token)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Store in database
    await prisma.userMFA.create({
      data: {
        userId: req.user.sub,
        method: 'totp',
        secret,
        verified: true,
      },
    });

    res.json({ success: true, message: 'TOTP enabled' });
  } catch (err) {
    next(err);
  }
});

// Send email MFA code
router.post('/mfa/email/send', authenticate, async (req, res, next) => {
  try {
    const { expiresAt } = await mfaService.sendEmailCode(
      req.user.sub,
      req.user.email
    );

    res.json({ expiresAt });
  } catch (err) {
    next(err);
  }
});

// Verify email MFA code
router.post('/mfa/email/verify', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;

    const verified = await mfaService.verifyEmailCode(req.user.sub, code);

    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get user MFA methods
router.get('/mfa/methods', authenticate, async (req, res, next) => {
  try {
    const methods = await mfaService.getUserMFAMethods(req.user.sub);
    res.json({ methods });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

## 3. Role-Based Access Control (RBAC)

### RBAC Middleware

**File: `api/src/middleware/rbac.js`**

```javascript
// Role permissions matrix
const rolePermissions = {
  user: ['user:read', 'user:avatar'],
  driver: ['user:read', 'user:avatar', 'shipment:read'],
  manager: [
    'user:read',
    'user:write',
    'shipment:read',
    'shipment:write',
    'billing:read',
  ],
  admin: ['*'], // All permissions
};

// Check if user has required role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        required: roles,
        actual: req.user.role,
      });
    }

    next();
  };
}

// Check if user has required permission
function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPermissions = rolePermissions[req.user.role] || [];

    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasPermission = permissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permissions,
        available: userPermissions,
      });
    }

    next();
  };
}

module.exports = { requireRole, requirePermission, rolePermissions };
```

### Using RBAC in Routes

```javascript
const { requireRole, requirePermission } = require('../middleware/rbac');

// Only managers and admins can update shipments
router.put(
  '/shipments/:id',
  authenticate,
  requireRole('manager', 'admin'),
  async (req, res, next) => {
    // handler
  }
);

// Using permission-based checks
router.post(
  '/shipments',
  authenticate,
  requirePermission('shipment:write'),
  async (req, res, next) => {
    // handler
  }
);
```

## 4. Session Management

### Session Service

**File: `api/src/services/sessionService.js`**

```javascript
class SessionService {
  constructor() {
    this.sessions = new Map(); // Use Redis in production
  }

  // Create session
  async createSession(userId, metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt,
      lastActivity: new Date(),
      metadata, // IP, user agent, etc.
    };

    this.sessions.set(sessionId, session);

    // Store in database
    await prisma.session.create({
      data: session,
    });

    return sessionId;
  }

  // Validate session
  async validateSession(sessionId) {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
    }

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    return session;
  }

  // Revoke session
  async revokeSession(sessionId) {
    this.sessions.delete(sessionId);
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  // Get user sessions
  async getUserSessions(userId) {
    return await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        lastActivity: true,
        metadata: true,
      },
    });
  }
}

module.exports = new SessionService();
```

## 5. Password Security

### Installation

```bash
pnpm add bcryptjs password-validator
```

### Password Service

**File: `api/src/services/passwordService.js`**

```javascript
const bcrypt = require('bcryptjs');
const PasswordValidator = require('password-validator');

const schema = new PasswordValidator()
  .isLength({ min: 12 })
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols();

class PasswordService {
  // Hash password
  async hashPassword(password) {
    if (!schema.validate(password)) {
      throw new Error('Password does not meet complexity requirements');
    }
    return bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Generate password reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate password requirements
  validatePassword(password) {
    const errors = [];

    if (password.length < 12) {
      errors.push('At least 12 characters required');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least 1 uppercase letter required');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least 1 lowercase letter required');
    }
    if (!/\d/.test(password)) {
      errors.push('At least 1 digit required');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('At least 1 special character required');
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = new PasswordService();
```

## 6. Token Rotation

### Token Rotation Middleware

**File: `api/src/middleware/advancedSecurity.js`**

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function authenticateWithRotation(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = header.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET;

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check token rotation status
    const tokenRecord = await prisma.token.findUnique({
      where: { jti: payload.jti },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.user = payload;
    req.originalToken = token;

    // Check if token needs rotation (issued more than 1 hour ago)
    if (Date.now() - payload.iat * 1000 > 60 * 60 * 1000) {
      const newToken = generateNewToken(payload);
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function generateNewToken(payload) {
  const newJti = crypto.randomBytes(16).toString('hex');

  return jwt.sign(
    {
      ...payload,
      jti: newJti,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticateWithRotation };
```

## Environment Variables

Add to `.env`:

```env
# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
TOKEN_ROTATION_ENABLED=true

# Password
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# Session
SESSION_TIMEOUT_MINUTES=1440
SESSION_ABSOLUTE_TIMEOUT_DAYS=7

# MFA
MFA_EMAIL_EXPIRY_MINUTES=10
MFA_TOTP_WINDOW=2
```

## Database Schema

Add to `api/prisma/schema.prisma`:

```prisma
model UserMFA {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  method    String   // "totp" or "email"
  secret    String?  // For TOTP
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@unique([userId, method])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  lastActivity DateTime @default(now())
  metadata     Json?    // IP, user agent, etc.

  @@index([userId])
  @@index([expiresAt])
}

model Token {
  id        String   @id @default(cuid())
  jti       String   @unique // JWT ID
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([userId])
  @@index([expiresAt])
}

model MFACode {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  code      String
  method    String   // "email" or "sms"
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

## Testing

**File: `api/src/routes/__tests__/auth.test.js`**

```javascript
describe('Authentication', () => {
  describe('MFA', () => {
    it('should enable TOTP', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/totp/enable')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('backupCodes');
    });

    it('should verify TOTP token', async () => {
      const mfaSetup = await mfaService.generateTOTPSecret(
        userId,
        'user@example.com'
      );

      const token = speakeasy.totp({
        secret: mfaSetup.secret,
        encoding: 'base32',
      });

      const response = await request(app)
        .post('/api/auth/mfa/totp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ secret: mfaSetup.secret, token });

      expect(response.status).toBe(200);
    });

    it('should send email MFA code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/email/send')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('expiresAt');
    });
  });

  describe('RBAC', () => {
    it('should deny access to non-managers', async () => {
      const response = await request(app)
        .put('/api/shipments/123')
        .set('Authorization', `Bearer ${userToken}`); // User role

      expect(response.status).toBe(403);
    });

    it('should allow manager to update shipment', async () => {
      const response = await request(app)
        .put('/api/shipments/123')
        .set('Authorization', `Bearer ${managerToken}`); // Manager role
        .send({ status: 'in_transit' });

      expect(response.status).toBeLessThan(400);
    });
  });

  describe('Session Management', () => {
    it('should create session', async () => {
      const sessionId = await sessionService.createSession(userId);
      expect(sessionId).toBeTruthy();
    });

    it('should validate session', async () => {
      const sessionId = await sessionService.createSession(userId);
      const session = await sessionService.validateSession(sessionId);

      expect(session).toBeTruthy();
      expect(session.userId).toBe(userId);
    });

    it('should revoke session', async () => {
      const sessionId = await sessionService.createSession(userId);
      await sessionService.revokeSession(sessionId);
      const session = await sessionService.validateSession(sessionId);

      expect(session).toBeNull();
    });
  });
});
```

## Best Practices

1. **Use HTTPS everywhere** - Always encrypt authentication credentials in transit
2. **Token expiration** - Set reasonable token TTLs (24h for JWT, 7d for refresh)
3. **Rate limiting on auth** - Prevent brute force attacks (5 attempts/15 min)
4. **MFA enforcement** - For sensitive accounts or operations
5. **Session tracking** - Know where/when users are logged in
6. **Password policy** - Enforce complexity and prevent reuse
7. **Audit logging** - Track all authentication events
8. **Token rotation** - Automatically rotate long-lived tokens
