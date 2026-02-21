# Secret Exposure Scanning & Prevention

**Status**: ⚠️ ACTION REQUIRED - Suspected Secrets Detected  
**Date**: February 19, 2026  
**Priority**: CRITICAL - Fix immediately before production deployment

---

## 1. Secret Detection Procedures

### Immediate Scan for Exposed Secrets

```bash
# Method 1: Search git history for common patterns
git log -p | grep -iE "(password|secret|token|api.?key|private.?key)" | head -50

# Method 2: Search current files
grep -r -iE "(password\s*=|secret\s*=|token\s*=|api.?key\s*=)" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude="*.lock" \
  --exclude="*.log"

# Method 3: Use git secrets
git log --all -p | grep -iE "secret|password|token" > exposed-secrets.txt

# Method 4: Use truffleHog (if installed)
trufflehog filesystem . --json > secrets-report.json
```

### If Secrets Found

1. **Immediate Actions** (5 minutes):
   ```bash
   # Stop deployment
   # Alert security team
   # Take systems offline if needed
   ```

2. **Identify ALL Instances** (10 minutes):
   ```bash
   # Find all occurrences
   git log -p -S "suspected_secret" --all
   
   # Check which commits introduced it
   git log --oneline -S "suspected_secret" --all
   ```

3. **Rotate Compromised Credentials** (30 minutes):
   - Database passwords
   - API keys
   - SSH keys
   - Database connection strings
   - Third-party service tokens

4. **Remove From History** (1 hour):
   ```bash
   # WARNING: This rewrites history - only if secrets found
   
   # Option 1: Use BFG Repo Cleaner
   brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/
   bfg --delete-files secret.txt --no-blob-protection
   git reflog expire --expire=now --all  
   git gc --prune=now --aggressive
   
   # Option 2: Use git filter-branch (slower but native)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch SECRET_VALUE' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (DANGEROUS - requires admin privileges)
   git push origin --force --all
   git push origin --force --tags
   ```

---

## 2. Prevention Mechanisms

### Pre-Commit Hook to Block Secrets

**File**: `.githooks/pre-commit-secrets`
```bash
#!/bin/bash
# Pre-commit hook to prevent committing secrets

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Patterns to block
PATTERNS=(
  "password\s*="
  "secret\s*="
  "api.?key\s*="
  "private.?key\s*="
  "aws_api_key_id"
  "aws_api_secret_key"
  "PRIVATE KEY"
  "BEGIN RSA"
  "BEGIN DSA"
  "BEGIN EC"
  "BEGIN OPENSSH"
)

# Check staged files
STAGED_FILES=$(git diff --cached --name-only)

FOUND_SECRETS=0

for FILE in $STAGED_FILES; do
  # Skip certain file types
  if [[ $FILE == *.lock || $FILE == *.log || $FILE == ./node_modules* ]]; then
    continue
  fi

  # Check for each pattern
  for PATTERN in "${PATTERNS[@]}"; do
    if git diff --cached "$FILE" | grep -iE "$PATTERN" > /dev/null; then
      echo -e "${RED}❌ Potential secret detected in: $FILE${NC}"
      echo -e "   Pattern: $PATTERN"
      echo -e "${YELLOW}   Commit aborted${NC}"
      FOUND_SECRETS=1
    fi
  done
done

if [ $FOUND_SECRETS -eq 1 ]; then
  echo -e "${RED}❌ COMMIT BLOCKED: Potential secrets found${NC}"
  echo ""
  echo "If this is a false positive:"
  echo "  git commit --no-verify"
  echo ""
  echo "Otherwise, remove the secret and try again."
  exit 1
fi

echo -e "${GREEN}✓ No secrets detected${NC}"
exit 0
```

Enable hook:
```bash
chmod +x .githooks/pre-commit-secrets
git config core.hooksPath .githooks
```

### GitHub Actions Secret Scanning

**File**: `.github/workflows/secret-scanning.yml`
```yaml
name: Secret Scanning

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 * * * *" # Hourly

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    name: Secret Detection

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Secret Scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug

      - name: Gitleaks Scanning
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Detect Secrets
        uses: detectsecrets/action@v0.13.0
        with:
          baseline: .secrets.baseline
          publish: true
```

### Environment Variable Protection

**File**: `.env.example`
```
# NEVER commit actual secrets - use .env.local for local development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# API Keys (use GitHub Secrets for production)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_API_KEY=sk_live_...

# JWT Secret (rotate regularly)
AUTH_SECRET=your-super-secret-jwt-key-here

# Third-party services
SENTRY_DSN=https://...
DATADOG_API_KEY=...
```

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
secrets.json
*.pem
*.key
*.crt
.aws/credentials
```

---

## 3. Secrets Management Strategy

### Development Environment

```bash
# Create .env.local (DO NOT COMMIT)
cp .env.example .env.local

# Edit with real values
cd apps/api
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/db" >> .env.local
echo "AUTH_SECRET=dev-secret-key" >> .env.local

# Load in shell
export $(cat .env.local | xargs)
```

### Staging/Production Environment

Use GitHub Secrets:

1. **Add Secret**:
   - GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DATABASE_URL`
   - Value: `postgresql://...` (real connection string)

2. **Reference in Workflow**:
   ```yaml
   - name: Deploy
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
       OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
     run: pnpm deploy
   ```

3. **Use in Application**:
   ```javascript
   // Uses process.env.DATABASE_URL from GitHub Secrets
   const dbUrl = process.env.DATABASE_URL;
   ```

### Advanced: HashiCorp Vault Integration

For larger teams, consider Vault:

```yaml
- name: Import secrets from Vault
  uses: hashicorp/vault-action@v2
  with:
    url: https://vault.example.com
    method: jwt
    role: my-role
    path: secret/data/my-app
    secrets: |
      database_url;
      api_key;
      auth_token
```

---

## 4. Credential Rotation Schedule

| Credential | Type | Rotation | Last Rotated |
|------------|------|----------|--------------|
| AUTH_SECRET | Encryption | Monthly | Feb 2026 |
| DATABASE_PASSWORD | Auth | Quarterly | Feb 2026 |
| API_KEYS | Auth | Quarterly | Feb 2026 |
| SSH_KEY | Auth | Annually | Feb 2025 |
| Certificates | PKI | Annually | Feb 2025 |

**Rotations to perform before deployment**:
- [ ] AUTH_SECRET - rotate and update all instances
- [ ] DATABASE_PASSWORD - rotate in all environments
- [ ] All third-party API keys - rotate each service
- [ ] SSH keys for deployment - rotate if old
- [ ] GitHub Personal Access Tokens - check age

---

## 5. Incident Response

If secrets are exposed:

### Immediately (5 minutes)
1. Stop all deployments
2. Alert security team
3. Identify which secrets were exposed
4. Begin credential rotation

### Urgent (30 minutes)
1. Rotate all exposed credentials
2. Revoke old tokens
3. Update GitHub Secrets
4. Scan logs for unauthorized access

### Short-term (1-2 hours)
1. Remove secrets from git history
2. Force-push cleaned history (if necessary)
3. Notify affected systems/users
4. Update deployment secrets

### Long-term (1-7 days)
1. Post-incident analysis
2. Update prevention procedures
3. Team training
4. Monitor for unauthorized usage

---

## 6. Audit Trail

### Secret Access Logging

Enable in applications:
```javascript
// Log when secrets are accessed
const getSecret = (key) => {
  logger.info("Secret accessed", {
    key: key,
    timestamp: new Date(),
    user: req.user?.id,
    endpoint: req.path,
    ip: req.ip
  });
  return process.env[key];
};
```

### GitHub Secret Audit

GitHub logs all access to secrets. To review:
1. GitHub repo → Settings → Audit log
2. Filter by "secret" or "credentials"
3. Review access patterns

---

## 7. Tools for Secret Management

### Recommended Tools

| Tool | Purpose | Cost | Integration |
|------|---------|------|-------------|
| GitHub Secrets | CI/CD secrets | Free | GitHub native |
| HashiCorp Vault | Enterprise secrets | Free/Paid | Any |
| AWS Secrets Manager | AWS secrets | Pay-per-secret | AWS services |
| 1Password | Team password mgmt | $7/user/mo | Integrations |
| Doppler | Secrets platform | Free tier | Integrations |

---

## 8. Checklist Before Production

- [ ] Search entire git history for secrets
- [ ] Remove any found secrets
- [ ] Rotate all credentials
- [ ] Enable pre-commit hook for secrets
- [ ] Setup GitHub secret scanning
- [ ] Setup GitHub Actions for continuous scanning
- [ ] Document all secrets in GitHub Secrets (not in code)
- [ ] Test that application works with GitHub Secrets
- [ ] Train team on secret management
- [ ] Setup audit logging
- [ ] Create rotation schedule
- [ ] Create incident response playbook

---

## 9. Monitoring & Alerts

Enable notifications:
```yaml
# .github/dependabot.yml - Add secret scanning
security-updates:
  open-pull-requests-limit: 10
  rebase-strategy: auto
```

GitHub will alert if:
- Secrets detected in PR
- Secret patterns found in history
- Credentials exposed publicly

---

## 10. Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitGuardian](https://www.gitguardian.com/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)

---

**Status**: 🔴 MUST COMPLETE BEFORE PRODUCTION DEPLOYMENT

**Timeline**:
- Scan history: 15 minutes
- Rotate credentials: 30 minutes
- Setup prevention: 1 hour
- Total: 1.5 hours (CRITICAL PATH)

**Next Steps**:
1. Run secret scan immediately
2. Implement pre-commit hook
3. Rotate all credentials
4. Commit this file
5. Setup GitHub Actions
