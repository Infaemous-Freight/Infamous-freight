# Container Security and Scanning

This guide explains how container vulnerability scanning works and what to do
when vulnerabilities are detected.

## Overview

**What**: Automated scanning of Docker images for known vulnerabilities **How**:
Trivy scanner in GitHub Actions **When**: On every Dockerfile change,
package.json update, and daily **Why**: Prevent deploying vulnerable
dependencies to production

## How It Works

### Scanning Pipeline

```
Dockerfile Change
       ↓
GitHub Actions Triggered
       ↓
Build Docker Image
       ↓
Scan with Trivy (CVE Database)
       ↓
Generate SBOM (Software Bill of Materials)
       ↓
Upload SARIF Report to GitHub Security
       ↓
Block Deployment if Critical Found
```

### Scanning Coverage

**Images Scanned**:

1. **API** (`apps/api/Dockerfile`)
   - Node.js runtime
   - npm dependencies
   - System packages

2. **Web** (`apps/web/Dockerfile`)
   - Node.js runtime
   - npm dependencies
   - Next.js framework

## Vulnerability Severity Levels

| Severity     | CVSS Score | Action             | Block CI? |
| ------------ | ---------- | ------------------ | --------- |
| **CRITICAL** | 9.0-10.0   | Fix immediately    | ✅ Yes    |
| **HIGH**     | 7.0-8.9    | Fix before release | ✅ Yes    |
| **MEDIUM**   | 4.0-6.9    | Plan fix           | ❌ No     |
| **LOW**      | 0.1-3.9    | Monitor            | ❌ No     |

## Responding to Vulnerabilities

### Step 1: View Results in GitHub

1. Go to repository → **Security** tab
2. Click **Code scanning** or **Security summary**
3. View Trivy scan results
4. Filter by severity if needed

### Step 2: Understand the Vulnerability

```
Vulnerability Details Show:
- Package name and version
- CVE ID (e.g., CVE-2024-1234)
- Vulnerability description
- CVSS score and severity
- Affected versions
- Fixed version
```

Click CVE ID to view official details at [nvd.nist.gov](https://nvd.nist.gov)

### Step 3: Fix the Vulnerability

#### Option A: Update Package (Recommended)

```bash
# Update npm package
npm update vulnerable-package@latest

# Test
npm test
npm run lint

# Commit
git add package.json package-lock.json
git commit -m "fix: update vulnerable-package to patch CVE-XXXX"
git push
```

#### Option B: Update OS Package

For system vulnerabilities (OS-level):

```dockerfile
# In Dockerfile, update base image
FROM node:24-alpine3.22  # Latest stable + latest Alpine

# Rebuild image
docker build -t myapp:latest .
```

#### Option C: Accept Known Risk (Last Resort)

If no fix exists or fix has breaking changes:

1. Document why it's acceptable
2. Create GitHub Issue with:
   - CVE ID
   - Reason for acceptance
   - Planned resolution date
   - Risk mitigation steps

3. Create `.trivyignore` file:

```
# .trivyignore
# Ignoring CVE-2024-1234 in vulnerable-package
# Reason: Patch not yet released, workaround in place
# Planned fix: Update on 2025-02-01
CVE-2024-1234
```

### Step 4: Verify Fix

After updating:

1. Commit changes
2. Push to feature branch
3. Create Pull Request
4. Wait for GitHub Actions to run Trivy scan
5. Verify no new vulnerabilities introduced

## SBOM (Software Bill of Materials)

### What is it?

Complete inventory of all components in Docker image:

- Direct dependencies (npm packages)
- Transitive dependencies (dependencies of dependencies)
- System packages (from Alpine/Debian base)
- Versions and licenses

### Where to Find It

1. Go to GitHub Actions → Latest workflow run
2. Download "Container SBOM" artifact
3. Files included:
   - `api-sbom.json` - API image inventory
   - `web-sbom.json` - Web image inventory

### Using SBOM

**License Compliance:**

```bash
# View licenses in image
grep -i "license" api-sbom.json

# Check for GPL dependencies
grep -i "GPL" api-sbom.json
```

**Dependency Updates:**

```bash
# See all versions used
cat api-sbom.json | jq '.components[] | .name + "@" + .version'
```

**Supply Chain Security:**

- Keep SBOM for audit trails
- Share with security/compliance team
- Use for vulnerability impact analysis

## Automated Scanning Schedule

Scans run:

- **On Push**: Every Dockerfile or package.json change to main/develop
- **On PR**: When code changes to validate security before merge
- **Daily**: 2 AM UTC to catch new vulnerabilities

View schedule in
[`.github/workflows/container-security.yml`](.github/workflows/container-security.yml)

## Performance

### Scan Times

- API image: ~2-3 minutes
- Web image: ~2-3 minutes
- SBOM generation: ~1 minute
- Total: ~5 minutes per run

### Caching

Docker layers are cached to speed up builds:

- First scan: ~5 minutes
- Subsequent scans: ~2-3 minutes

## Configuring Scan Strictness

In `.github/workflows/container-security.yml`:

```yaml
# Current (strictest - blocks on CRITICAL/HIGH)
severity: CRITICAL,HIGH
exit-code: 1  # Fail if vulnerabilities found

# To be less strict:
severity: CRITICAL          # Only CRITICAL
exit-code: 0               # Don't fail (warning only)
```

## Best Practices

### 1. Update Base Image Regularly

```dockerfile
# Alpine (smallest, fastest to scan)
FROM node:24-alpine

# OR Debian-slim (more tested, larger)
FROM node:24-slim

# ❌ Avoid: outdated/pinned versions
FROM node:24.0.0-alpine  # Overly pinned; prefer tracked `node:24-alpine`
```

Schedule base image updates monthly.

### 2. Minimize Layers

More layers = more potential vulnerabilities:

```dockerfile
# ✅ Good: combined commands
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ❌ Bad: separate RUN commands
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean
```

### 3. Remove Build Tools

Don't include build tools in production image:

```dockerfile
# ✅ Multi-stage build (no build tools in final image)
FROM node:24-alpine AS builder
WORKDIR /build
COPY package*.json .
RUN npm ci --omit=dev

FROM node:24-alpine
COPY --from=builder /build /app
CMD ["node", "server.js"]

# ❌ Single stage (includes build tools, larger attack surface)
FROM node:24-alpine
RUN npm install
CMD ["node", "server.js"]
```

### 4. Pin Dependencies

```json
{
  "dependencies": {
    "express": "4.18.2", // ✅ Exact version
    "lodash": "~4.17.21" // ✅ Patch updates only
  },
  "devDependencies": {
    "jest": "^29.5.0" // ✅ Minor/patch updates
  }
}
```

### 5. Keep npm Updated

```bash
npm install -g npm@latest
npm update              # Update to latest compatible
npm audit fix --force   # Fix vulnerabilities (breaking changes possible)
```

## Troubleshooting

### Workflow Fails on CRITICAL Vulnerability

**Problem**: Deployment blocked by new critical CVE

**Solution**:

1. Review vulnerability details in Security tab
2. Run locally: `npm audit` to see details
3. Update vulnerable package
4. Re-run workflow

```bash
npm update vulnerable-package
npm audit  # Verify fixed
git add package.json package-lock.json
git commit -m "fix: update to patch CVE-XXXX"
git push
```

### False Positives

**Problem**: Trivy reports vulnerability that's not exploitable in your context

**Solution**:

1. Document in GitHub Issue why it's not applicable
2. Add to `.trivyignore` with explanation
3. Plan long-term fix

```
# .trivyignore
# CVE-2024-1234 in xml package
# Context: Library parses trusted internal XML only
# No network exposure, no user input to parser
# Waiting for patch release: ETA 2025-02-01
CVE-2024-1234
```

### Scan Takes Too Long

**Problem**: Container scanning job timeout

**Solution**:

- Check job timeout in workflow (currently 30 min)
- Reduce Docker image size
- Enable caching (already enabled)
- Run on self-hosted runner (for large repos)

### Missing SBOM

**Problem**: SBOM artifact not generated

**Solution**:

- Verify Dockerfile exists
- Check workflow permissions (needs to write artifacts)
- Re-run workflow manually

## Compliance and Reporting

### Weekly Report Template

```markdown
## Container Security Report - Week of [DATE]

### Critical Vulnerabilities: 0

### High Vulnerabilities: 0

### Medium Vulnerabilities: [X]

### Low Vulnerabilities: [X]

### Actions Taken

- [Updated package X to patch CVE-XXXX]
- [Added .trivyignore entry for CVE-YYYY]

### Upcoming Work

- [Plan to update Node.js base image by DATE]
- [Monitor CVE-ZZZZ pending patch release]
```

### Annual Audit

Keep record of:

- All vulnerabilities discovered
- Time to patch each severity
- Incidents caused by known vulnerabilities
- SBOM history for license compliance

## Resources

- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CVE Details](https://www.cvedetails.com/)
- [National Vulnerability Database](https://nvd.nist.gov/)
- [Container Security Best Practices](https://container-security.dev/)
- [SBOM Specification (SPDX)](https://spdx.dev/)

---

**Last Updated**: December 13, 2025 **Status**: Production-ready
**Maintenance**: Monitor daily for new vulnerabilities, update dependencies
monthly
