# GitHub Security Settings & Branch Protection - Setup Guide

**Status:** To Be Completed This Week  
**Owner:** Project Owner  
**Timeline:** 15-20 minutes  
**Audience:** Anyone with admin access to GitHub repo

---

## Quick Start

This guide walks through enabling all GitHub security features for Infamous
Freight repo. **Estimated Time:** 15-20 minutes  
**Difficulty:** Easy (all UI clicks, no coding)

---

## Part 1: Enable GitHub Security Features

### Step 1: Go to Repository Settings

1. Go to: https://github.com/MrMiless44/Infamous-freight
2. Click: **Settings** (top right, next to "Code")
3. Left sidebar, click: **Security & Analysis** or **Security**

**What you should see:**

```
GitHub Repository
├─ Settings
│  ├─ General
│  ├─ Branches
│  ├─ Collaborators
│  ├─ Security & Analysis ← YOU ARE HERE
│  └─ ...
```

### Step 2: Enable Dependabot Alerts

**Location:** Settings → Security & Analysis → Dependabot Alerts

**Find:** "Dependabot alerts" section

**Current State:** Check if enabled or disabled  
**Action:** Click toggle **ON** ✅

**What it does:**

- GitHub monitors dependencies automatically
- Alerts you when vulnerabilities discovered
- Shows up in Security tab

**Result:** You'll get notifications like:

```
⚠️  Lodash vulnerability found
Severity: Moderate
Fixed version: 4.17.21
```

### Step 3: Enable Dependabot Security Updates

**Location:** Settings → Security & Analysis → Dependabot Security Updates

**Find:** "Dependabot security updates" section

**Current State:** Check if enabled or disabled  
**Action:** Click toggle **ON** ✅

**What it does:**

- Automatically creates PRs to fix vulnerabilities
- Only for security vulnerabilities
- You review &merge the PR

**Result:** Automatic PRs like:

```
Bump lodash from 4.17.20 to 4.17.21
vulnerability fix
```

### Step 4: Enable Secret Scanning

**Location:** Settings → Security & Analysis → Secret Scanning

**Find:** "Secret scanning" section

**Current State:** Check if enabled or disabled  
**Action:** Click toggle **ON** ✅

**What it does:**

- Scans code for leaked secrets (API keys, passwords, tokens)
- Alerts you if secrets found
- Prevents accidental credential exposure

**Result:** You'll get alerts like:

```
🔑 Potential secret found
Type: GitHub Token
Location: api/src/config.js:42
```

### Step 5: Enable Secret Scanning - Push Protection

**Location:** Settings → Security & Analysis → Secret Scanning

**Find:** "Push protection" section (below Secret Scanning)

**Current State:** Check if enabled or disabled  
**Action:** Click toggle **ON** ✅

**What it does:**

- **Prevents** commits with secrets from being pushed
- Blocks commit locally before it reaches GitHub
- Much more effective than alerts after the fact

**Result:** When you try to push with secret:

```
❌ Push rejected
Reason: Potential secret found
- GitHub Token detected in commit

Fix this before pushing!
```

### Step 6: Enable Code Scanning with CodeQL

**Location:** Settings → Security & Analysis → Code Scanning

**Find:** "Code scanning" section

**Current State:** Check if enabled or disabled  
**Action:** Click the "Set up" or "Enable" button

**Config:** If prompted, select:

- [ ] ✅ CodeQL (recommended)
- [ ] Leave other options as default

**What it does:**

- Analyzes code for security vulnerabilities
- Runs on every push to main
- Finds: SQL injection risks, XSS, insecure crypto, etc.

**Result:** Automatic scan after every commit:

```
CodeQL Analysis Results:
- 2 High severity issues found
- 5 Medium severity issues found
```

---

## Part 2: Branch Protection Rules

### Step 7: Set Up Branch Protection for `main`

**Location:** Settings → Branches

**Find:** "Branch protection rules" section

**Action:** Click **Add rule** (or **Edit** if already exists)

**Rule Details:**

**Pattern to protect:** `main`  
(This protects the main branch)

### Step 8: Configure Protection Settings

**Create the rule with these settings:**

**Basic:**

- [ ] ✅ **Require pull request reviews before merging**
  - Required number of reviews: **2**
  - [ ] ✅ Require code review from code owners
  - [ ] ✅ Dismiss stale pull request approvals

- [ ] ✅ **Require status checks to pass before merging**
  - [ ] ✅ Require branches to be up to date before merging
  - **Status checks that must pass:**
    - [ ] ✅ `lint` (or ESLint / Prettier)
    - [ ] ✅ `test` (or Jest test suite)
    - [ ] ✅ `type-check` (TypeScript)
    - [ ] ✅ `build` (API + Web build)
    - [ ] ✅ `security` (CodeQL)

**Advanced:**

- [ ] ✅ **Require conversation resolution before merging**
  - (Forces resolving comments before merge)

- [ ] ✅ **Require signed commits**
  - (Only signed commits can be pushed)
  - (Optional but recommended for security)

- [ ] ✅ **Include administrators**
  - (Even admins follow the same rules)

### Step 9: Save the Branch Protection Rule

**Click:** **Create** (or **Update**)

**Verify:** You should see:

```
✅ main branch is now protected
  - Requires 2 PR approvals
  - Requires all checks passing
  - Requires up-to-date commits
```

---

## Part 3: Enforce in GitHub

### Step 10: Set up CODEOWNERS File (Optional but Recommended)

**Purpose:** Automatically request reviews from specific people

**File Location:** Create `.github/CODEOWNERS` in your repo

**Content:**

```
# Backend changes require backend-lead review
/api/** @MrMiless44
/api/src/routes/** @yourself-backend-lead

# Frontend changes require frontend-lead review
/web/** @yourself-frontend-lead

# Shared package requires either
/packages/shared/** @yourself-backend-lead @yourself-frontend-lead

# Test changes require tech-lead
/**/*.test.ts @tech-lead
```

**How to create:**

1. Go to your repo
2. Click: Code → New file
3. Name it: `.github/CODEOWNERS`
4. Paste content above (customize names)
5. Commit: "chore: Add CODEOWNERS for automatic review assignment"

---

## Part 4: Verification Checklist

### Before Declaring "Complete"

**Security Features Enabled:**

- [ ] ✅ Dependabot alerts: **ON**
- [ ] ✅ Dependabot security updates: **ON**
- [ ] ✅ Secret scanning: **ON**
- [ ] ✅ Secret scanning push protection: **ON**
- [ ] ✅ CodeQL analysis: **ON**

**Branch Protection:**

- [ ] ✅ `main` branch protected
- [ ] ✅ Requires 2 PR approvals
- [ ] ✅ Requires status checks passing
- [ ] ✅ Requires up-to-date branches
- [ ] ✅ Dismisses stale approvals

**Additional:**

- [ ] ✅ CODEOWNERS file created
- [ ] ✅ Test commit: Create test PR to verify rules work

---

## Part 5: Test the Setup

### Create a Test PR to Verify Everything Works

**Step 1: Create Test Branch**

```bash
git checkout -b test/verify-security-setup
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify security setup"
git push origin test/verify-security-setup
```

**Step 2: Go to GitHub**

1. GitHub auto-detects the branch
2. Shows: **"Compare & pull request"** button
3. Click it to create a PR

**Step 3: Verify Protection Rules Are Working**

You should see:

```
✅ Status checks running
   ├─ Linting... (in progress)
   ├─ Tests... (in progress)
   ├─ Build... (in progress)
   └─ Security scan... (in progress)

⚠️ Cannot merge yet
   ├─ Waiting for status checks
   ├─ Need 2 code review approvals
   └─ Branch needs to be up to date
```

**Step 4: Wait for Checks**

- All checks turn green ✅ (usually 2-5 minutes)
- Now you can request reviews

**Step 5: Request Reviews**

1. Click: **Request reviewers** (right panel)
2. Add 2 team members
3. They'll get notified to review

**Step 6: Get Approvals**

- Teammates click **Approve** (2 needed)
- Merge button becomes active ✅

**Step 7: Merge Test PR**

- Click: **Merge pull request**
- Delete branch after merge

**Step 8: Clean Up**

```bash
git checkout main
git pull origin main
git branch -d test/verify-security-setup
```

---

## Part 6: Common Issues & Troubleshooting

### Issue 1: "CodeQL Analysis Not Available"

**Symptom:** CodeQL toggle doesn't appear or says "unavailable"

**Solution:**

1. Make sure repo is public OR
2. You have GitHub Pro/Enterprise (for private repos)
3. Try: Settings → Code security & analysis → Check status

**Workaround:** Use GitHub Actions to run CodeQL instead (more advanced)

### Issue 2: "Status Checks Not Showing Up"

**Symptom:** Can't select status checks in branch protection rule

**Solution:**

1. Make sure checks are configured to run (GitHub Actions)
2. The checks must have run at least once
3. Try: Run a test commit push to trigger checks

**Timeline:** First-time workflow run takes 2-5 minutes

### Issue 3: "Can't Add 2+ Reviewers"

**Symptom:** Branch protection only lets me require 1 reviewer

**Solution:**

1. Check GitHub tier (GitHub Free doesn't support 2+ reviewers)
2. Upgrade to GitHub Pro/Team/Enterprise if needed
3. Or: Use CODEOWNERS file (works on free tier)

---

## Part 7: Explanation of Each Security Feature

### Why Each Feature Matters

| Feature                | Why Important                         | What It Catches                         |
| ---------------------- | ------------------------------------- | --------------------------------------- |
| **Dependabot Alerts**  | Attacks exploit known vulnerabilities | npm package with security flaw          |
| **Dependabot Updates** | Auto-fixes vulnerabilities            | Old lodash version with XSS risk        |
| **Secret Scanning**    | Prevent credential leaks              | Accidentally committed API key          |
| **Push Protection**    | Stop leaks BEFORE they reach GitHub   | Blocks push if AWS key found            |
| **CodeQL**             | Find code-level bugs early            | SQL injection risk in query             |
| **Branch Protection**  | Enforce quality standards             | Ensures code reviewed before production |
| **Status Checks**      | Verify tests still pass               | Merge that breaks tests blocked         |

---

## Part 8: Maintenance & Monitoring

### Weekly Task (5 minutes)

**Check:** Settings → Security tab

Look for:

- [ ] Any new Dependabot alerts? (Fix if needed)
- [ ] Any CodeQL warnings? (Review + resolve)
- [ ] Any secret scanning alerts? (Immediate action if yes)

### Quarterly Review (30 minutes)

**Quarterly review + update:**

```markdown
- Any new GitHub security features to enable?
- Any branch protection rules to adjust?
- Dependabot PR volume too high? Adjust settings
- False positives in CodeQL? Tune rules
```

### Escalation Path

**If suspicious activity detected:**

1. **High Risk:** Secret exposed → Rotate all credentials immediately
2. **High Risk:** Code injection found → Emergency patch deployment
3. **Medium Risk:** Dependabot alerts →Next sprint review
4. **Low Risk:** CodeQL warning → Add to backlog

---

## Summary: What You've Enabled

After completing this guide, your GitHub repo will have:

✅ **Automated Vulnerability Detection**

- Dependencies scanned 24/7
- Secrets scanned on every push
- Code analyzed for security issues

✅ **Automated Remediation**

- Dependabot PRs fix vulnerabilities automatically
- Push protection prevents secret leaks
- CodeQL findings fed to dev dashboard

✅ **Enforced Quality Gates**

- All commits must pass tests + linting + type check
- All merges require 2+ approvals
- Main branch always stays in healthy state

✅ **Audit Trail**

- Every merge is reviewed & approved
- Security issues are logged
- Enables SOC 2/ISO 27001 compliance

---

## Quick Reference Card

### Print & Post This

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GITHUB SECURITY SETUP - QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SECURITY FEATURES ENABLED:
   ☑ Dependabot Alerts
   ☑ Dependabot Security Updates
   ☑ Secret Scanning
   ☑ Secret Scanning Push Protection
   ☑ CodeQL Analysis

✅ BRANCH PROTECTION RULES:
   ☑ Main branch protected
   ☑ Requires 2 PR reviews
   ☑ Requires all status checks passing
   ☑ Requires up-to-date commits
   ☑ Dismisses stale pull requests

📋 BEFORE YOU MERGE:
   □ All tests passing
   □ No TypeScript errors
   □ No linting issues
   □ 2+ team members approve
   □ Branch is up to date with main

🔐 IF YOU SEE A SECRET ALERT:
   1. Don't dismiss - secrets are serious!
   2. Rotate credentials immediately
   3. Check if exposed in commit history
   4. Force-push if needed
   5. Update all systems using that credential

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Document Version:** 1.0  
**Created:** January 27, 2026  
**Setup Time:** ~20 minutes  
**Maintenance:** 5 min/week  
**Owner:** Project Owner  
**Next Review:** Q2 2026
