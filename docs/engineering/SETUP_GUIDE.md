# Branch Protection & GitHub Environment Setup Guide

This guide provides step-by-step instructions for configuring branch protection
rules and GitHub environments that cannot be set via code.

---

## 🛡️ Branch Protection Rules Setup

### Step 1: Navigate to Branch Protection Settings

1. Go to repository on GitHub:
   <https://github.com/MrMiless44/Infamous-freight-enterprises>
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Under "Branch protection rules", click **Add rule**

### Step 2: Configure Protection for `main` Branch

**Branch name pattern:** `main`

#### ✅ Enable These Settings

**Protect matching branches:**

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners
  - [ ] Require approval of the most recent reviewable push

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks** (add these):
    - `CI/CD Pipeline / lint`
    - `CI/CD Pipeline / test (18)`
    - `CI/CD Pipeline / test (20)`
    - `CI/CD Pipeline / build-api`
    - `CI/CD Pipeline / build-web`
    - `CI/CD Pipeline / security`
    - `CI / ci`
    - `CodeQL`

- [x] **Require conversation resolution before merging**

- [x] **Require signed commits** (optional but recommended)

- [x] **Require linear history** (optional - prevents merge commits)

- [x] **Include administrators** (apply rules to admins too)

- [x] **Allow force pushes** - UNCHECK (disable force pushes)

- [x] **Allow deletions** - UNCHECK (prevent branch deletion)

### Step 3: Save Changes

Click **Create** or **Save changes** at the bottom.

---

## 🌍 GitHub Environments Setup

### Environment 1: `production-render` (API Deployment)

#### Step 1: Create Environment

1. Go to Settings → Environments
2. Click **New environment**
3. Name: `production-render`
4. Click **Configure environment**

#### Step 2: Configure Environment Protection Rules

- [x] **Required reviewers**
  - Add: `@MrMiless44` (or DevOps team members)
  - Number of reviewers: **1**

- [x] **Wait timer**: **0 minutes** (or set delay if needed)

- [ ] **Deployment branches**: Only allow deployments from `main` branch
  - Select: **Selected branches**
  - Add rule: `main`

#### Step 3: Add Environment Secrets (if different from repo secrets)

- `RENDER_DEPLOY_HOOK_URL` (if environment-specific)

#### Step 4: Set Environment URL

- Deployment URL: `https://infamous-freight-api.render.com`

Click **Save protection rules**

---

### Environment 2: `production-vercel` (Web Deployment)

#### Step 1: Create Environment

1. Go to Settings → Environments
2. Click **New environment**
3. Name: `production-vercel`
4. Click **Configure environment**

#### Step 2: Configure Environment Protection Rules

- [x] **Required reviewers**
  - Add: `@MrMiless44` (or Web team members)
  - Number of reviewers: **1**

- [x] **Wait timer**: **0 minutes**

- [ ] **Deployment branches**: Only allow deployments from `main` branch
  - Select: **Selected branches**
  - Add rule: `main`

#### Step 3: Add Environment Secrets

- `VERCEL_TOKEN` (if environment-specific)
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_API_URL`

#### Step 4: Set Environment URL

- Deployment URL: `https://infamous-freight-enterprises.vercel.app`

Click **Save protection rules**

---

### Environment 3: `staging` (Optional - For Pre-Production)

Follow same steps as production environments but:

- Name: `staging`
- Required reviewers: **0** (or 1 if you want review)
- Deployment branches: `develop` or `staging`
- Use staging-specific secrets

---

## 🔔 Notification Setup (Optional)

### Slack Integration

#### Step 1: Install GitHub App for Slack

1. Go to: <https://github.com/marketplace/slack-github>
2. Click **Set up a plan** (Free)
3. Install on `Infamous-freight-enterprises` repository
4. Follow Slack authorization

#### Step 2: Subscribe to Events in Slack Channel

In your Slack channel:

```
/github subscribe MrMiless44/Infamous-freight-enterprises
/github subscribe MrMiless44/Infamous-freight-enterprises deployments
/github subscribe MrMiless44/Infamous-freight-enterprises workflows:{event:"push" branch:"main"}
```

#### Step 3: Customize Notifications

```
/github subscribe MrMiless44/Infamous-freight-enterprises workflows
/github unsubscribe MrMiless44/Infamous-freight-enterprises commits
/github unsubscribe MrMiless44/Infamous-freight-enterprises issues
```

---

## 📧 Email Notifications

### Configure in GitHub Settings

1. Go to: <https://github.com/settings/notifications>
2. **Actions**:
   - [x] Send notifications for failed workflows only
   - [x] Email
3. **Watching**:
   - Set `Infamous-freight-enterprises` to "All Activity"

---

## ✅ Verification Checklist

After setup, verify:

**Branch Protection:**

- [ ] Try to push directly to `main` - should be blocked
- [ ] Try to merge PR without approval - should be blocked
- [ ] Try to merge PR with failing checks - should be blocked
- [ ] Force push to `main` - should be blocked

**Environments:**

- [ ] Trigger deployment to `production-render` - should require approval
- [ ] Trigger deployment to `production-vercel` - should require approval
- [ ] Check environment URL is shown in deployment
- [ ] Verify secrets are available in environment

**Notifications:**

- [ ] Slack receives deployment notifications
- [ ] Email receives failure notifications
- [ ] Notifications are not too noisy

---

## 🔧 Troubleshooting

### Branch Protection Not Working

- Check that rule pattern matches exactly: `main`
- Verify you're not an excluded admin (if "Include administrators" unchecked)
- Wait 5-10 minutes for rules to propagate

### Environment Not Requiring Approval

- Verify "Required reviewers" is set
- Check that workflow uses `environment:` key correctly
- Ensure deployment is from correct branch

### Notifications Not Received

- Check spam/junk folder
- Verify notification settings in GitHub profile
- For Slack, verify app is installed and subscribed

---

## 📚 Additional Resources

- [Branch Protection Documentation](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Environments Documentation](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Required Status Checks](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-status-checks-before-merging)
- [Code Owners](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**Setup Time:** ~30 minutes **Last Updated:** December 31, 2025 **Maintained
By:** DevOps Team
