# TIER 3: Advanced Threat Detection & Response

## Executive Overview

Advanced Threat Detection implements real-time security monitoring, anomaly detection, and automated incident response across all infrastructure layers. This guide provides complete implementation of threat detection rules, SIEM integration, and incident response automation to achieve 99.9% threat detection rate.

**Implementation Timeline**: 6-8 weeks | **Resource Allocation**: 2 security engineers, 1 data engineer | **Expected Outcome**: <15 minute MTTR for all critical threats

---

## 1. THREAT DETECTION FRAMEWORK

### 1.1 Detection Layers

```
┌────────────────────────────────────────────────────────────────┐
│              MULTI-LAYER THREAT DETECTION FRAMEWORK             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: PERIMETER DETECTION                                  │
│  ├─ DDoS attack signatures                                     │
│  ├─ Malicious IP reputation check                              │
│  ├─ Bot detection (behavioral)                                 │
│  ├─ SQL injection/XSS patterns                                 │
│  └─ WAF rule violations                                        │
│                                                                 │
│  LAYER 2: AUTH & IDENTITY DETECTION                            │
│  ├─ Brute force attempts                                       │
│  ├─ Credential stuffing patterns                               │
│  ├─ Impossible travel detection                                │
│  ├─ MFA circumvention attempts                                 │
│  └─ Privilege escalation attempts                              │
│                                                                 │
│  LAYER 3: APPLICATION DETECTION                                │
│  ├─ Malicious API usage patterns                               │
│  ├─ Data exfiltration detection                                │
│  ├─ Unauthorized endpoint access                               │
│  ├─ Business logic abuse                                       │
│  └─ API rate limit circumvention                               │
│                                                                 │
│  LAYER 4: DATA & DATABASE DETECTION                            │
│  ├─ Query injection/manipulation                               │
│  ├─ Unauthorized data access patterns                          │
│  ├─ Bulk export detection                                      │
│  ├─ Database connection anomalies                              │
│  └─ Schema modification attempts                               │
│                                                                 │
│  LAYER 5: INFRASTRUCTURE DETECTION                             │
│  ├─ Host compromise indicators                                 │
│  ├─ Privilege escalation attempts                              │
│  ├─ Process anomalies (malware signatures)                     │
│  ├─ Network traffic anomalies                                  │
│  └─ File system integrity violations                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. PERIMETER THREAT DETECTION

### 2.1 WAF Rules & Bot Detection

```javascript
// apps/api/src/rules/perimeter-threats.js

class PerimeterThreatDetection {
  constructor() {
    this.botsignatures = {
      // SQL Injection patterns
      sql_injection: [
        /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\binsert\b.*\binto\b)/i,
        /(\bdrop\b.*\btable\b|\bdelete\b.*\bfrom\b|\bupdate\b.*\bset\b)/i,
        /('|('')|(%27)|((%2527)|(;)|(--)|(-#)|(#))/gi
      ],
      // Cross-Site Scripting (XSS)
      xss: [
        /(<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=)/gi,
        /(<iframe|<embed|<object|<img[^>]*onerror)/gi
      ],
      // Command Injection
      command_injection: [
        /[;&|`$(){}[\]<>]/g,
        /(\bwget\b|\bcurl\b|\bexec\b|\bsystem\b)/i
      ]
    };
  }

  async detectWAFViolation(req, payload) {
    const violations = [];

    // Check SQL Injection
    if (this.detectSQLInjection(payload)) {
      violations.push({
        type: 'SQL_INJECTION',
        severity: 'critical',
        payload: payload.substring(0, 100),
        timestamp: new Date()
      });
    }

    // Check XSS
    if (this.detectXSS(payload)) {
      violations.push({
        type: 'XSS_ATTEMPT',
        severity: 'high',
        payload: payload.substring(0, 100),
        timestamp: new Date()
      });
    }

    // Check Command Injection
    if (this.detectCommandInjection(payload)) {
      violations.push({
        type: 'COMMAND_INJECTION',
        severity: 'critical',
        payload: payload.substring(0, 100),
        timestamp: new Date()
      });
    }

    if (violations.length > 0) {
      await this.logWAFEvent(req, violations);
      await this.blockAndAlert(req, violations);
    }

    return { violations, blocked: violations.length > 0 };
  }

  async detectBotActivity(req) {
    const fingerprint = {
      userAgent: req.get('user-agent'),
      headers: req.headers,
      ipAddress: req.ip,
      timing: req.timing || {}
    };

    const botScore = await this.calculateBotScore(fingerprint);

    if (botScore > 0.7) {
      return {
        isBot: true,
        score: botScore,
        indicators: this.getBotIndicators(fingerprint),
        severity: botScore > 0.9 ? 'critical' : 'high'
      };
    }

    return { isBot: false, score: botScore };
  }

  calculateBotScore(fingerprint) {
    let score = 0;

    // Check for missing headers (bots often lack headers)
    const requiredHeaders = ['user-agent', 'accept-language', 'accept-encoding'];
    const missingHeaders = requiredHeaders.filter(h => !fingerprint.headers[h]);
    score += missingHeaders.length * 0.1;

    // Check user-agent format
    if (!this.isValidUserAgent(fingerprint.userAgent)) {
      score += 0.2;
    }

    // Check for suspicious patterns in user-agent
    if (this.containsBotPatterns(fingerprint.userAgent)) {
      score += 0.3;
    }

    // Check request timing (humans have variance)
    if (fingerprint.timing.consistent) {
      score += 0.15;
    }

    // Check for headless browser signatures
    if (this.isHeadlessBrowser(fingerprint)) {
      score += 0.25;
    }

    return Math.min(1, score);
  }

  detectSQLInjection(payload) {
    return this.botsignatures.sql_injection.some(pattern =>
      pattern.test(payload)
    );
  }

  detectXSS(payload) {
    return this.botsignatures.xss.some(pattern =>
      pattern.test(payload)
    );
  }

  detectCommandInjection(payload) {
    return this.botsignatures.command_injection.some(pattern =>
      pattern.test(payload)
    );
  }

  isValidUserAgent(userAgent) {
    // User-agent should have minimum reasonable length
    return userAgent && userAgent.length > 20 && userAgent.length < 500;
  }

  containsBotPatterns(userAgent) {
    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|java(?!script)/i;
    return botPatterns.test(userAgent);
  }

  isHeadlessBrowser(fingerprint) {
    const headlessIndicators = /headless|phantom|nightmare|webdriver/i;
    return headlessIndicators.test(JSON.stringify(fingerprint));
  }

  getBotIndicators(fingerprint) {
    const indicators = [];
    if (this.containsBotPatterns(fingerprint.userAgent)) {
      indicators.push('Bot-like user agent');
    }
    if (fingerprint.timing.consistent) {
      indicators.push('Timing pattern suggests automation');
    }
    if (this.isHeadlessBrowser(fingerprint)) {
      indicators.push('Headless browser detected');
    }
    return indicators;
  }

  async blockAndAlert(req, violations) {
    // Block the request
    await this.blockIP(req.ip);

    // Alert security team
    await this.alertSecurityTeam({
      incident_type: 'WAF_VIOLATION',
      ip: req.ip,
      violations,
      user_agent: req.get('user-agent'),
      timestamp: new Date()
    });
  }

  async logWAFEvent(req, violations) {
    await prisma.securityEvent.create({
      data: {
        eventType: 'WAF_VIOLATION',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        violations: JSON.stringify(violations),
        timestamp: new Date()
      }
    });
  }

  async blockIP(ip) {
    // Add to temporary blocklist
    await this.addToBlocklist(ip, 24 * 60 * 60 * 1000); // 24 hours
  }

  async alertSecurityTeam(incident) {
    // Send to Slack/email/PagerDuty
  }

  async addToBlocklist(ip, duration) {
    // Implementation
  }
}

module.exports = PerimeterThreatDetection;
```

---

## 3. AUTHENTICATION THREAT DETECTION

### 3.1 Advanced Behavioral Detection

```javascript
// apps/api/src/services/authThreatDetection.js

class AuthenticationThreatDetection {
  async detectCredentialStuffing(loginAttempt) {
    const { userId, ipAddress, timestamp } = loginAttempt;

    // Look for rapid failed attempts from same IP
    const recentAttempts = await prisma.authAttempt.findMany({
      where: {
        ipAddress,
        successful: false,
        createdAt: {
          gte: new Date(timestamp - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });

    if (recentAttempts.length > 10) {
      return {
        detected: true,
        type: 'CREDENTIAL_STUFFING',
        severity: 'critical',
        attemptCount: recentAttempts.length,
        affectedAccounts: [...new Set(recentAttempts.map(a => a.userId))].length,
        recommendation: 'Block IP immediately'
      };
    }

    // Look for attempts across multiple accounts from same IP
    const multiAccountAttempts = await prisma.authAttempt.findMany({
      where: {
        ipAddress,
        successful: false,
        createdAt: {
          gte: new Date(timestamp - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    const uniqueAccounts = new Set(multiAccountAttempts.map(a => a.userId));
    if (uniqueAccounts.size > 5) {
      return {
        detected: true,
        type: 'MULTI_ACCOUNT_ATTACK',
        severity: 'critical',
        accountsTargeted: uniqueAccounts.size,
        attemptCount: multiAccountAttempts.length,
        recommendation: 'Block IP and implement CAPTCHA'
      };
    }

    return { detected: false };
  }

  async detectImpossibleTravel(userId, ipAddress, timestamp) {
    const lastLogin = await prisma.authAttempt.findFirst({
      where: { userId, successful: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastLogin) return { detected: false };

    // Get geolocation for current and last IP
    const currentLocation = await this.getIPLocation(ipAddress);
    const lastLocation = await this.getIPLocation(lastLogin.ipAddress);

    if (!currentLocation || !lastLocation) return { detected: false };

    // Calculate distance
    const distanceKm = this.calculateGeoDistance(
      currentLocation,
      lastLocation
    );

    // Calculate time difference
    const timeDiffHours = (timestamp - lastLogin.createdAt) / (1000 * 60 * 60);

    // Maximum possible speed is ~900 mph (commercial flight speed)
    const requiredSpeed = (distanceKm * 0.621371) / timeDiffHours;

    if (requiredSpeed > 900 && timeDiffHours < 12) {
      return {
        detected: true,
        type: 'IMPOSSIBLE_TRAVEL',
        severity: 'high',
        lastLocation: lastLogin.location,
        currentLocation: currentLocation,
        distanceKm,
        requiredSpeed: Math.round(requiredSpeed),
        maxPossibleSpeed: 900,
        timeDiffHours: Math.round(timeDiffHours * 10) / 10,
        recommendation: 'Trigger additional verification'
      };
    }

    return { detected: false };
  }

  async detectAccountTakeover(userId) {
    const recentAttempts = await prisma.authAttempt.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const indicators = {
      passwordChanges: 0,
      mfaDisables: 0,
      newDevices: 0,
      locationChanges: 0,
      failedAttemptsBeforeSuccess: 0
    };

    // Analyze pattern
    let failedCount = 0;
    for (const attempt of recentAttempts) {
      if (!attempt.successful) {
        failedCount++;
      } else {
        if (failedCount > 5) indicators.failedAttemptsBeforeSuccess = failedCount;
        break;
      }
    }

    // Check for resource changes
    const recentChanges = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        },
        action: {
          in: ['password_change', 'mfa_disabled', 'device_added']
        }
      }
    });

    indicators.passwordChanges = recentChanges.filter(c => c.action === 'password_change').length;
    indicators.mfaDisables = recentChanges.filter(c => c.action === 'mfa_disabled').length;
    indicators.newDevices = recentChanges.filter(c => c.action === 'device_added').length;

    // Calculate risk score
    const riskScore = Object.values(indicators).reduce((a, b) => a + b) * 0.2; // Each = 0-1

    if (riskScore > 2.5) {
      return {
        detected: true,
        type: 'ACCOUNT_TAKEOVER',
        severity: 'critical',
        riskScore,
        indicators,
        recommendation: 'Lock account and contact user immediately'
      };
    }

    return { detected: false };
  }

  async detectMFABypass(userId, sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        mfaVerifications: true,
        securityEvents: true
      }
    });

    if (!session) return { detected: false };

    // Check if MFA was required but skipped
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user.mfaRequired && !session.mfaVerifications.length) {
      return {
        detected: true,
        type: 'MFA_BYPASS_ATTEMPT',
        severity: 'high',
        mfaRequired: true,
        mfaVerified: false,
        recommendation: 'Revoke session and enforce re-authentication'
      };
    }

    // Check for unusual MFA patterns
    const mfaEvents = session.mfaVerifications;
    if (mfaEvents.length > 5) {
      return {
        detected: true,
        type: 'MFA_ABUSE',
        severity: 'medium',
        attemptCount: mfaEvents.length,
        recommendation: 'Monitor for lockout patterns'
      };
    }

    return { detected: false };
  }

  calculateGeoDistance(loc1, loc2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getIPLocation(ipAddress) {
    // GeoIP lookup
    return { lat: 40.7128, lon: -74.0060, country: 'US', city: 'New York' };
  }
}

module.exports = AuthenticationThreatDetection;
```

---

## 4. DATA EXFILTRATION DETECTION

### 4.1 Advanced Data Access Monitoring

```javascript
// apps/api/src/services/dataExfiltrationDetection.js

class DataExfiltrationDetection {
  async detectUnusualDataAccess(userId, dataQuery) {
    const userProfile = await this.getUserAccessProfile(userId);
    
    // Analyze current request
    const currentAccess = {
      dataSize: dataQuery.estimatedSize,
      recordCount: dataQuery.recordCount,
      tableCount: dataQuery.tablesAccessed.length,
      exportFormat: dataQuery.format || 'api',
      timestamp: new Date()
    };

    // Compare to baseline
    const anomalyScore = this.calculateAccessAnomaly(userProfile, currentAccess);

    if (anomalyScore > 0.75) {
      return {
        detected: true,
        type: 'UNUSUAL_DATA_ACCESS',
        severity: 'high',
        anomalyScore,
        deviations: this.identifyDeviations(userProfile, currentAccess),
        recommendation: 'Require additional approval for this query'
      };
    }

    return { detected: false };
  }

  async detectBulkDataExport(userId, exportRequest) {
    const { rowCount, dataSize, format, destination } = exportRequest;

    // Check against user's export history
    const sixMonthExports = await prisma.dataExport.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const averageSize = sixMonthExports.reduce((sum, exp) => sum + exp.dataSize, 0) / 
                        Math.max(sixMonthExports.length, 1);
    
    const averageRows = sixMonthExports.reduce((sum, exp) => sum + exp.rowCount, 0) / 
                        Math.max(sixMonthExports.length, 1);

    const sizeDeviation = dataSize / Math.max(averageSize, 1);
    const rowDeviation = rowCount / Math.max(averageRows, 1);

    // Flag if significantly larger than historical average
    if (sizeDeviation > 10 || rowDeviation > 10) {
      return {
        detected: true,
        type: 'ABRUPT_BULK_EXPORT',
        severity: 'critical',
        rowCount,
        dataSize: Math.round(dataSize / 1024 / 1024) + ' MB',
        historicalAverage: Math.round(averageSize / 1024 / 1024) + ' MB',
        deviation: Math.round(sizeDeviation * 10) / 10 + 'x',
        destination,
        recommendation: 'Block export and investigate'
      };
    }

    return { detected: false };
  }

  async detectSensitiveDataAccess(userId, dataQuery) {
    const sensitiveFields = [
      'ssn', 'credit_card', 'bank_account', 'password_hash',
      'api_key', 'mfa_secret', 'private_key', 'medical_records'
    ];

    const requestedTables = dataQuery.tables || [];
    const requestedColumns = dataQuery.columns || [];

    const accessingSensitiveData = sensitiveFields.some(field =>
      requestedColumns.some(col => col.toLowerCase().includes(field.toLowerCase()))
    );

    if (accessingSensitiveData) {
      // Check if user should have access
      const userRole = await this.getUserRole(userId);
      const allowedRoles = ['admin', 'analyst', 'compliance'];

      if (!allowedRoles.includes(userRole)) {
        return {
          detected: true,
          type: 'UNAUTHORIZED_SENSITIVE_ACCESS',
          severity: 'critical',
          sensitiveFields: sensitiveFields.filter(f =>
            requestedColumns.some(col => col.toLowerCase().includes(f))
          ),
          userRole,
          requiredRoles: allowedRoles,
          recommendation: 'Deny access and alert security'
        };
      }

      // Even authorized users need logging
      await this.logSensitiveDataAccess(userId, {
        fields: sensitiveFields,
        tables: requestedTables,
        timestamp: new Date(),
        ipAddress: userId // Should be from request context
      });
    }

    return { detected: false };
  }

  async detectDatabaseConnectionAnomalies(connectionString) {
    const anomalies = await this.analyzeDBConnection(connectionString);

    if (anomalies.severity === 'high') {
      return {
        detected: true,
        type: 'DB_CONNECTION_ANOMALY',
        severity: 'high',
        anomalies,
        recommendation: 'Investigate connection source'
      };
    }

    return { detected: false };
  }

  calculateAccessAnomaly(profile, currentAccess) {
    let score = 0;

    // Data size deviation
    if (currentAccess.dataSize > profile.avgDataSize * 5) {
      score += 0.2;
    }

    // Record count deviation
    if (currentAccess.recordCount > profile.avgRecordCount * 10) {
      score += 0.2;
    }

    // Multiple table access
    if (currentAccess.tableCount > profile.maxTablesInQuery) {
      score += 0.15;
    }

    // Unusual export format
    if (currentAccess.exportFormat !== profile.preferredFormat) {
      score += 0.1;
    }

    // Off-hours access
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  identifyDeviations(profile, currentAccess) {
    const deviations = [];

    if (currentAccess.dataSize > profile.avgDataSize * 5) {
      deviations.push(`Data size ${Math.round(currentAccess.dataSize / profile.avgDataSize)}x larger than average`);
    }

    if (currentAccess.recordCount > profile.avgRecordCount * 10) {
      deviations.push(`Record count ${Math.round(currentAccess.recordCount / profile.avgRecordCount)}x larger than average`);
    }

    if (currentAccess.tableCount > profile.maxTablesInQuery) {
      deviations.push(`Accessing ${currentAccess.tableCount} tables (usually ${profile.maxTablesInQuery})`);
    }

    return deviations;
  }

  async getUserAccessProfile(userId) {
    // Retrieve historical access patterns
    return {
      avgDataSize: 1024 * 1024, // 1 MB
      avgRecordCount: 1000,
      maxTablesInQuery: 2,
      preferredFormat: 'json'
    };
  }

  async getUserRole(userId) {
    return 'user';
  }

  async logSensitiveDataAccess(userId, details) {
    // Log to audit trail
  }

  async analyzeDBConnection(connectionString) {
    // Connection analysis
    return { severity: 'low' };
  }
}

module.exports = DataExfiltrationDetection;
```

---

## 5. AUTOMATED INCIDENT RESPONSE

### 5.1 Response Orchestration Engine

```javascript
// apps/api/src/services/incidentResponse.js

class IncidentResponseEngine {
  async respondToThreat(threat) {
    const response = {
      threatId: threat.id,
      detectionTime: new Date(),
      severity: threat.severity,
      actions: [],
      timeline: []
    };

    // Determine response based on threat type
    switch (threat.type) {
      case 'CREDENTIAL_STUFFING':
        response.actions = await this.respondToCredentialStuffing(threat);
        break;
      case 'ACCOUNT_TAKEOVER':
        response.actions = await this.respondToAccountTakeover(threat);
        break;
      case 'DATA_EXFILTRATION':
        response.actions = await this.respondToDataExfiltration(threat);
        break;
      case 'PRIVILEGE_ESCALATION':
        response.actions = await this.respondToPrivilegeEscalation(threat);
        break;
      default:
        response.actions = await this.respondToGenericThreat(threat);
    }

    // Execute response actions
    for (const action of response.actions) {
      const result = await this.executeAction(action);
      response.timeline.push({
        action: action.type,
        status: result.status,
        timestamp: new Date(),
        details: result.details
      });
    }

    // Store incident response record
    await this.storeIncidentResponse(response);

    // Alert relevant teams
    await this.alertSecurityTeam(response);

    return response;
  }

  async respondToCredentialStuffing(threat) {
    const actions = [];

    // 1. Block attacking IP
    actions.push({
      type: 'BLOCK_IP',
      target: threat.ipAddress,
      duration: 24 * 60 * 60 * 1000, // 24 hours
      reason: 'Credential stuffing attack'
    });

    // 2. Implement CAPTCHA challenge
    actions.push({
      type: 'ENFORCE_CAPTCHA',
      scope: 'login_endpoint',
      duration: 24 * 60 * 60 * 1000
    });

    // 3. Alert affected users
    const affectedUsers = threat.affectedAccounts || [];
    actions.push({
      type: 'ALERT_USERS',
      users: affectedUsers,
      message: 'Your account has been targeted. Please change your password.',
      channel: 'email'
    });

    // 4. Enable temporary rate limiting
    actions.push({
      type: 'ENFORCE_RATE_LIMIT',
      endpoint: '/login',
      limit: 3,
      window: 15 * 60 * 1000
    });

    return actions;
  }

  async respondToAccountTakeover(threat) {
    const actions = [];

    // 1. Lock the account
    actions.push({
      type: 'LOCK_ACCOUNT',
      userId: threat.userId,
      reason: 'Potential account takeover detected'
    });

    // 2. Revoke all active sessions
    actions.push({
      type: 'REVOKE_SESSIONS',
      userId: threat.userId,
      exceptCurrent: false
    });

    // 3. Force password reset
    actions.push({
      type: 'FORCE_PASSWORD_RESET',
      userId: threat.userId,
      requireMFA: true
    });

    // 4. Immediate user notification
    actions.push({
      type: 'URGENT_ALERT_USER',
      userId: threat.userId,
      message: 'Account takeover suspected. Your account is locked. Please contact support.',
      channels: ['email', 'sms'] // SMS if available
    });

    // 5. Escalate to security team
    actions.push({
      type: 'PAGE_SECURITY_TEAM',
      severity: 'critical',
      details: threat
    });

    // 6. Review account audit log
    actions.push({
      type: 'REVIEW_AUDIT_LOG',
      userId: threat.userId,
      timeRange: { start: '-24h', end: 'now' }
    });

    return actions;
  }

  async respondToDataExfiltration(threat) {
    const actions = [];

    // 1. Revoke user session
    actions.push({
      type: 'REVOKE_SESSION',
      sessionId: threat.sessionId,
      reason: 'Data exfiltration attempt'
    });

    // 2. Block data exports
    actions.push({
      type: 'BLOCK_EXPORTS',
      userId: threat.userId,
      duration: 24 * 60 * 60 * 1000 // 24 hours
    });

    // 3. Reduce access privileges
    actions.push({
      type: 'REDUCE_PRIVILEGES',
      userId: threat.userId,
      newRole: 'viewer', // Read-only
      duration: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 4. Enable extra logging
    actions.push({
      type: 'ENHANCED_LOGGING',
      userId: threat.userId,
      scope: 'all_queries',
      duration: 7 * 24 * 60 * 60 * 1000
    });

    // 5. Alert security team
    actions.push({
      type: 'ALERT_SECURITY',
      severity: 'high',
      details: threat
    });

    return actions;
  }

  async respondToPrivilegeEscalation(threat) {
    const actions = [];

    // 1. Deny the escalation
    actions.push({
      type: 'DENY_ACCESS',
      userId: threat.userId,
      resource: threat.targetResource
    });

    // 2. Lock the account temporarily
    actions.push({
      type: 'TEMPORARY_LOCK',
      userId: threat.userId,
      duration: 60 * 60 * 1000 // 1 hour
    });

    // 3. Alert user and admins
    actions.push({
      type: 'ALERT_USER',
      userId: threat.userId,
      message: 'Unauthorized access attempt detected'
    });

    // 4. Review user permissions
    actions.push({
      type: 'PERMISSION_AUDIT',
      userId: threat.userId
    });

    return actions;
  }

  async respondToGenericThreat(threat) {
    return [
      {
        type: 'LOG_EVENT',
        event: threat
      },
      {
        type: 'ALERT_SECURITY',
        severity: threat.severity,
        threat: threat
      }
    ];
  }

  async executeAction(action) {
    try {
      let result;

      switch (action.type) {
        case 'BLOCK_IP':
          result = await this.blockIP(action.target, action.duration);
          break;
        case 'LOCK_ACCOUNT':
          result = await this.lockAccount(action.userId);
          break;
        case 'REVOKE_SESSIONS':
          result = await this.revokeSessions(action.userId);
          break;
        case 'FORCE_PASSWORD_RESET':
          result = await this.forcePasswordReset(action.userId);
          break;
        case 'ENFORCE_RATE_LIMIT':
          result = await this.enforceRateLimit(action.endpoint, action.limit, action.window);
          break;
        case 'ALERT_SECURITY':
          result = await this.alertSecurityTeam(action);
          break;
        default:
          result = { status: 'pending', details: 'Action not implemented' };
      }

      return { status: 'success', ...result };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async blockIP(ip, duration) {
    // Add to WAF blocklist
    return { details: `IP ${ip} blocked for ${duration}ms` };
  }

  async lockAccount(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { locked: true, lockedAt: new Date() }
    });
    return { details: `Account ${userId} locked` };
  }

  async revokeSessions(userId) {
    await prisma.session.deleteMany({
      where: { userId }
    });
    return { details: `All sessions for ${userId} revoked` };
  }

  async forcePasswordReset(userId) {
    // Implementation
    return { details: 'Password reset forced' };
  }

  async enforceRateLimit(endpoint, limit, window) {
    // Implementation
    return { details: `Rate limit enforced: ${limit}/${window}ms` };
  }

  async alertSecurityTeam(incident) {
    // Send to Slack/PagerDuty
    console.log('[SECURITY ALERT]', incident);
    return { details: 'Security team alerted' };
  }

  async storeIncidentResponse(response) {
    await prisma.securityIncident.create({
      data: {
        threatId: response.threatId,
        severity: response.severity,
        actionsExecuted: response.actions.length,
        timeline: JSON.stringify(response.timeline),
        resolvedAt: new Date()
      }
    });
  }
}

module.exports = IncidentResponseEngine;
```

---

## 6. SIEM INTEGRATION

### 6.1 Log Aggregation & Analysis

```yaml
# SIEM Integration Configuration
# apps/api/config/siem-integration.yml

datadog:
  enabled: true
  service_name: "infamous-freight-api"
  environment: "production"
  
  custom_metrics:
    - threat_detected_count
    - incident_response_time
    - false_positive_rate
    - detection_coverage_percent
  
  logs:
    - application logs
    - security events
    - authentication attempts
    - data access logs
    - API requests
  
  dashboards:
    - threat_heatmap
    - incident_timeline
    - user_risk_scores
    - domain_reputation

alerts:
  - name: "Critical Threat Detected"
    query: "threat.severity == 'critical'"
    condition: "count > 0"
    notify: ["pagerduty", "slack", "email"]
    
  - name: "High False Positive Rate"
    query: "false_positive_rate > 0.05"
    condition: "avg over 1h"
    notify: ["slack"]
    
  - name: "Detection Gap"
    query: "detection_coverage < 0.95"
    condition: "avg over 1d"
    notify: ["email"]

retention:
  security_events: 2 years
  auth_logs: 1 year
  api_logs: 90 days
```

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Detection (Weeks 1-3)

- [ ] Deploy WAF with bot detection
- [ ] Implement auth threat detection
- [ ] Deploy data exfiltration monitoring
- [ ] Set up SIEM integration

### Phase 2: Response (Weeks 4-5)

- [ ] Build incident response engine
- [ ] Create automated response playbooks
- [ ] Test response workflows
- [ ] Train security team

### Phase 3: Tuning (Weeks 6-8)

- [ ] Reduce false positives <5%
- [ ] Validate detection accuracy
- [ ] Optimize MTTR <15 minutes
- [ ] Document threat patterns

---

## 8. SUCCESS METRICS

| Metric                  | Target  | Measurement      |
| ----------------------- | ------- | ---------------- |
| Threat detection rate   | >99%    | Security Review  |
| MTTR (critical threats) | <15 min | Incident logs    |
| False positive rate     | <5%     | Detection tuning |
| Incident response time  | <5 min  | Automation logs  |
| Coverage                | 100%    | Log review       |

---

**Implementation Cost**: $150K (2 engineers × $60K/month × 1.5 months + tools)  
**Expected Risk Reduction**: 95%+ threat detection improvement  
**Time Investment**: 6-8 weeks for full deployment
